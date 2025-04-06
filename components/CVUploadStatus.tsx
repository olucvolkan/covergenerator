import React from 'react';

interface CVUploadStatusProps {
  file: File | null;
  isUploading: boolean;
  uploadSuccess: boolean;
  uploadedFileId: string | null;
  error: string | null;
  onRemove: () => void;
}

const CVUploadStatus: React.FC<CVUploadStatusProps> = ({
  file,
  isUploading,
  uploadSuccess,
  uploadedFileId,
  error,
  onRemove
}) => {
  if (!file) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-gray-400 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
        
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
          disabled={isUploading}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="mt-3">
        {isUploading && (
          <div className="flex items-center">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
            </div>
            <span className="ml-3 text-sm text-blue-600">Uploading...</span>
          </div>
        )}
        
        {uploadSuccess && !isUploading && (
          <div className="flex items-center text-green-600">
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm">Successfully uploaded {uploadedFileId ? `(ID: ${uploadedFileId.substring(0, 8)}...)` : ''}</span>
          </div>
        )}
        
        {error && !isUploading && (
          <div className="flex items-center text-red-600">
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVUploadStatus;