import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import LoginModal from './LoginModal';

interface UserCreditsInfo {
  credits: number;
  generated_cover_letters: number;
  has_paid: boolean;
  latest_file: {
    id: string;
    file_name: string;
    created_at: string;
  } | null;
}

const ChromeExtensionGenerator = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [creditsInfo, setCreditsInfo] = useState<UserCreditsInfo | null>(null);

  // Check user session and load credits info on component mount
  useEffect(() => {
    const initComponent = async () => {
      try {
        setIsLoading(true);
        
        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser.data?.user || null);
        
        if (currentUser.data?.user) {
          // Fetch user's credits and latest file
          await fetchUserCredits();
        }
      } catch (err: any) {
        console.error('Error initializing component:', err);
        setError(err.message || 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };
    
    initComponent();
  }, []);

  // Fetch user credits and latest file info
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/get-user-credits');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch credits');
      }
      
      const data = await response.json();
      setCreditsInfo(data);
      
      return data;
    } catch (err: any) {
      console.error('Error fetching credits:', err);
      setError('Could not load credits information');
      return null;
    }
  };

  const handleLoginSuccess = async () => {
    // Get current user after successful login
    const currentUser = await getCurrentUser();
    setUser(currentUser.data?.user || null);
    setShowLoginModal(false);
    
    if (currentUser.data?.user) {
      await fetchUserCredits();
    }
  };

  const handleGenerateCoverLetter = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!jobDescription) {
      setError('Please enter a job description');
      return;
    }

    if (!creditsInfo || creditsInfo.credits <= 0) {
      setError('You need credits to generate a cover letter');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate cover letter using the latest file ID if available
      const response = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          user_id: user.id,
          file_id: creditsInfo.latest_file?.id // This can be undefined/null, the API will handle it
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetter(data.cover_letter);
      
      // Refresh credits info after generation
      await fetchUserCredits();
    } catch (err: any) {
      setError(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credits Status */}
      {user && creditsInfo && (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Available Credits:</span>
            <span className="ml-2 text-lg font-bold text-blue-600">{creditsInfo.credits}</span>
          </div>
          
          {creditsInfo.latest_file && (
            <div className="text-sm text-gray-600">
              <span>Using CV: </span>
              <span className="font-medium">{creditsInfo.latest_file.file_name}</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* CV Warning */}
      {user && creditsInfo && !creditsInfo.latest_file && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
          <p className="font-medium">No CV found</p>
          <p className="text-sm mt-1">Please upload a CV through the main website before generating a cover letter.</p>
        </div>
      )}
      
      {/* Job Description Input */}
      <div>
        <label 
          htmlFor="job-description" 
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Job Description
        </label>
        <textarea
          id="job-description"
          className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        ></textarea>
      </div>
      
      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateCoverLetter}
          disabled={
            isGenerating || 
            !jobDescription || 
            !user ||
            (creditsInfo && creditsInfo.credits <= 0) ||
            (user && creditsInfo && !creditsInfo.latest_file)
          }
          className={`py-3 px-8 rounded-lg font-medium ${
            isGenerating || !jobDescription || !user || (creditsInfo && creditsInfo.credits <= 0) || (user && creditsInfo && !creditsInfo.latest_file)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : !user ? (
            'Login to Continue'
          ) : (creditsInfo && creditsInfo.credits <= 0) ? (
            'Purchase Credits'
          ) : (user && creditsInfo && !creditsInfo.latest_file) ? (
            'Upload CV First'
          ) : (
            'Generate Cover Letter'
          )}
        </button>
      </div>
      
      {/* Cover Letter Result */}
      {coverLetter && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Generated Cover Letter</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-gray-700">{coverLetter}</pre>
          </div>
          <div className="mt-4 flex space-x-4">
            <button
              onClick={() => navigator.clipboard.writeText(coverLetter)}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

export default ChromeExtensionGenerator;