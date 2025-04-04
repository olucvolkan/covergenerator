// supabase/functions/stripe-webhook/index.ts
//deno-lint-ignore-file
//deno-lint-ignore-file no-explicit-any require-await

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

const allowedOrigins = [
  'https://cvtoletter.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://cvtoletter.com',
  'https://www.cvtoletter.com',
  'http://cvtoletter.com',
  'http://covergen-wild-mountain-3122.fly.dev',
  'https://api.stripe.com',
  '*'
]

const corsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
})

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Add log entry function
async function logWebhookEvent(eventType: string, stripeEventId: string, payload: any, processed: boolean, errorMessage?: string) {
  try {
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        stripe_event_id: stripeEventId,
        payload,
        processed,
        error_message: errorMessage
      });

    if (error) {
      console.error('Error logging webhook event:', error);
    }
  } catch (err) {
    console.error('Failed to log webhook event:', err);
  }
}

export const handler = async (req: Request) => {
  console.log('Webhook received:', req.method)
  const headers = corsHeaders()
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request')
    return new Response('ok', { headers })
  }

  try {
    const body = await req.text()
    console.log('Request body:', body.substring(0, 100) + '...')
    console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2))
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
    console.log('Webhook secret:', webhookSecret ? 'Present' : 'Missing')
    
    if (!webhookSecret) {
      console.error('Webhook signing secret is not configured')
      await logWebhookEvent('unknown', 'none', {}, false, 'Webhook signing secret is not configured');
      throw new Error('Webhook signing secret is not configured')
    }

    // Get the signature from the Stripe-Signature header
    const signature = req.headers.get('Stripe-Signature') || req.headers.get('stripe-signature')
    console.log('Stripe signature:', signature ? 'Present' : 'Missing')

    if (!signature) {
      console.error('No stripe signature found in request')
      await logWebhookEvent('unknown', 'none', {}, false, 'No signature found');
      return new Response('No signature found', { 
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400 
      })
    }

    console.log('Constructing Stripe event...')
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('Webhook event received:', event.type)

    // Log event receipt
    await logWebhookEvent(event.type, event.id, event.data.object, false);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clientReferenceId = session.client_reference_id
        const customerId = session.customer as string
        
        if (!clientReferenceId) {
          await logWebhookEvent('unknown', event.id, session, false, 'No user ID found in session');
          throw new Error('No user ID found in session')
        }
        
        console.log('Processing completed checkout for user:', clientReferenceId)
        
        // Get credits from session metadata or payment intent
        let credits = 0
        
        // First try to get from session metadata
        if (session.metadata && session.metadata.credits) {
          credits = parseInt(session.metadata.credits, 10)
        }
        
        // If not found in session metadata, try payment intent
        if (!credits && session.payment_intent) {
          const paymentIntentId = 
            typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent.id
          
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
          
          if (paymentIntent.metadata && paymentIntent.metadata.credits) {
            credits = parseInt(paymentIntent.metadata.credits, 10)
          }
        }
        
        // Fallback if metadata is missing - lookup by price
        if (!credits && session.line_items) {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          
          if (lineItems.data && lineItems.data.length > 0) {
            const item = lineItems.data[0]
            
            // Map prices to credits based on your plan
            const starterPriceId = Deno.env.get('NEXT_PUBLIC_STRIPE_PRICE_STARTER') || '';
            const basicPriceId = Deno.env.get('NEXT_PUBLIC_STRIPE_PRICE_BASIC') || '';
            const premiumPriceId = Deno.env.get('NEXT_PUBLIC_STRIPE_PRICE_PREMIUM') || '';
            const enterprisePriceId = Deno.env.get('NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE') || '';
            
            const priceToCredits: Record<string, number> = {
              [starterPriceId]: 5,    // Starter
              [basicPriceId]: 15,   // Basic
              [premiumPriceId]: 35,   // Premium
              [enterprisePriceId]: 100   // Enterprise
            }
            
            if (item.price && item.price.id) {
              credits = priceToCredits[item.price.id] || 0
            }
          }
        }

        if (!credits) {
          await logWebhookEvent('unknown', event.id, session, false, 'Could not determine credits amount');
          throw new Error('Could not determine credits amount')
        }
        
        console.log(`Adding ${credits} credits to user ${clientReferenceId}`)
        
        // Update user's profile with credits and stripe customer ID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', clientReferenceId)
          .single()
          
        if (profileError) {
          console.error('Error fetching profile:', profileError)
          throw profileError
        }
        
        const currentCredits = profile?.credits || 0
        const newCredits = currentCredits + credits
        
        const { error } = await supabase
          .from('profiles')
          .update({
            credits: newCredits,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientReferenceId)

        if (error) {
          await logWebhookEvent(event.type, event.id, session, false, error.message);
          console.error('Error updating profile with credits:', error)
          throw error
        }
        
        // Log successful processing
        await logWebhookEvent(event.type, event.id, session, true);
        console.log(`Successfully updated user ${clientReferenceId} to ${newCredits} credits`)
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await logWebhookEvent(event.type, event.id, paymentIntent, true);
        console.log('Payment intent succeeded:', paymentIntent.id)
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
        await logWebhookEvent(event.type, event.id, paymentIntent, false, errorMessage);
        console.error('Payment failed:', paymentIntent.id, errorMessage)
        break
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    // Log error
    await logWebhookEvent(
      err instanceof Error ? err.name : 'unknown',
      'error',
      {},
      false,
      err instanceof Error ? err.message : 'Unknown error'
    );

    console.error('Error processing webhook:', err)
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}