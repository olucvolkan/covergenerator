import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Get JSON data
    const { user_id, job_description, file_id } = await request.json()

    if (!job_description || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // If file_id is not provided, try to find the latest file for this user
    let effectiveFileId = file_id;
    
    if (!effectiveFileId) {
      try {
        const { data: latestFiles, error: fileError } = await supabase
          .from('user_files')
          .select('id')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (fileError) {
          console.error('Error fetching latest file:', fileError);
        } else if (latestFiles && latestFiles.length > 0) {
          effectiveFileId = latestFiles[0].id;
          console.log(`No file_id provided, using latest file: ${effectiveFileId}`);
        }
      } catch (lookupError) {
        console.error('Error looking up latest file:', lookupError);
        // Continue with the rest of the function - don't exit early
      }
    }
    
    // If still no file_id, return an error
    if (!effectiveFileId) {
      return NextResponse.json({ 
        error: 'No file_id provided and no uploaded CV found for this user' 
      }, { status: 400 });
    }

    // Create FormData
    const formData = new FormData()
    formData.append('user_id', user_id)
    formData.append('job_description', job_description)
    formData.append('file_id', effectiveFileId)

    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
      method: 'POST',
      body: formData
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate cover letter' },
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in generate-cover-letter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}