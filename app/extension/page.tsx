'use client';

import React from 'react';
import Link from 'next/link';

const ExtensionPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
              CvToLetter Chrome Extension
            </span>
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto mb-6 rounded-full"></div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate job-winning cover letters directly from job listings with our browser extension
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                  1
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Install the Extension</h3>
                  <p className="mt-2 text-gray-600">Add our Chrome extension to your browser with just one click. Available on the Chrome Web Store.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                  2
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Browse Job Listings</h3>
                  <p className="mt-2 text-gray-600">Navigate to your favorite job boards like LinkedIn, Indeed, or Glassdoor and find interesting positions.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                  3
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Generate Cover Letter</h3>
                  <p className="mt-2 text-gray-600">Click on the CvToLetter extension icon, and our AI will automatically extract the job description and create a tailored cover letter.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-blue-600 text-white">
                  4
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Apply with Confidence</h3>
                  <p className="mt-2 text-gray-600">Review, edit if needed, and use your personalized cover letter to apply for the position right away.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="order-first lg:order-last flex justify-center items-center">
            <div className="relative w-full max-w-md h-96 rounded-lg overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-50 flex flex-col items-center justify-center p-8">
                <div className="w-16 h-16 bg-blue-600 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">CvToLetter Extension</h3>
                  <p className="text-gray-600 mb-6">Create perfect cover letters in seconds, right from the job listing</p>
                </div>
                <div className="w-full max-w-xs bg-white rounded-lg shadow-lg py-2 px-4 flex items-center">
                  <svg className="w-6 h-6 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-500">web.linkedin.com/jobs/view/...</span>
                </div>
                <div className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Extension Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">One-Click Generation</h3>
              <p className="text-gray-600">Generate tailored cover letters with a single click directly from the job listing.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Multi-Platform Support</h3>
              <p className="text-gray-600">Works on LinkedIn, Indeed, Glassdoor, Monster, and most major job boards.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your CV data is securely stored and encrypted. We never share your information.</p>
            </div>
          </div>
        </div>

        {/* Installation Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-16">
          <div className="md:flex">
            <div className="md:w-2/3 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Install Our Chrome Extension</h2>
              <p className="text-gray-600 mb-6">
                Get instant access to our powerful cover letter generator directly in your browser. 
                Save time and apply to more jobs with professionally written, tailored cover letters.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Syncs with your CvToLetter account</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Uses credits from your existing account</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="h-6 w-6 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Regular updates with new features</span>
                </div>
              </div>
              
              <a 
                href="https://chrome.google.com/webstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-8"
              >
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0a12 12 0 1 1 0 24 12 12 0 0 1 0-24zM7.5 6l4.5 7.8-4.5 7.8L12 16.2l4.5 5.4L12 13.8zM12 6h6v12h-6z" />
                </svg>
                Add to Chrome - It's Free
              </a>
            </div>
            
            <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white mb-4">
                  <svg className="h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">CvToLetter</h3>
                <div className="flex items-center justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-blue-100 mt-2">4.9 stars • 1000+ users</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Is the extension free to use?</h3>
              <p className="text-gray-600">
                The extension itself is free to install. It uses the same credit system as our web application. 
                Each cover letter generation costs one credit from your account.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Which job sites are supported?</h3>
              <p className="text-gray-600">
                Our extension works with LinkedIn, Indeed, Glassdoor, Monster, ZipRecruiter, and most other major job boards.
                We're constantly adding support for additional platforms.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How do I use my own CV with the extension?</h3>
              <p className="text-gray-600">
                The extension syncs with your CvToLetter account. Upload your CV on our website first, 
                and the extension will use it when generating cover letters.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Do I need to create an account?</h3>
              <p className="text-gray-600">
                Yes, you need a CvToLetter account to use the extension. This allows us to securely store your CV
                and manage your credits.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to streamline your job applications?</h2>
            <p className="text-blue-100 text-lg mb-6 max-w-3xl mx-auto">
              Install our Chrome extension today and start generating professional cover letters in seconds, 
              right from the job listings you're browsing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a 
                href="https://chrome.google.com/webstore" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 md:text-lg"
              >
                <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0a12 12 0 1 1 0 24 12 12 0 0 1 0-24zM7.5 6l4.5 7.8-4.5 7.8L12 16.2l4.5 5.4L12 13.8zM12 6h6v12h-6z" />
                </svg>
                Install Extension
              </a>
              <Link 
                href="/pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-900 md:text-lg"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionPage;