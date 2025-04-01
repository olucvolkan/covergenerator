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

    // Update user's premium status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ has_paid: true })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating premium status:', updateError)
      return NextResponse.json({ error: 'Failed to update premium status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in verify-session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 