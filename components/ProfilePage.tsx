'use client'
import { getCurrentUser, supabase } from '@/lib/auth';
import { CREDIT_PLANS } from '@/lib/stripe';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type ProfileData = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  has_paid: boolean;
  credits: number;
  generated_cover_letters: number;
  created_at: string;
  updated_at: string;
};

type CoverLetter = {
  id: string;
  job_title: string | null;
  company_name: string | null;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  // Using the centralized supabase client from lib/auth
  // No need to create a new client instance here

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching user data...');
      
      // Get user data from auth
      const { data, error: userError } = await getCurrentUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        setError('Failed to fetch user data');
        return;
      }
      
      if (!data?.user) {
        console.error('No user found in getCurrentUser response');
        router.push('/?login=true');
        return;
      }

      console.log('User data fetched successfully');
      
      // Fetch cover letters for this user
      const { data: coverLettersData, error: coverLettersError } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false });
      
      if (coverLettersError) {
        console.error('Error fetching cover letters:', coverLettersError);
      }
      
      setUser(data.user);
      setProfile(data.profile);
      setCoverLetters(coverLettersData || []);
    } catch (err: any) {
      console.error('Error fetching profile data:', err);
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleGeneratePDF = async (coverLetterId: string) => {
    try {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      
      // Call PDF generation endpoint
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetterId,
          userId: user.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
      
      const { url } = await response.json();
      
      // Open PDF in a new tab
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('No PDF URL returned');
      }
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user or profile is null, show a friendly message
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Profile Not Found
            </h2>
            <p className="text-gray-600 mb-6">We couldn't find your profile information.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {profile.full_name || user.email}
                </h1>
                <p className="text-blue-100 mt-1">{user.email}</p>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-800 text-white">
                  {profile.has_paid ? 'Premium Member' : 'Free User'}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 sm:p-8">
            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-1">Credits Balance</h3>
                <p className="text-3xl font-bold text-blue-600">{profile.credits || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Available credits</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-1">Cover Letters</h3>
                <p className="text-3xl font-bold text-blue-600">{profile.generated_cover_letters || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Generated so far</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-1">Member Since</h3>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Purchase More Credits */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Need More Credits?
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.values(CREDIT_PLANS).map((plan) => (
                  <div 
                    key={plan.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">${plan.price}</p>
                    <p className="text-sm text-gray-600 mb-3">{plan.credits} credits</p>
                    <Link href="/pricing" className="block text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                      Purchase
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Letters Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Your Cover Letters
              </h2>
              
              {coverLetters.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-4 text-gray-600">You haven't generated any cover letters yet.</p>
                  <Link href="/" className="mt-4 inline-block text-primary hover:text-blue-700 font-medium">
                    Generate your first cover letter
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {coverLetters.map((letter) => (
                    <div
                      key={letter.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {letter.job_title || "Untitled"} {letter.company_name ? `at ${letter.company_name}` : ""}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Created on {new Date(letter.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <button
                            onClick={() => handleGeneratePDF(letter.id)}
                            className="text-sm bg-primary text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Personal Information
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="text-base font-medium text-gray-900">
                      {profile.full_name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="text-base font-medium text-gray-900">
                      {user.email}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">First Name</h3>
                    <p className="text-base font-medium text-gray-900">
                      {profile.first_name || 'Not provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Last Name</h3>
                    <p className="text-base font-medium text-gray-900">
                      {profile.last_name || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                Generate Cover Letter
              </Link>
              
              <Link href="/pricing" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50">
                Purchase Credits
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}