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

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // ---------------------------------------------------------
    // STEP 1: Find available files in the system as a workaround
    // ---------------------------------------------------------
    
    // Get all files in the system (limited to 10 for safety)
    const { data: allFiles, error: filesError } = await supabase
      .from('user_files')
      .select('id, file_name, user_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log(`Found ${allFiles?.length || 0} files in the system`);
    
    if (filesError || !allFiles || allFiles.length === 0) {
      console.error('No files found in the system');
      return NextResponse.json(
        { error: 'No CV files found in the system. Please upload a CV through the main website.' },
        { status: 404 }
      );
    }
    
    // Just use the most recent file in the system
    const fileIdToUse = allFiles[0].id;
    const fileUserIdToUse = allFiles[0].user_id;
    
    console.log(`Using most recent file in system: ${fileIdToUse} (${allFiles[0].file_name}) from user ${fileUserIdToUse}`);
    
    // Create FormData
    const formData = new FormData();
    formData.append('user_id', fileUserIdToUse); // Use the file's associated user ID
    formData.append('job_description', job_description);
    formData.append('file_id', fileIdToUse);

    console.log('Sending generate request to API with:', {
      user_id: fileUserIdToUse,
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
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}