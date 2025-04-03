"use client";

import Link from 'next/link';

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            CvtoLetter: AI-Powered Cover Letter Generation System
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your resume and job description into a perfectly tailored cover letter using our sophisticated multi-step AI processing pipeline.
          </p>
        </div>

        {/* Process Steps */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Smart Document Processing</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Advanced PDF extraction technology</li>
                <li>• Perfect formatting preservation</li>
                <li>• Comprehensive document analysis</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Job Description Intelligence</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Requirement identification</li>
                <li>• Priority detection</li>
                <li>• Industry context recognition</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Match Analysis</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• AI matching algorithm</li>
                <li>• Match score generation</li>
                <li>• Gap analysis</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">4. Content Generation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Claude 3 AI Technology</li>
                <li>• Tailored messaging</li>
                <li>• Professional tone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-20">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 md:p-12 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <h2 className="text-3xl font-bold mb-6">Our CV Analysis Technology</h2>
              <p className="mb-6 text-white/90">
                Our advanced natural language processing engine powered by Claude 3 AI analyzes your CV in-depth, extracting and understanding:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Skills & Competencies</strong> - Technical and soft skills that make you stand out</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Work Experience</strong> - Key achievements and responsibilities</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Educational Background</strong> - Degrees, certifications, and training</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Career Trajectory</strong> - Understanding your career path and aspirations</span>
                </li>
              </ul>
            </div>
            
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Analysis Process</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Document Parsing</h4>
                    <p className="text-gray-600">Our advanced PDF parser extracts full text content with perfect formatting preservation</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Semantic Analysis</h4>
                    <p className="text-gray-600">Unlike simple keyword matching, our AI comprehends the meaning and context</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-2">Match Optimization</h4>
                    <p className="text-gray-600">Identifies your most competitive strengths for the specific job</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Why CvtoLetter Stands Out</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-primary mb-4">93%</div>
              <p className="text-gray-700">Higher Response Rate from job applications</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-primary mb-4">85%</div>
              <p className="text-gray-700">of Recruiters say our letters stand out</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-primary mb-4">75%</div>
              <p className="text-gray-700">Faster Application Process vs manual</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-bold text-primary mb-4">89%</div>
              <p className="text-gray-700">of Users secured interviews</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="max-w-4xl mx-auto px-8 py-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Start Creating Professional, Tailored Cover Letters Today
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Maximize your job search success with our AI-powered cover letter generator
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/" 
                className="inline-block bg-white text-blue-600 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get Started Now
              </Link>
              <Link 
                href="/pricing" 
                className="inline-block bg-transparent text-white border-2 border-white font-semibold px-8 py-4 rounded-lg hover:bg-white/10 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;