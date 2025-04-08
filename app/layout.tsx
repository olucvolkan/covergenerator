import type { Metadata } from 'next';
import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CvToLetter - Cover Letter Generator',
  description: 'Generate personalized cover letters for your job applications in seconds',
  keywords: 'cover letter, generator, cv to letter, job application, AI cover letter, personalized cover letter',
  authors: [{ name: 'CvToLetter Team' }],
  openGraph: {
    title: 'CvToLetter - AI Powered Cover Letter Generator',
    description: 'Create tailored cover letters for your job applications with AI technology',
    url: 'https://cvtoletter.com',
    siteName: 'CvToLetter',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CvToLetter - AI Cover Letter Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CvToLetter - AI Powered Cover Letter Generator',
    description: 'Create tailored cover letters for your job applications with AI technology',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    }
  },
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