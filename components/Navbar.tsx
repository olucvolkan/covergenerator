"use client";

import { getCurrentUser, signOut } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import LoginModal from './LoginModal';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const { data, error } = await getCurrentUser();
        
        if (error) {
          console.error('Error in Navbar auth check:', error);
          setUser(null);
        } else {
          setUser(data?.user || null);
        }
      } catch (err) {
        console.error('Error fetching user in Navbar:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleModalClose = async () => {
    setShowLoginModal(false);
    // Check if user has logged in
    const { data } = await getCurrentUser();
    setUser(data?.user || null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xl font-bold text-gray-900">CvToLetter</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Home
            </Link>
            
            <Link href="/how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              How It Works
            </Link>
            
            <Link href="/pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Pricing
            </Link>

            <Link href="/extension-welcome" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Extension
            </Link>

            <Link href="/privacy-policy" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
              Privacy Policy
            </Link>
            
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">
                  Profile
                </Link>
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Log In
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showLoginModal && (
        <LoginModal onClose={handleModalClose} />
      )}
    </nav>
  );
}