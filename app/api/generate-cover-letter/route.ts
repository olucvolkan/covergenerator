import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Get JSON data
    const { user_id, job_description, file_id } = await request.json()

    if (!job_description || !file_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create FormData
    const formData = new FormData()
    formData.append('user_id', user_id)
    formData.append('job_description', job_description)
    formData.append('file_id', file_id)

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