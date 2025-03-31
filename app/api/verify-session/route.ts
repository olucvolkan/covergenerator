import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get the user ID from the session
    const userId = session.client_reference_id
    if (!userId) {
      return NextResponse.json(
        { error: 'No user ID found in session' },
        { status: 400 }
      )
    }

    // Initialize Supabase client with service role key
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )

    console.log('Checking profile for user:', userId)

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    
    console.log('Profile query result:', { profile, profileError })
    
    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Create profile if it doesn't exist
    if (!profile) {
      console.log('Profile not found, creating new profile')
      // Get user email from Stripe session
      const customerEmail = session.customer_details?.email

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: customerEmail,
          has_paid: false,
          stripe_customer_id: null
        }])
        .select()
        .maybeSingle()

      if (insertError) {
        console.error('Error creating profile:', insertError)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
      console.log('New profile created:', newProfile)
    }

    // Check session payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    console.log('Updating profile with payment information')

    // Update user's profile with payment information
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        has_paid: true,
        stripe_customer_id: session.customer as string,
      })
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user profile with payment information' },
        { status: 500 }
      )
    }

    console.log('Profile updated successfully:', updatedProfile)

    return NextResponse.json({
      success: true,
      customer: session.customer,
      status: session.payment_status,
      profile: updatedProfile
    })

  } catch (error) {
    console.error('Error processing payment verification:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred while processing payment verification',
        details: error instanceof Error ? error : undefined
      },
      { status: 500 }
    )
  }
} 