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
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error fetching user:', err);
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
    const currentUser = await getCurrentUser();
    setUser(currentUser);
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
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-primary">
              CoverGen
            </Link>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded-md"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {user.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={handleLoginClick}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign in
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