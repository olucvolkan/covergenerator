import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    // Get JSON data
    const { user_id, job_description, file_id } = await request.json()

    // Validate required fields
    if (!job_description) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 })
    }

    if (!file_id) {
      return NextResponse.json({ error: 'CV file_id is required' }, { status: 400 })
    }

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Verify the user has access to this file_id
    const { data: fileData, error: fileError } = await supabase
      .from('user_files')
      .select('*')
      .eq('id', file_id)
      .eq('user_id', user_id)
      .single()

    if (fileError || !fileData) {
      console.error('File verification error:', fileError)
      return NextResponse.json(
        { error: 'CV file not found or you do not have access to it' },
        { status: 404 }
      )
    }

    // Create FormData
    const formData = new FormData()
    formData.append('user_id', user_id)
    formData.append('job_description', job_description)
    formData.append('file_id', file_id)

    console.log('Sending generate request to API with file_id:', file_id)
    
    // Call your external API or service
    const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`, {
      method: 'POST',
      body: formData
    })

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API Error:', errorText)
      return NextResponse.json(
        { error: 'Failed to generate cover letter', details: errorText },
        { status: apiResponse.status }
      )
    }

    const data = await apiResponse.json()
    
    // Save the generated cover letter to the database
    const { error: saveError } = await supabase
      .from('cover_letters')
      .insert([
        {
          user_id: user_id,
          file_id: file_id,
          job_description: job_description,
          cover_letter: data.cover_letter,
          match_score: data.match_score || null
        }
      ])

    if (saveError) {
      console.error('Error saving cover letter to database:', saveError)
      // Continue anyway, just log the error
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in generate-cover-letter:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}