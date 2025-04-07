import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get JSON data
    const requestData = await request.json();
    const { user_id, job_description, file_id } = requestData;

    // Log input data for debugging
    console.log('Received request data:', { 
      user_id: user_id,
      job_description_length: job_description?.length, 
      file_id: file_id 
    });

    // Validate required fields
    if (!job_description) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // STEP 1: Find the actual Supabase user by external_id (should be Google ID)
    console.log(`Finding user with external_id: ${user_id}`);
    
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('external_id', user_id)
      .single();
    
    if (userError || !userProfile) {
      console.error('Error finding user by external_id:', userError);
      return NextResponse.json(
        { error: `Could not find user with ID: ${user_id}. Please login through the main website first.` },
        { status: 404 }
      );
    }
    
    const supabaseUserId = userProfile.id;
    console.log(`Found user ${userProfile.full_name} with ID: ${supabaseUserId}`);
    
    // STEP 2: Find this user's most recent file
    let fileIdToUse = file_id;
    
    if (!fileIdToUse) {
      console.log(`Finding most recent file for user: ${supabaseUserId}`);
      
      const { data: userFiles, error: filesError } = await supabase
        .from('user_files')
        .select('id, file_name')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (filesError || !userFiles || userFiles.length === 0) {
        console.error('No files found for user:', supabaseUserId);
        return NextResponse.json(
          { error: 'No CV found for your account. Please upload a CV first through the main website.' },
          { status: 404 }
        );
      }
      
      fileIdToUse = userFiles[0].id;
      console.log(`Using user's most recent file: ${fileIdToUse} (${userFiles[0].file_name})`);
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('user_id', supabaseUserId); // Use the mapped Supabase user ID
    formData.append('job_description', job_description);
    formData.append('file_id', fileIdToUse);

    console.log('Sending generate request to API with:', {
      user_id: supabaseUserId,
      file_id: fileIdToUse,
      job_description_length: job_description.length
    });
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.error('API URL not configured');
      return NextResponse.json({ error: 'API URL not configured' }, { status: 500 });
    }
    
    // Call the API service
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate cover letter', details: errorText },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    
    // Save the generated cover letter to the database
    const { error: saveError } = await supabase
      .from('cover_letters')
      .insert([
        {
          user_id: supabaseUserId,
          file_id: fileIdToUse,
          job_description: job_description,
          cover_letter: data.cover_letter,
          match_score: data.match_score || null
        }
      ]);

    if (saveError) {
      console.error('Error saving cover letter to database:', saveError);
      // Continue anyway, just log the error
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}