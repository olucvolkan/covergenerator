"use client";

import { signInWithGoogle } from '@/lib/auth';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import { IconButton, Typography } from '@mui/material';
import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal = ({ onClose, onSuccess }: LoginModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        throw error;
      }
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
        <IconButton
          onClick={onClose}
          className="absolute right-4 top-4"
          sx={{
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <CloseIcon />
        </IconButton>

        <div className="flex flex-col items-center mb-6">
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Welcome to CoverGen
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Sign in with your Google account to start creating personalized cover letters
          </Typography>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="text-blue-800 font-medium text-sm mb-2">Available Plans:</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-blue-700">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                <span className="font-medium">Free Plan:</span>
                <span className="ml-1">5 cover letter generations</span>
              </li>
              <li className="flex items-center text-sm text-blue-700">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                <span className="font-medium">Premium Plan:</span>
                <span className="ml-1">Unlimited cover letters for €3/month</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-white text-gray-700 py-2.5 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Sign in with Google
              </>
            )}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 