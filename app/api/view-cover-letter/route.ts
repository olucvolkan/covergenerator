import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get the cover letter ID from the URL parameters
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Cover letter ID is required', { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user to check authorization
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the cover letter content
    const { data: coverLetter, error: coverLetterError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (coverLetterError || !coverLetter) {
      console.error('Error fetching cover letter:', coverLetterError);
      return new NextResponse('Cover letter not found or access denied', { status: 404 });
    }

    // Generate simplified HTML content with just the cover letter text
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Cover Letter</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .content {
          white-space: pre-line;
          text-align: left;
          font-size: 16px;
          padding: 20px;
          margin-top: 20px;
        }
        p {
          margin-bottom: 16px;
          text-indent: 0;
        }
        .button-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .copy-button {
          padding: 10px 20px;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .copy-button:hover {
          background-color: #3182ce;
        }
        .success-message {
          color: #48bb78;
          margin-top: 10px;
          display: none;
        }
      </style>
      <script>
        function copyToClipboard() {
          const content = document.querySelector('.content').innerText;
          navigator.clipboard.writeText(content)
            .then(() => {
              const message = document.getElementById('success-message');
              message.style.display = 'block';
              setTimeout(() => {
                message.style.display = 'none';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
              alert('Failed to copy text. Please try selecting and copying manually.');
            });
        }
      </script>
    </head>
    <body>
      <div class="button-container">
        <button class="copy-button" onclick="copyToClipboard()">
          Copy Text
        </button>
        <p id="success-message" class="success-message">Text copied to clipboard!</p>
      </div>
      
      <div class="content">
        ${coverLetter.cover_letter || coverLetter.content}
      </div>
    </body>
    </html>
    `;

    // Return the HTML content with appropriate headers
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error viewing cover letter:', error);
    return new NextResponse('Failed to view cover letter', { status: 500 });
  }
} 