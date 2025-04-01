"use client";

import { getCurrentUser, testSupabaseConnection } from '@/lib/auth';
import { uploadPDF } from '@/lib/pdfParser';
import { checkUserCredits, useCredit } from '@/lib/stripe';
import React, { useEffect, useRef, useState } from 'react';
import LoginModal from './LoginModal';
import PlanSelector from './PlanSelector';

const CoverLetterGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string, warning?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);

  // Check Supabase connection and user session on component mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Test Supabase connection
        const connectionTest = await testSupabaseConnection();
        if (connectionTest.success) {
          setConnectionStatus({
            success: true,
            message: "Connected to Supabase successfully",
            warning: connectionTest.warning
          });
        } else {
          setConnectionStatus({
            success: false,
            message: `Error connecting to Supabase: ${
              connectionTest.error && typeof connectionTest.error === 'object' && 'message' in connectionTest.error
                ? connectionTest.error.message
                : String(connectionTest.error || "Unknown error")
            }`
          });
        }
        
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser.data);
        
        // If user is logged in, check credits
        if (currentUser.data?.user) {
          const creditsInfo = await checkUserCredits(currentUser.data.user);
          setUserCredits(creditsInfo.credits || 0);
        }
      } catch (err: any) {
        console.error('Error initializing app:', err);
        setConnectionStatus({
          success: false,
          message: `Error: ${err.message || "Unknown error"}`
        });
      }
    };
    
    initApp();
  }, []);

  // PDF file validation function
  const validatePdfFile = (file: File): boolean => {
    console.log("Validating file:", file.name, file.type, file.size);
    
    // File type check
    if (file.type !== 'application/pdf') {
      setError(`Invalid file type: ${file.type}. Please upload a PDF file.`);
      return false;
    }
    
    // File size check (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`);
      return false;
    }
    
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    setError(null);
    setWarning(null);
    setUploadSuccess(false);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size);
      
      if (validatePdfFile(selectedFile)) {
        setFile(selectedFile);
        
        // If user is logged in, upload the file to Supabase
        if (user) {
          await handleFileUpload(selectedFile);
        } else {
          setShowLoginModal(true);
          setError("Authentication required: You must be logged in to upload files to Supabase Storage.");
        }
      } else {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } else {
      console.log("No file selected or file input event did not contain files");
    }
  };

  const handleFileUpload = async (fileToUpload: File) => {
    if (!user) {
      setShowLoginModal(true);
      setError("Authentication required: You must be logged in to upload files to Supabase Storage.");
      return;
    }
    
    // Check if user has credits
    try {
      const creditsInfo = await checkUserCredits(user.user);
      setUserCredits(creditsInfo.credits || 0);
      
      if (creditsInfo.credits <= 0) {
        console.log("User does not have any credits. Showing plan selector.");
        // Direct the user to the plan selector
        setShowPlanSelector(true);
        setFile(fileToUpload); // Save the file for later upload after plan selection
        return;
      }
      
      console.log("User has credits. Proceeding with upload.");
    } catch (err) {
      console.error("Error checking credits:", err);
      // If there's an error checking credits, continue as if they don't have any
      setShowPlanSelector(true);
      setFile(fileToUpload);
      return;
    }
    
    // If we reach here, the user has credits and can upload
    setIsUploading(true);
    setError(null);
    setWarning(null);
    setUploadSuccess(false);
    
    try {
      // Upload PDF to Supabase Storage
      const result = await uploadPDF(fileToUpload, user.user.id);
      console.log("File uploaded to Supabase:", result);
      
      setUploadedFilePath(result.path);
      setUploadedFileId(result.id);
      setUploadSuccess(true);
      
      // Show RLS warning if present
      if (result.warning) {
        setWarning(result.warning);
      }
    } catch (err: any) {
      console.error("Error uploading file to Supabase:", err);
      
      // Provide a more detailed error message if it's a bucket issue
      if (err.message && err.message.includes('bucket')) {
        setError(err.message);
      } else if (err.message && err.message.includes('logged in')) {
        setError(err.message);
        setShowLoginModal(true);
      } else {
        setError(`Error uploading file: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setWarning(null);
    setUploadSuccess(false);
    
    console.log("File drop event triggered");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      console.log("File dropped:", droppedFile.name, droppedFile.type, droppedFile.size);
      
      if (validatePdfFile(droppedFile)) {
        setFile(droppedFile);
        
        // If user is logged in, upload the file to Supabase
        if (user) {
          await handleFileUpload(droppedFile);
        } else {
          setShowLoginModal(true);
          setError("Authentication required: You must be logged in to upload files to Supabase Storage.");
        }
      }
    }
  };

  const handleUploadClick = () => {
    // Programmatically trigger file input click
    fileInputRef.current?.click();
  };

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value);
    setError(null);
  };

  const handleGenerateCoverLetter = async () => {
    if (!uploadedFileId || !jobDescription || !user) {
      setError('Please upload your CV and enter a job description');
      return;
    }

    if (userCredits <= 0) {
      setError('You need credits to generate a cover letter');
      setShowPlanSelector(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Use one credit
      const creditResult = await useCredit(user.user.id);
      
      if (!creditResult.success) {
        throw new Error(creditResult.error || 'Failed to use credit');
      }
      
      // Update local credits count
      setUserCredits(creditResult.remainingCredits || 0);
      
      // Call our API endpoint with JSON body
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          user_id: user.user.id,
          file_id: uploadedFileId
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetter(data.cover_letter);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoginSuccess = async () => {
    // Get current user after successful login
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setShowLoginModal(false);
    
    // Check user's credits
    if (currentUser.data?.user) {
      const creditsInfo = await checkUserCredits(currentUser.data.user);
      setUserCredits(creditsInfo.credits || 0);
    }
    
    // If there's a file pending upload, try uploading it now that the user is logged in
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handlePlanSelected = () => {
    // After plan is selected, check credits again and redirect back to main app
    setShowPlanSelector(false);
    
    // Refresh user credits
    if (user?.user) {
      checkUserCredits(user.user).then(creditsInfo => {
        setUserCredits(creditsInfo.credits || 0);
      });
    }
    
    // If there's a file selected but not uploaded, upload it now
    if (file && !uploadedFilePath && user) {
      // Continue with the actual upload now
      handleFileUploadAfterPlanSelection(file);
    }
  };
  
  // New function to handle upload after plan selection
  const handleFileUploadAfterPlanSelection = async (fileToUpload: File) => {
    setIsUploading(true);
    setError(null);
    setWarning(null);
    setUploadSuccess(false);
    
    try {
      // Upload PDF to Supabase Storage
      const result = await uploadPDF(fileToUpload, user.id);
      console.log("File uploaded to Supabase:", result);
      
      setUploadedFilePath(result.path);
      setUploadedFileId(result.id);
      setUploadSuccess(true);
      
      // Show RLS warning if present
      if (result.warning) {
        setWarning(result.warning);
      }
    } catch (err: any) {
      console.error("Error uploading file to Supabase:", err);
      
      // Provide a more detailed error message if it's a bucket issue
      if (err.message && err.message.includes('bucket')) {
        setError(err.message);
      } else if (err.message && err.message.includes('logged in')) {
        setError(err.message);
        setShowLoginModal(true);
      } else {
        setError(`Error uploading file: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // If showing plan selector, render that instead of main app
  if (showPlanSelector) {
    return <PlanSelector 
      onSelectFreePlan={handlePlanSelected} 
      user={user} 
      setShowLoginModal={setShowLoginModal}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Create Professional Cover Letters in Seconds</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Upload your CV, paste the job description, and get a tailored cover letter instantly</p>
        </div>

        {/* Credits Status */}
        {user && (
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-sm">
              <div className="flex items-center mr-3">
                <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ml-1 font-medium text-gray-800">Credits:</span>
              </div>
              <span className="text-lg font-bold text-primary">{userCredits}</span>
              
              {userCredits === 0 && (
                <button
                  onClick={() => setShowPlanSelector(true)}
                  className="ml-4 text-sm bg-primary text-white py-1 px-3 rounded hover:bg-blue-700"
                >
                  Buy Credits
                </button>
              )}
            </div>
          </div>
        )}

        {/* Connection/Auth Status Messages (Collapsed by default) */}
        {(connectionStatus || error || warning) && (
          <div className="mb-8">
            {connectionStatus && !connectionStatus.success && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4">
                <p className="font-medium">{connectionStatus.message}</p>
              </div>
            )}
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4">
                <p className="font-medium">{error}</p>
              </div>
            )}
            
            {warning && (
              <div className="p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg mb-4">
                <p className="font-medium">{warning}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Main Form Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CV Upload Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-primary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-800">Upload your CV</h2>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleUploadClick}
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <svg className="h-10 w-10 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-600 font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    {isUploading && (
                      <div className="flex items-center justify-center mt-2">
                        <svg className="animate-spin h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-primary">Uploading...</p>
                      </div>
                    )}
                    
                    {uploadSuccess && (
                      <p className="text-green-600 text-sm">✓ Successfully uploaded to secure storage</p>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setUploadedFilePath(null);
                        setUploadSuccess(false);
                        setWarning(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-red-500 text-sm underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center">
                        <svg className="h-16 w-16 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-700">PDF or Word format (Max 10MB)</p>
                      <p className="text-sm text-gray-500">Drag and drop or click to browse</p>
                    </div>
                  </>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                id="cv-upload" 
                type="file"
                accept=".pdf,application/pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />
              
              {!user && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <span className="font-medium">Note:</span> You'll need to sign in to upload your CV and generate a cover letter.
                  </p>
                  <button 
                    onClick={() => setShowLoginModal(true)}
                    className="mt-2 text-sm bg-primary text-white py-1 px-3 rounded hover:bg-blue-700"
                  >
                    Sign in
                  </button>
                </div>
              )}
              
              {user && userCredits <= 0 && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <p className="text-orange-700 text-sm">
                    <span className="font-medium">Note:</span> You'll need to purchase credits to generate cover letters.
                  </p>
                  <button 
                    onClick={() => setShowPlanSelector(true)}
                    className="mt-2 text-sm bg-primary text-white py-1 px-3 rounded hover:bg-blue-700"
                  >
                    Buy Credits
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Job Description Section */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <svg className="h-8 w-8 text-primary mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <h2 className="text-2xl font-semibold text-gray-800">Job Description</h2>
              </div>
              
              <textarea
                className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={handleJobDescriptionChange}
              ></textarea>
              
              <p className="mt-2 text-sm text-gray-500">Paste the complete job description to help us generate a tailored cover letter</p>
            </div>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGenerateCoverLetter}
            disabled={isGenerating || !uploadedFilePath || !jobDescription || !user || userCredits <= 0}
            className={`py-3 px-8 text-lg font-medium rounded-lg transition-colors ${
              isGenerating || !uploadedFilePath || !jobDescription || !user || userCredits <= 0
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-primary hover:bg-blue-700 text-white'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Cover Letter...
              </span>
            ) : !user ? (
              'Login to Continue'
            ) : userCredits <= 0 ? (
              'Purchase Credits to Generate'
            ) : !uploadedFilePath ? (
              'Upload CV First'
            ) : !jobDescription ? (
              'Enter Job Description'
            ) : (
              `Generate Cover Letter (1 Credit)`
            )}
          </button>
        </div>
        
        {/* Cover Letter Result */}
        {coverLetter && (
          <div className="mt-12 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Generated Cover Letter</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-gray-700">{coverLetter}</pre>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => navigator.clipboard.writeText(coverLetter)}
                  className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => {
                    setCoverLetter(null);
                    setJobDescription('');
                    setFile(null);
                    setUploadedFilePath(null);
                    setUploadSuccess(false);
                  }}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Create New
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={handleCloseLoginModal} 
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default CoverLetterGenerator;