// supabase/functions/credits-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0'

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

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    await logWebhookEvent('unknown', 'none', {}, false, 'No signature found');
    return new Response('No signature found', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')
    
    if (!webhookSecret) {
      await logWebhookEvent('unknown', 'none', {}, false, 'Webhook signing secret is not configured');
      throw new Error('Webhook signing secret is not configured')
    }
    
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
          throw new Error('No user ID found in session')
        }
        
        console.log('Processing completed checkout for user:', clientReferenceId)
        
        // Get payment intent to access metadata
        let credits = 0
        
        if (session.payment_intent) {
          const paymentIntentId = 
            typeof session.payment_intent === 'string' 
              ? session.payment_intent 
              : session.payment_intent.id
          
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
          
          // Extract credits from metadata
          if (paymentIntent.metadata && paymentIntent.metadata.credits) {
            credits = parseInt(paymentIntent.metadata.credits, 10)
          }
        }
        
        // Fallback if metadata is missing - lookup by price
        if (!credits && session.line_items) {
          // For line items we need to use checkout session items API to get details
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
          
          if (lineItems.data && lineItems.data.length > 0) {
            const item = lineItems.data[0]
            
            // Map prices to credits based on your plan
            const priceToCredits: Record<string, number> = {
              'price_1R9Ays09K2M4O1H8CtFYXcwQ': 5,    // Starter
              'price_1R9B0009K2M4O1H8aw4Wvf7w': 15,   // Basic
              'price_1R9B0t09K2M4O1H83v9KK97c': 35,   // Premium
              'price_1R9B1c09K2M4O1H8e0MuOQYo': 100   // Enterprise
            }
            
            if (item.price && item.price.id) {
              credits = priceToCredits[item.price.id] || 0
            }
          }
        }
        
        // Fallback if we still don't have credits
        if (!credits) {
          // Default to smallest package
          credits = 5
          console.warn('Could not determine credits from metadata or price, using default 5 credits')
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
            has_paid: true,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', clientReferenceId)

        if (error) {
          await logWebhookEvent(event.type, event.id, event.data.object, false, error.message);
          console.error('Error updating profile with credits:', error)
          throw error
        }
        
        // Log successful processing
        await logWebhookEvent(event.type, event.id, event.data.object, true);
        console.log(`Successfully updated user ${clientReferenceId} to ${newCredits} credits`)
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await logWebhookEvent(event.type, event.id, paymentIntent, true);
        console.log('Payment intent succeeded:', paymentIntent.id)
        
        // Additional processing can be done here if needed
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
        await logWebhookEvent(event.type, event.id, paymentIntent, false, errorMessage);
        console.error('Payment failed:', paymentIntent.id, errorMessage)
        
        // Could send an alert email or log for admin review
        break
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})