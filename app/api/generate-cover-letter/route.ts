import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get JSON data
    const requestData = await request.json();
    const { user_id, job_description, file_id } = requestData;

    // Log input data for debugging
    console.log('Received request:', { 
      user_id, 
      job_description_length: job_description?.length
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
    
    // -----------------------------------------------
    // STEP 1: Get user by external ID and create mapping
    // -----------------------------------------------
    
    // First check if user_id is already a valid Supabase UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let supabaseUserId = uuidPattern.test(user_id) ? user_id : null;
    
    // If it's not a UUID, it's likely a Google ID
    if (!supabaseUserId) {
      console.log('Received non-UUID ID, trying to find user by external ID:', user_id);
      
      // First try auth.users lookup
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        
        if (users && users.users) {
          // Look for a user with a provider identity matching the given ID
          for (const user of users.users) {
            if (user.identities) {
              for (const identity of user.identities) {
                if (identity.provider_id === user_id || 
                    (identity.identity_data && identity.identity_data.sub === user_id)) {
                  supabaseUserId = user.id;
                  console.log('Found user via identity match:', supabaseUserId);
                  break;
                }
              }
            }
            if (supabaseUserId) break;
          }
        }
      } catch (adminError) {
        console.log('Admin API not available, trying profiles table lookup');
      }
      
      // If that fails, try looking up in the profiles table
      if (!supabaseUserId) {
        // Try to find by external_id
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('external_id', user_id)
            .maybeSingle();
          
          if (profile && profile.id) {
            supabaseUserId = profile.id;
            console.log('Found user via profiles.external_id:', supabaseUserId);
          }
        } catch (profileError) {
          console.log('Error looking up profiles by external_id:', profileError);
        }
        
        // Last resort: try to add external_id column if it doesn't exist
        if (!supabaseUserId) {
          console.log('No user found, creating a new mapping');
        }
      }
    }
    
    if (!supabaseUserId) {
      return NextResponse.json({
        error: 'Could not find a user with this ID. Please log in to the main website first.'
      }, { status: 404 });
    }
    
    // -----------------------------------------------
    // STEP 2: Find the most recent CV file for this user
    // -----------------------------------------------
    
    let fileIdToUse = file_id;
    
    if (!fileIdToUse) {
      const { data: userFiles, error: filesError } = await supabase
        .from('user_files')
        .select('id, file_name')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (filesError || !userFiles || userFiles.length === 0) {
        return NextResponse.json({
          error: 'No CV found for this user. Please upload a CV through the main website first.'
        }, { status: 404 });
      }
      
      fileIdToUse = userFiles[0].id;
      console.log(`Using most recent file: ${userFiles[0].file_name} (${fileIdToUse})`);
    }
    
    // -----------------------------------------------
    // STEP 3: Generate the cover letter
    // -----------------------------------------------
    
    // Create FormData
    const formData = new FormData();
    formData.append('user_id', supabaseUserId);
    formData.append('job_description', job_description);
    formData.append('file_id', fileIdToUse);

    console.log('Sending to API:', {
      user_id: supabaseUserId,
      file_id: fileIdToUse
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
      return NextResponse.json({ 
        error: 'Failed to generate cover letter', 
        details: errorText 
      }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    
    // -----------------------------------------------
    // STEP 4: Save the cover letter to the database
    // -----------------------------------------------
    
    try {
      await supabase.from('cover_letters').insert([
        {
          user_id: supabaseUserId,
          file_id: fileIdToUse,
          job_description: job_description,
          cover_letter: data.cover_letter,
          match_score: data.match_score || null
        }
      ]);
    } catch (saveError) {
      console.error('Failed to save cover letter to database:', saveError);
      // Continue anyway since we have the cover letter
    }
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in generate-cover-letter:', error);
    return NextResponse.json({
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}