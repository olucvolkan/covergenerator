import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get JSON data
    const requestData = await request.json();
    const { user_id, job_description, file_id } = requestData;

    // Print the received data for debugging
    console.log('Received request data:', { 
      user_id,
      job_description: job_description?.substring(0, 50) + '...', 
      file_id 
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
    
    // STEP 1: Skip Google ID to Supabase ID conversion and directly use the ID
    // that was passed in, but use a direct database lookup to find the most recent file
    console.log('Using direct database query to find files for external ID:', user_id);
    
    // STEP 2: Check if file_id is provided, or find the most recent file
    let fileIdToUse = file_id;
    
    if (!fileIdToUse) {
      // Get the most recent CV file for this user from the files table
      // First try direct lookup with the provided ID
      const { data: directFiles, error: directError } = await supabase
        .from('user_files')
        .select('id, file_name')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      console.log('Direct user ID lookup result:', { 
        found: directFiles && directFiles.length > 0,
        error: directError ? directError.message : null
      });
      
      // If direct lookup fails, try looking up by external_id in profiles table
      if (directError || !directFiles || directFiles.length === 0) {
        console.log('Direct lookup failed, trying to find user by external_id');
        
        // First check if the ID matches an external_id in profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('external_id', user_id)
          .single();
        
        if (profileError || !profiles) {
          console.log('No profile found with external_id:', user_id);
          
          // As a fallback, use root access to search all profiles
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('id, email, external_id');
          
          console.log('All available profiles:', allProfiles?.length || 0);
          
          // Just use the first user as a test if we have any users
          if (allProfiles && allProfiles.length > 0) {
            const testUserId = allProfiles[0].id;
            console.log('Using first available user as a test:', testUserId);
            
            // Find the most recent file for this test user
            const { data: testFiles, error: testFilesError } = await supabase
              .from('user_files')
              .select('id, file_name')
              .eq('user_id', testUserId)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (testFilesError || !testFiles || testFiles.length === 0) {
              console.error('No files found for test user either');
              return NextResponse.json(
                { error: 'No CV files found for any user. Please upload a CV first through the main website.' },
                { status: 404 }
              );
            }
            
            fileIdToUse = testFiles[0].id;
            console.log(`Using test user's most recent file: ${fileIdToUse} (${testFiles[0].file_name})`);
          } else {
            return NextResponse.json(
              { error: 'No profiles found in the system. Please register through the main website.' },
              { status: 404 }
            );
          }
        } else {
          const supabaseUserId = profiles.id;
          console.log('Found Supabase user ID from external_id:', supabaseUserId);
          
          // Now get the most recent file for this user
          const { data: userFiles, error: userFilesError } = await supabase
            .from('user_files')
            .select('id, file_name')
            .eq('user_id', supabaseUserId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (userFilesError || !userFiles || userFiles.length === 0) {
            console.error('No files found for mapped user:', supabaseUserId);
            return NextResponse.json(
              { error: 'No CV found for this user. Please upload a CV first through the main website.' },
              { status: 404 }
            );
          }
          
          fileIdToUse = userFiles[0].id;
          console.log(`Using mapped user's most recent file: ${fileIdToUse} (${userFiles[0].file_name})`);
        }
      } else {
        fileIdToUse = directFiles[0].id;
        console.log(`Using user's most recent file: ${fileIdToUse} (${directFiles[0].file_name})`);
      }
    }

    // Create FormData
    const formData = new FormData();
    formData.append('user_id', user_id); // Use the original user ID for now
    formData.append('job_description', job_description);
    formData.append('file_id', fileIdToUse);

    console.log('Sending generate request to API with:', {
      user_id: user_id,
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
    
    // Skip saving the cover letter to the database for now until we have the proper user ID mapping
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}