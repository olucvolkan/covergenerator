import { supabase } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    
    // Extract form fields
    const resume = formData.get('resume') as File;
    const jobDescription = formData.get('jobDescription') as string;
    const userId = formData.get('userId') as string | null;
    const filePath = formData.get('filePath') as string | null;
    
    console.log(`Received request: job description length: ${jobDescription?.length || 0}, userId: ${userId || 'guest'}`);
    
    if (!resume && !filePath) {
      return NextResponse.json(
        { error: 'No resume file provided' },
        { status: 400 }
      );
    }
    
    if (!jobDescription) {
      return NextResponse.json(
        { error: 'No job description provided' },
        { status: 400 }
      );
    }
    
    // Log request info
    console.log(`Processing resume ${resume ? resume.name : 'from Supabase path: ' + filePath}`);
    
    // If we have a userId, verify the user exists in Supabase
    let userData = null;
    if (userId) {
      const { data, error } = await supabase.auth.getUser(userId);
      
      if (error) {
        console.error('Error verifying user:', error);
      } else if (data.user) {
        userData = data.user;
        console.log(`User verified: ${userData.email}`);
      }
      
      // Track usage for the user
      await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          action: 'generate_cover_letter',
          metadata: {
            job_description_length: jobDescription.length,
            resume_path: filePath || 'uploaded directly'
          }
        });
    }
    
    // For demo purposes, we'll generate a simple cover letter using the job description
    const keywords = extractKeywords(jobDescription);
    const coverLetter = generateSampleCoverLetter(keywords);
    
    // If we have a user, save the generated cover letter to the database
    if (userId) {
      const { error } = await supabase
        .from('cover_letters')
        .insert({
          user_id: userId,
          job_description: jobDescription,
          cover_letter: coverLetter,
          resume_path: filePath || 'uploaded directly'
        });
      
      if (error) {
        console.error('Error saving cover letter to database:', error);
      }
    }
    
    return NextResponse.json({ coverLetter });
  } catch (error: any) {
    console.error('Error generating cover letter:', error);
    return NextResponse.json(
      { error: 'Failed to generate cover letter: ' + error.message },
      { status: 500 }
    );
  }
}

// Helper function to extract keywords from a job description
function extractKeywords(jobDescription: string): string[] {
  // This is a simplified version - in a real implementation, 
  // you would use NLP or similar to extract relevant keywords
  const commonKeywords = [
    'experienced', 'team player', 'innovative', 'problem solver',
    'communication', 'leadership', 'detail-oriented', 'passionate'
  ];
  
  return commonKeywords.filter(keyword => 
    jobDescription.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Helper function to generate a sample cover letter
function generateSampleCoverLetter(keywords: string[]): string {
  // In a real implementation, you would use OpenAI or similar to generate the cover letter
  
  const intro = `Dear Hiring Manager,

I am writing to express my interest in the position you advertised. With my background and skills, I believe I would be a valuable addition to your team.`;

  const keywordSection = keywords.length > 0 
    ? `\n\nBased on the job description, I notice you're looking for someone who is ${keywords.join(', ')}. These are all qualities I embody in my professional work.` 
    : '';

  const closing = `\n\nI am excited about the opportunity to bring my skills to your organization and would welcome the chance to discuss how I can contribute to your team's success.

Thank you for considering my application. I look forward to the possibility of working with you.

Sincerely,
[Your Name]`;

  return intro + keywordSection + closing;
} 