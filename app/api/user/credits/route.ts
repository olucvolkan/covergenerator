import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, generated_cover_letters, has_paid')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile data' }, { status: 500 });
    }
    
    // Return credits information
    return NextResponse.json({ 
      success: true,
      credits: profile?.credits || 0,
      generated_cover_letters: profile?.generated_cover_letters || 0,
      has_paid: profile?.has_paid || false
    });

  } catch (error) {
    console.error('Error in user credits endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}