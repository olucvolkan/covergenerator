import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createDecipheriv } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const CREDIT_AMOUNTS = {
  'starter': 5,
  'basic': 15,
  'premium': 35,
  'enterprise': 100
}

export async function POST(request: Request) {
  try {
    const { encryptedCredits, iv } = await request.json()

    // Get the user's session
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      )
    }

    // Decrypt credits amount
    const creditSecretId = process.env.CREDIT_SECRET_ID
    if (!creditSecretId) {
      throw new Error('CREDIT_SECRET_ID is not configured')
    }

    const decipher = createDecipheriv('aes-256-gcm', creditSecretId, iv)
    const decryptedCredits = parseInt(decipher.update(encryptedCredits, 'hex', 'utf8'), 10)

    // Verify if credits amount is valid
    if (!Object.values(CREDIT_AMOUNTS).includes(decryptedCredits)) {
      return NextResponse.json(
        { error: 'Invalid credits amount' },
        { status: 400 }
      )
    }

    // Get current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', session.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + decryptedCredits

    // Update user's credits
    const { error } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)

    if (error) {
      console.error('Error updating credits:', error)
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credits: newCredits
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 