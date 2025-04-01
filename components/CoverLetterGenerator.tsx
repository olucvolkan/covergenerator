"use client";

import { getCurrentUser, testSupabaseConnection } from '@/lib/auth';
import { uploadPDF } from '@/lib/pdfParser';
import { checkUserPremiumAccess } from '@/lib/stripe';
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
    
    // File size check (max 5MB)
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      setError(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
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
    
    // Check if user has premium access
    try {
      const hasPremiumAccess = await checkUserPremiumAccess(user.user);
      
      if (!hasPremiumAccess) {
        console.log("User does not have premium access. Showing plan selector.");
        // Direct the user to the plan selector
        setShowPlanSelector(true);
        setFile(fileToUpload); // Save the file for later upload after plan selection
        return;
      }
      
      console.log("User has premium access. Proceeding with upload.");
    } catch (err) {
      console.error("Error checking premium access:", err);
      // If there's an error checking access, continue as if they don't have access
      setShowPlanSelector(true);
      setFile(fileToUpload);
      return;
    }
    
    // If we reach here, the user has premium access and can upload
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

    setIsGenerating(true);
    setError(null);

    try {
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
    
    // If there's a file pending upload, try uploading it now that the user is logged in
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const handleSelectFreePlan = () => {
    // Handle free plan selection - redirect back to main app
    setShowPlanSelector(false);
    
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
      onSelectFreePlan={handleSelectFreePlan} 
      user={user} 
      setShowLoginModal={setShowLoginModal}
    />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Connection Status */}
      {connectionStatus && (
        <div className={`col-span-full mb-4 p-4 rounded-lg ${
          connectionStatus.success ? 'bg-green-50 text-green-700 border border-green-200' : 
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <p className="font-medium">
            {connectionStatus.success ? '✓ ' : '✗ '}
            {connectionStatus.message}
          </p>
          {connectionStatus.warning && (
            <p className="mt-2 text-orange-600">
              Warning: {connectionStatus.warning}
            </p>
          )}
          {!connectionStatus.success && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Please check:</p>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Your Supabase URL and Anon Key in .env.local are correct</li>
                <li>The 'user_files' table exists in your Supabase database</li>
                <li>The 'resumes' bucket exists in Supabase Storage</li>
                <li>Your Supabase project is running and accessible</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* User Auth Status */}
      <div className={`col-span-full mb-4 p-4 rounded-lg ${
        user ? 'bg-green-50 text-green-700 border border-green-200' : 
        'bg-orange-50 text-orange-700 border border-orange-200'
      }`}>
        {user ? (
          <p className="font-medium">✓ Logged in as: {user.email}</p>
        ) : (
          <div>
            <p className="font-medium">⚠️ Not logged in</p>
            <p className="text-sm mt-1">You must be logged in to upload files to Supabase Storage due to security policies.</p>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="mt-2 bg-primary text-white py-1 px-3 rounded-md text-sm hover:bg-blue-700"
            >
              Log in
            </button>
          </div>
        )}
      </div>

      {/* Left Column - CV Upload and Job Description */}
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleUploadClick}
          >
            {file ? (
              <div className="space-y-2">
                <p className="text-green-600 font-medium">File uploaded: {file.name}</p>
                {isUploading && (
                  <p className="text-blue-500">
                    <span className="inline-block animate-pulse">Uploading to secure storage...</span>
                  </p>
                )}
                {uploadSuccess && (
                  <p className="text-green-600 text-sm">File successfully uploaded to Supabase!</p>
                )}
                {uploadedFilePath && (
                  <p className="text-blue-600 text-sm">Saved to secure storage</p>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadedFilePath(null);
                    setUploadSuccess(false);
                    setWarning(null);
                  }}
                  className="text-red-500 text-sm underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF (max. 5MB)</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="cv-upload" 
                  type="file"
                  accept=".pdf,application/pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={handleJobDescriptionChange}
          ></textarea>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
            {error.includes('bucket') && (
              <div className="mt-2 text-sm">
                <p className="font-medium">To fix this:</p>
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to Storage</li>
                  <li>Click "New Bucket"</li>
                  <li>Name it "resumes"</li>
                  <li>Set the bucket to public access</li>
                  <li>Click "Create bucket"</li>
                </ol>
              </div>
            )}
            {error.includes('logged in') && (
              <div className="mt-2 text-sm">
                <p className="font-medium">To fix this:</p>
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  <li>Please log in using the button above</li>
                  <li>Check your Supabase storage bucket policies to ensure authenticated users can upload</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {warning && (
          <div className="p-4 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg">
            <p className="font-medium">Warning:</p>
            <p>{warning}</p>
            {warning.includes('row-level security') && (
              <div className="mt-2 text-sm">
                <p className="font-medium">To fix this Row-Level Security (RLS) issue:</p>
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  <li>Go to your Supabase dashboard</li>
                  <li>Navigate to Authentication → Policies</li>
                  <li>Find the 'user_files' table</li>
                  <li>Click "New Policy" and select "Create a policy from scratch"</li>
                  <li>For the policy definition, use something like:</li>
                  <code className="block mt-1 p-2 bg-gray-100 text-xs">
                    (auth.uid() = user_id)
                  </code>
                  <li>Select "INSERT" for the operation</li>
                  <li>Name the policy "Users can insert their own files"</li>
                  <li>Save the policy</li>
                </ol>
                <p className="mt-2">The file was still uploaded successfully to storage.</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerateCoverLetter}
          disabled={isGenerating || !uploadedFilePath || !jobDescription || !user}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            isGenerating || !uploadedFilePath || !jobDescription || !user
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Cover Letter...
            </span>
          ) : !user ? (
            'Login Required'
          ) : !uploadedFilePath ? (
            'Upload CV First'
          ) : !jobDescription ? (
            'Enter Job Description'
          ) : (
            'Generate Cover Letter'
          )}
        </button>
      </div>

      {/* Right Column - Resume Information and Cover Letter */}
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resume Storage Information</h2>
          {uploadedFilePath ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-lg mb-2">Upload Details:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><span className="font-medium">File:</span> {file?.name}</li>
                  <li><span className="font-medium">Size:</span> {file ? (file.size / 1024).toFixed(2) + ' KB' : 'Unknown'}</li>
                  <li><span className="font-medium">Type:</span> {file?.type}</li>
                  <li><span className="font-medium">Uploaded by:</span> {user?.email}</li>
                  <li className="break-all"><span className="font-medium">Storage path:</span> {uploadedFilePath}</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-green-700">
                  <span className="font-bold">✓</span> File successfully stored in Supabase Storage!
                </p>
                {warning && (
                  <p className="mt-2 text-orange-600 text-sm">
                    Note: {warning}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Storage information will appear here</p>
              <p className="text-sm">Upload your CV to Supabase Storage to see the details</p>
            </div>
          )}
        </div>

        {/* Cover Letter Display */}
        {coverLetter && (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Generated Cover Letter</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap font-sans text-gray-700">{coverLetter}</pre>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(coverLetter)}
              className="mt-4 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Copy to Clipboard
            </button>
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