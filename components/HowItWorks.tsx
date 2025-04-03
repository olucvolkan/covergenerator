"use client";

import React from 'react';
import Link from 'next/link';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How CvtoLetter Works</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our AI-powered system analyzes your CV and creates tailored cover letters that get you noticed
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Upload Your CV</h3>
              <p className="text-gray-600 mb-4">
                Upload your CV and our system securely stores it for analysis. We support PDF format and extract all relevant information.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Add Job Description</h3>
              <p className="text-gray-600 mb-4">
                Paste the job posting you're applying for. Our AI analyzes the key requirements and priorities of the position.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Generate Cover Letter</h3>
              <p className="text-gray-600 mb-4">
                With just one click, our AI engine creates a personalized cover letter that aligns your skills with the job requirements.
              </p>
            </div>
          </div>
        </div>

        {/* CV Analysis Technology */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our CV Analysis Technology</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-gray-700 mb-4">
                Our advanced natural language processing engine analyzes your CV in-depth, extracting key information like:
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Skills & Competencies</strong> - Both technical and soft skills that make you stand out</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Work Experience</strong> - Identifying key achievements and responsibilities</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Educational Background</strong> - Relevant degrees, certifications, and training</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Career Trajectory</strong> - Understanding your career path and aspirations</span>
                </li>
              </ul>
              
              <p className="text-gray-700">
                Our technology goes beyond simple keyword matching. It understands the context and relevance of your experiences to create truly personalized cover letters.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">Our Analysis Process</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Document Parsing</h4>
                    <p className="text-sm text-gray-600">Extracts structured data from your CV</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Semantic Analysis</h4>
                    <p className="text-sm text-gray-600">Understands the meaning behind your experience</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Job Requirement Mapping</h4>
                    <p className="text-sm text-gray-600">Matches your skills to job requirements</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Content Generation</h4>
                    <p className="text-sm text-gray-600">Creates compelling, tailored cover letter content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Our Cover Letters Work</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">93%</div>
              <p className="text-gray-700">of users report improved response rates from their job applications</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">85%</div>
              <p className="text-gray-700">of recruiters say our cover letters stand out from generic applications</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">75%</div>
              <p className="text-gray-700">faster application process compared to writing cover letters manually</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-4xl font-bold text-primary mb-2">89%</div>
              <p className="text-gray-700">of users secured interviews for positions they applied to</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-2">How long does it take to generate a cover letter?</h3>
              <p className="text-gray-700">
                Our AI-powered system typically generates a personalized cover letter in under 30 seconds after you've uploaded your CV and provided the job description.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">How customized are the cover letters?</h3>
              <p className="text-gray-700">
                Very! Our system analyzes both your CV and the job description to create a unique cover letter that highlights your most relevant experiences and skills for each specific position.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Is my data secure?</h3>
              <p className="text-gray-700">
                Absolutely. We use industry-standard encryption to protect your data. Your CV is only used to generate your cover letters and is not shared with third parties.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Can I edit the generated cover letter?</h3>
              <p className="text-gray-700">
                Yes, you can copy the generated cover letter and make any adjustments you'd like before sending it to employers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary rounded-lg shadow-xl overflow-hidden">
          <div className="md:flex">
            <div className="p-8 md:p-12 md:w-2/3">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Stand Out?</h2>
              <p className="text-white text-opacity-90 mb-6">
                Generate your first tailored cover letter today and increase your chances of landing your dream job.
              </p>
              <div className="flex space-x-4">
                <Link href="/" className="bg-white text-primary font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  Get Started
                </Link>
                <Link href="/pricing" className="bg-transparent text-white border border-white font-medium px-6 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors">
                  View Pricing
                </Link>
              </div>
            </div>
            <div className="hidden md:block md:w-1/3 bg-blue-800 relative">
              <div className="absolute inset-0 opacity-20">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="none" stroke="white" strokeWidth="2" />
                  <path d="M0,0 L100,100 M100,0 L0,100" stroke="white" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;