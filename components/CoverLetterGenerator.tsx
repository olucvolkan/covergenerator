"use client";

import { getCurrentUser, testSupabaseConnection } from '@/lib/auth';
import { uploadPDF } from '@/lib/pdfParser';
import React, { useEffect, useRef, useState } from 'react';

// Geçici bir LoginModal bileşeni oluşturalım (linter hatası için)
const LoginModal = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4">Login / Register</h2>
        <p className="mb-4">Please implement a proper login modal or use the Supabase Auth UI.</p>
        <button 
          onClick={onClose}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const CoverLetterGenerator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{success: boolean, message: string, warning?: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setUser(currentUser);
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
    setWarning(null);
    setUploadSuccess(false);
    
    try {
      // Upload PDF to Supabase Storage
      const result = await uploadPDF(fileToUpload, user.id);
      console.log("File uploaded to Supabase:", result);
      
      setUploadedFilePath(result.path);
      setUploadSuccess(true);
      
      // RLS uyarısını göster
      if (result.warning) {
        setWarning(result.warning);
      }
    } catch (err: any) {
      console.error("Error uploading file to Supabase:", err);
      
      // Provide a more detailed error message if it's a bucket issue
      if (err.message && err.message.includes('bucket')) {
        setError(err.message);
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

  const handleUploadToSupabase = async () => {
    if (!file) {
      setError('Please upload your CV');
      return;
    }

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    await handleFileUpload(file);
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
          onClick={handleUploadToSupabase}
          disabled={isUploading || !file}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            isUploading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-blue-700'
          }`}
        >
          {isUploading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </span>
          ) : uploadSuccess ? (
            'File Uploaded Successfully'
          ) : (
            'Upload to Supabase'
          )}
        </button>
      </div>

      {/* Right Column - Resume Information */}
      <div className="p-6 bg-white rounded-lg shadow-md h-full">
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
          <div className="flex flex-col items-center justify-center h-[500px] text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Storage information will appear here</p>
            <p className="text-sm">Upload your CV to Supabase Storage to see the details</p>
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