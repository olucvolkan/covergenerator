import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to CoverGen
        </h1>
        <p className="text-center mb-8">
          Generate personalized cover letters for your job applications
        </p>
        <div className="flex justify-center mt-8">
          <Link href="/dashboard" className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}