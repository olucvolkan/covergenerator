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
    
    // STEP 1: Find the correct Supabase user ID
    // The user_id might be a Google ID or other external provider ID
    // So we need to find the corresponding Supabase user
    let supabaseUserId = user_id;
    
    // Check if the user_id is a numeric string (likely a Google ID)
    if (/^\d+$/.test(user_id)) {
      console.log('Received a numeric ID (likely from Google):', user_id);
      
      // Get users from auth schema where provider_id matches the Google ID
      const { data: authUsers, error: authError } = await supabase
        .from('auth_users')
        .select('id')
        .eq('provider_id', user_id)
        .single();
      
      if (authError) {
        // If that fails, query the user_identities table where provider_id matches
        const { data: identities, error: identitiesError } = await supabase.auth.admin.listUsers();
        
        if (identitiesError) {
          console.error('Error finding user by identity:', identitiesError);
          return NextResponse.json(
            { error: 'Could not find user account. Please login again.' },
            { status: 404 }
          );
        }
        
        // Find the user with matching identity provider_id
        const matchedUser = identities.users.find(user => 
          user.identities?.some(identity => 
            identity.provider_id === user_id || identity.identity_data?.sub === user_id
          )
        );
        
        if (matchedUser) {
          supabaseUserId = matchedUser.id;
          console.log('Found Supabase user ID from identities:', supabaseUserId);
        } else {
          // If still not found, try a direct lookup in users table
          const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('external_id', user_id)
            .single();
            
          if (profileError || !profiles) {
            console.error('Could not find user with Google ID:', user_id);
            return NextResponse.json(
              { error: 'User account not found. Please login through the main website first.' },
              { status: 404 }
            );
          }
          
          supabaseUserId = profiles.id;
          console.log('Found Supabase user ID from profiles:', supabaseUserId);
        }
      } else {
        supabaseUserId = authUsers.id;
        console.log('Found Supabase user ID:', supabaseUserId);
      }
    }
    
    // STEP 2: Check if file_id is provided, or find the most recent file
    let fileIdToUse = file_id;
    
    if (!fileIdToUse) {
      console.log(`Finding most recent file for user: ${supabaseUserId}`);
      
      const { data: latestFile, error: fileError } = await supabase
        .from('user_files')
        .select('id')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fileError || !latestFile) {
        console.error('No uploaded files found for user:', supabaseUserId);
        return NextResponse.json(
          { error: 'No CV found for this user. Please upload a CV first through the main website.' },
          { status: 404 }
        );
      }
      
      fileIdToUse = latestFile.id;
      console.log(`Using user's most recent file: ${fileIdToUse}`);
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
          user_id: supabaseUserId, // Use the mapped Supabase user ID
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