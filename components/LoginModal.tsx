"use client";

import { signIn, signUp } from '@/lib/auth';
import { useState } from 'react';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const LoginModal = ({ onClose, onSuccess }: LoginModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await signIn(email, password);
        if (error) {
          throw new Error(error.message);
        }
        setSuccess('Login successful!');
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        }
      } else {
        // Registration flow
        if (!fullName) {
          throw new Error('Please enter your full name');
        }
        
        // Validate password
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        
        // Check that passwords match
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Register user with Supabase
        const { data, error } = await signUp(email, password, fullName);
        
        if (error) {
          throw error;
        }
        
        console.log('Registration successful:', data);
        
        // Rather than immediately closing modal, sign in the user
        await signIn(email, password);

        // Trigger login success callback
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl p-6">
        <h2 className="text-2xl font-bold mb-4">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        
        <p className="mb-4 text-gray-600">
          {isLogin 
            ? 'Authentication is required to upload files to Supabase Storage due to security policies.'
            : 'Create an account to get started with cover letter generation.'}
        </p>
        
        {!isLogin && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <h3 className="font-medium mb-1">Choose between plans after registration:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><span className="font-medium">Free Plan:</span> 5 cover letter generations</li>
              <li><span className="font-medium">Premium Plan:</span> Unlimited cover letters for only €3/month</li>
            </ul>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                placeholder="Enter your full name"
                disabled={isLoading}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter your email"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>
          
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                placeholder="Enter your password again"
                disabled={isLoading}
                required
              />
            </div>
          )}
          
          {!isLogin && (
            <div className="text-xs text-gray-500 mt-2">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isLogin ? 'Logging in...' : 'Registering...'}
              </span>
            ) : (
              isLogin ? 'Login' : 'Register & Continue'
            )}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button onClick={toggleMode} className="text-primary hover:underline">
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 