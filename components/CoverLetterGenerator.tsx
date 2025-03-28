"use client";

import { getCurrentUser } from '@/lib/auth';
import { uploadPDF } from '@/lib/pdfParser';
import React, { useEffect, useRef, useState } from 'react';
import LoginModal from './LoginModal';

// API endpoint for cover letter generation
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.covergen.com/generate-cover-letter";

const CoverLetterGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generationCount, setGenerationCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for user session on component mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    
    checkUser();
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
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      console.log("File selected:", selectedFile.name, selectedFile.type, selectedFile.size);
      
      if (validatePdfFile(selectedFile)) {
        setFile(selectedFile);
        
        // If user is logged in, upload the file to Supabase
        if (user) {
          await handleFileUpload(selectedFile);
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
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Upload PDF to Supabase Storage
      const { path, url } = await uploadPDF(fileToUpload, user.id);
      console.log("File uploaded to Supabase:", path);
      setUploadedFilePath(path);
    } catch (err: any) {
      console.error("Error uploading file to Supabase:", err);
      setError(`Error uploading file: ${err.message}`);
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
    
    console.log("File drop event triggered");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      console.log("File dropped:", droppedFile.name, droppedFile.type, droppedFile.size);
      
      if (validatePdfFile(droppedFile)) {
        setFile(droppedFile);
        
        // If user is logged in, upload the file to Supabase
        if (user) {
          await handleFileUpload(droppedFile);
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
    if (!file) {
      setError('Please upload your CV');
      return;
    }

    if (!jobDescription) {
      setError('Please enter job description');
      return;
    }

    // Check if user is logged in for non-first generations
    if (generationCount >= 1 && !user) {
      setShowLoginModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Preparing to generate cover letter");
      
      // If file is not yet uploaded to Supabase and user is logged in, upload it first
      let filePath = uploadedFilePath;
      if (!filePath && user) {
        await handleFileUpload(file);
        filePath = uploadedFilePath;
      }
      
      // Create form data to send to the API
      const formData = new FormData();
      
      // Add files with specific filename to ensure proper handling
      formData.append('resume', file, 'resume.pdf');
      formData.append('jobDescription', jobDescription);
      
      // If we have a user, include user ID for tracking
      if (user) {
        formData.append('userId', user.id);
      }
      
      // If we have a file path in Supabase, include it
      if (filePath) {
        formData.append('filePath', filePath);
      }
      
      // Check FormData contents
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(`FormData contains: ${key} = ${value instanceof File ? 
          `File: ${value.name}, ${value.type}, ${value.size} bytes` : 
          (value.toString().substring(0, 20) + '...')}`);
      });

      // Call the external API
      console.log("Sending request to cover letter generation API...");
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to parse API response' }));
        console.error("API error response:", data);
        throw new Error(data.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      console.log("Cover letter received");
      
      if (!data.coverLetter) {
        throw new Error('API did not return a valid cover letter');
      }
      
      setCoverLetter(data.coverLetter);
      setGenerationCount(prevCount => prevCount + 1);
    } catch (err: any) {
      console.error('Error generating cover letter:', err);
      setError(err.message || 'Failed to generate cover letter. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseLoginModal = async () => {
    setShowLoginModal(false);
    
    // Check if the user has logged in during the modal session
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // If there's a file selected but not uploaded, upload it now
      if (file && !uploadedFilePath) {
        await handleFileUpload(file);
      }
    }
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    alert('Cover letter copied to clipboard!');
  };

  const handleDownloadPDF = () => {
    // This would be implemented with a library like jsPDF
    alert('PDF download functionality will be implemented here');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                {uploadedFilePath && (
                  <p className="text-blue-600 text-sm">Saved to secure storage</p>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadedFilePath(null);
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
          </div>
        )}

        <button
          onClick={handleGenerateCoverLetter}
          disabled={isLoading || !file || !jobDescription}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            isLoading || !file || !jobDescription
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Cover Letter'
          )}
        </button>
      </div>

      {/* Right Column - Cover Letter Result */}
      <div className="p-6 bg-white rounded-lg shadow-md h-full">
        <h2 className="text-xl font-semibold mb-4">Your Cover Letter</h2>
        {coverLetter ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-line h-[500px] overflow-y-auto">
              {coverLetter}
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={handleCopyCoverLetter}
                className="py-2 px-4 bg-primary text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="py-2 px-4 bg-primary text-white rounded hover:bg-blue-700"
              >
                Download as PDF
              </button>
              <button 
                onClick={handleGenerateCoverLetter}
                className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Regenerate
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Your cover letter will appear here</p>
            <p className="text-sm">Upload your CV and paste the job description, then click "Generate Cover Letter"</p>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal onClose={handleCloseLoginModal} />
      )}
    </div>
  );
};

export default CoverLetterGenerator; 