import type { Metadata } from 'next';
import React from 'react';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'CoverGen - Cover Letter Generator',
  description: 'Generate personalized cover letters for your job applications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}