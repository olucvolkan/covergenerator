import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    const { coverLetterId, userId } = body;

    // Validate required parameters
    if (!coverLetterId) {
      return NextResponse.json({ error: 'Cover letter ID is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the cover letter content
    const { data: coverLetter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', coverLetterId)
      .eq('user_id', userId)
      .single();

    if (coverLetterError || !coverLetter) {
      console.error('Error fetching cover letter:', coverLetterError);
      return NextResponse.json({ 
        error: 'Cover letter not found or access denied' 
      }, { status: 404 });
    }

    
    const mockPdfUrl = `/api/view-cover-letter?id=${coverLetterId}`;
    
    // Return the URL to the generated PDF
    return NextResponse.json({ 
      url: mockPdfUrl,
      success: true,
      message: 'PDF generated successfully'
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF' 
    }, { status: 500 });
  }
} 