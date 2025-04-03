import type { Metadata } from 'next';
import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CvToLetter - Cover Letter Generator',
  description: 'Generate personalized cover letters for your job applications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4">
          {children}
        </div>
      </body>
    </html>
  );
}