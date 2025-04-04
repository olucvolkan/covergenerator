// supabase/functions/credits-checkout/index.ts
//deno-lint-ignore-file
//deno-lint-ignore-file no-explicit-any require-await
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@12.0.0';

const allowedOrigins = [
  'https://cvtoletter.com',
  'http://localhost:3000',
  'http://localhost:5173',  // Vite default port
  'https://cvtoletter.com',
  'https://www.cvtoletter.com',
  'http://cvtoletter.com',
  'http://covergen-wild-mountain-3122.fly.dev',
  '*' // Geçici olarak tüm kaynaklara izin ver (test için)
]

const corsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  console.log(`Request origin: ${origin}`);
  
  // allowedOrigins değerini kullan
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Log Stripe configuration (without exposing full secret key)
console.log('Stripe Configuration:', {
  apiVersion: '2023-10-16',
  secretKeyPrefix: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10) + '...',
  isTestMode: Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_test_')
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function ensureUserProfile(userId: string) {
  // First, check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    console.error('Error checking profile:', profileError)
    throw profileError
  }

  // If profile doesn't exist, create it
  if (!profile) {
    console.log('Profile not found, creating new profile for user:', userId)
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: userId, credits: 0 }])

    if (insertError) {
      console.error('Error creating profile:', insertError)
      throw insertError
    }
  }

  return profile
}

serve(async (req) => {
  const headers = corsHeaders(req)
  console.log(headers);
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { 
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400 
      });
    }

    const { price_id, user_id, success_url, cancel_url, metadata } = requestBody;

    if (!price_id || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        headers: { ...headers, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    // Get base URL from environment or request origin
    const baseUrl = Deno.env.get('CLIENT_REDIRECT') || 
                   req.headers.get('origin') || 
                   'https://cvtoletter.com';

    const finalSuccessUrl = success_url?.includes('undefined') 
      ? `${baseUrl}/success`
      : success_url;

    const finalCancelUrl = cancel_url?.includes('undefined')
      ? `${baseUrl}/pricing`
      : cancel_url;
    
    
    console.log('Validating price ID:', price_id);
    try {
      // List all prices first to debug
      const prices = await stripe.prices.list({
        limit: 10,
        active: true
      });

    } catch (priceError) {
      console.error('Error retrieving price:', {
        error: priceError instanceof Error ? priceError.message : 'Unknown error',
        priceId: price_id,
        stripeKeyPrefix: Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10) + '...',
        isTestMode: Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_test_')
      });
      return new Response(JSON.stringify({ 
        error: `Invalid price ID: ${price_id}`,
        details: priceError instanceof Error ? priceError.message : 'Unknown error',
        isTestMode: Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_test_')
      }), { 
        headers: { ...headers, 'Content-Type': 'application/json' }, 
        status: 400 
      });
    }

    console.log('Creating checkout session with:', { price_id, user_id, success_url, cancel_url, metadata });

    // Ensure user profile exists
    await ensureUserProfile(user_id);

    // Get user's profile to check if they already have a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    let customerId = profile?.stripe_customer_id;

    // If no customer ID exists, create a new customer
    if (!customerId) {
      const { data: userData, error: userError } = await supabase
        .auth.admin.getUserById(user_id);

      if (userError) {
        console.error('Error fetching user:', userError);
        throw userError;
      }

      console.log('Creating new Stripe customer for user:', userData.user.email);

      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: {
          supabase_user_id: user_id,
        },
      });

      customerId = customer.id;

      // Store the customer ID in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);

      if (updateError) {
        console.error('Error updating profile with customer ID:', updateError);
        throw updateError;
      }
    }

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: user_id,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: metadata || {},
      payment_intent_data: {
        metadata: metadata || {}
      }
    };
    
    console.log('Creating session with params:', sessionParams);
    
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Checkout session created:', session.id);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url 
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 200,
    });
    
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      details: err instanceof Error ? err.stack : undefined
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})