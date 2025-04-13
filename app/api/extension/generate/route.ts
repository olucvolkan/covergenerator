import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { useCredit } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { job_description, user_id, access_token } = body;
    
    if (!job_description || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verify user session
    let session;
    if (access_token) {
      // If access token is provided (from the extension)
      const { data, error } = await supabase.auth.getUser(access_token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
      }
      if (data.user.id !== user_id) {
        return NextResponse.json({ error: 'User ID mismatch' }, { status: 401 });
      }
    } else {
      // If no access token, check the session cookie (from the web app)
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (data.session.user.id !== user_id) {
        return NextResponse.json({ error: 'User ID mismatch' }, { status: 401 });
      }
      session = data.session;
    }

    // Check and deduct user credits
    const creditResult = await useCredit(user_id);
    if (!creditResult.success) {
      return NextResponse.json({ 
        error: creditResult.error || 'Failed to use credit',
        errorCode: 'INSUFFICIENT_CREDITS'  
      }, { status: 403 });
    }
    
    // Find the user's most recently uploaded CV
    const { data: fileData, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (fileError) {
      console.error('Error finding user CV:', fileError);
      return NextResponse.json({ error: 'Error finding user CV' }, { status: 500 });
    }
    
    if (!fileData || fileData.length === 0) {
      return NextResponse.json({ error: 'No CV found. Please upload a CV first.' }, { status: 404 });
    }
    
    const file_id = fileData[0].id;

    // Create FormData
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('job_description', job_description);
    formData.append('file_id', file_id);

    // Call API to generate cover letter
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
      method: 'POST',
      body: formData
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', errorText);
      
      // If there was an error, refund the credit
      await supabase
        .from('profiles')
        .update({ 
          credits: creditResult.remainingCredits + 1,  // Add the credit back
        })
        .eq('id', user_id);
        
      return NextResponse.json(
        { error: 'Failed to generate cover letter' },
        { status: apiResponse.status }
      );
    }

    // Get the generated cover letter
    const data = await apiResponse.json();
    
    // Save the cover letter to the database
    const { error: insertError } = await supabase
      .from('cover_letters')
      .insert([
        {
          user_id: user_id,
          file_id: file_id,
          job_description: job_description,
          cover_letter: data.cover_letter,
          match_score: data.match_score || null,
          source: 'chrome_extension'  // Track that this was generated from the extension
        }
      ]);
      
    if (insertError) {
      console.error('Error saving cover letter:', insertError);
      // We don't return an error here as the cover letter was generated successfully
    }

    return NextResponse.json({
      success: true,
      cover_letter: data.cover_letter,
      match_analysis: data.match_analysis,
      match_score: data.match_score,
      remaining_credits: creditResult.remainingCredits
    });

  } catch (error) {
    console.error('Error in extension/generate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}