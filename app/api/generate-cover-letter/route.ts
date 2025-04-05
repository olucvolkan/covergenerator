import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get JSON data
    const { user_id, job_description, file_id: providedFileId } = await request.json();

    if (!job_description || !user_id) {
      return NextResponse.json({ error: 'Missing required fields: job_description and user_id' }, { status: 400 });
    }

    let file_id = providedFileId;

    // If file_id is not provided, try to get the latest uploaded file for this user
    if (!file_id) {
      const { data: latestFiles, error: filesError } = await supabase
        .from('user_files')
        .select('id')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (filesError) {
        console.error('Error fetching latest file:', filesError);
        return NextResponse.json({ error: 'Failed to fetch latest file' }, { status: 500 });
      }

      if (!latestFiles || latestFiles.length === 0) {
        return NextResponse.json({ error: 'No CV file found. Please upload a CV first.' }, { status: 400 });
      }

      file_id = latestFiles[0].id;
      console.log(`Using latest file ID: ${file_id} for user ${user_id}`);
    }

    // Create FormData
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('job_description', job_description);
    formData.append('file_id', file_id);

    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
      method: 'POST',
      body: formData
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate cover letter' },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    
    // Update user's generated_cover_letters count in profiles table
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('generated_cover_letters, credits')
        .eq('id', user_id)
        .single();

      if (!profileError && profile) {
        const newCount = (profile.generated_cover_letters || 0) + 1;
        const newCredits = Math.max(0, (profile.credits || 0) - 1); // Deduct one credit, minimum 0
        
        await supabase
          .from('profiles')
          .update({ 
            generated_cover_letters: newCount,
            credits: newCredits
          })
          .eq('id', user_id);
      }
    } catch (updateError) {
      console.error('Error updating profile stats:', updateError);
      // Continue even if update fails
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}