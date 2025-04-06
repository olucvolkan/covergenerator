import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get profile data with credits info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, generated_cover_letters, has_paid')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Get latest uploaded CV file
    const { data: latestFiles, error: fileError } = await supabase
      .from('user_files')
      .select('id, file_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    // Note the change here - using latestFiles[0] instead of expecting a single record
    const latestFile = latestFiles && latestFiles.length > 0 ? latestFiles[0] : null;
    
    if (fileError) {
      console.error('Error fetching latest file:', fileError);
      // Continue without the file info, but don't fail the request
    }

    return NextResponse.json({
      credits: profile?.credits || 0,
      generated_cover_letters: profile?.generated_cover_letters || 0,
      has_paid: profile?.has_paid || false,
      latest_file: latestFile ? {
        id: latestFile.id,
        file_name: latestFile.file_name,
        created_at: latestFile.created_at
      } : null
    });

  } catch (error) {
    console.error('Error in get-user-credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}