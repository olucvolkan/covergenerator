import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: Request) {
  try {
    const { session_id, user_id } = await request.json()

    if (!session_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing session_id or user_id' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Check if session has already been processed
    const { data: existingSession, error: checkError } = await supabase
      .from('checkout_sessions')
      .select('status')
      .eq('session_id', session_id)
      .single()

    if (!checkError && existingSession?.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Payment already processed'
      })
    }

    // Get the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    console.log('Payment status:', session.payment_status)

    // Verify the payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed', status: session.payment_status, retry: true },
        { status: 400 }
      )
    }

    // Get credits from session metadata
    let credits = 0
    if (session.metadata?.credits) {
      credits = parseInt(session.metadata.credits, 10)
    }

    // If no credits in metadata, get from payment intent
    if (!credits && session.payment_intent) {
      const paymentIntentId = typeof session.payment_intent === 'string' 
        ? session.payment_intent 
        : session.payment_intent.id
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (paymentIntent.metadata?.credits) {
        credits = parseInt(paymentIntent.metadata.credits, 10)
      }
    }

    // If still no credits, try to get from line items
    if (!credits && session.id) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      
      // Map prices to credits based on your plan
      const starterPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '';
      const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || '';
      const premiumPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || '';
      const enterprisePriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE || '';
      
      const priceToCredits: Record<string, number> = {
        [starterPriceId]: 5,    // Starter
        [basicPriceId]: 15,     // Basic
        [premiumPriceId]: 35,   // Premium
        [enterprisePriceId]: 100 // Enterprise
      }
      
      if (lineItems.data?.length > 0 && lineItems.data[0].price?.id) {
        credits = priceToCredits[lineItems.data[0].price.id] || 0
      }
    }

    if (!credits) {
      return NextResponse.json(
        { error: 'Could not determine credits amount' },
        { status: 400 }
      )
    }

    // Get current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user_id)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + credits

    // Update user's credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }

    // Update checkout session status
    const { error: sessionUpdateError } = await supabase
      .from('checkout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('session_id', session_id)

    if (sessionUpdateError) {
      console.error('Error updating checkout session status:', sessionUpdateError)
      // Don't fail the request as credits were already added
    }

    return NextResponse.json({
      success: true,
      credits: newCredits,
      added_credits: credits
    })

  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
} 