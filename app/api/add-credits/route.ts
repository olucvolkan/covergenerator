import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get session from request header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 })
    }

    // Get current user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.split(' ')[1])
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Get current credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const currentCredits = profile?.credits || 0
    const { credits } = await request.json()

    // Update credits and set has_paid to true
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        credits: currentCredits + credits,
        has_paid: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      credits: currentCredits + credits,
      has_paid: true
    })

  } catch (error) {
    console.error('Error in add-credits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 