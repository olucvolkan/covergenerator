import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's profile with credits information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, generated_cover_letters, has_paid')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Get user's latest file (most recently uploaded CV)
    const { data: latestFiles, error: filesError } = await supabase
      .from('user_files')
      .select('id, file_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (filesError) {
      console.error('Error fetching user files:', filesError);
      // Continue without file info
    }

    // Construct response
    const response = {
      credits: profile?.credits || 0,
      used_credits: profile?.generated_cover_letters || 0,
      has_paid: profile?.has_paid || false,
      latest_file: latestFiles && latestFiles.length > 0 ? {
        id: latestFiles[0].id,
        name: latestFiles[0].file_name
      } : null
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in get-user-credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}