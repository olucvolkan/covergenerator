import CoverLetterGenerator from '@/components/CoverLetterGenerator';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Welcome to CoverGen
        </h1>
        <p className="text-center mb-12 text-lg">
          Upload your CV and job description to generate a personalized cover letter
        </p>
        
        <CoverLetterGenerator />
      </div>
    </main>
  );
}