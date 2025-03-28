import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Upload Resume</h2>
          <p className="mb-4">Upload your resume to generate a personalized cover letter</p>
          <button className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Upload Resume
          </button>
        </div>
        
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Enter Job Description</h2>
          <p className="mb-4">Enter the job description to tailor your cover letter</p>
          <button className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Start Writing
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/" className="text-primary hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}