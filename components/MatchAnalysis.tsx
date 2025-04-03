
interface MatchAnalysisProps {
  matchScore: number;
  pros: string[];
  cons: string[];
  explanation: string;
}

export default function MatchAnalysis({ matchScore, pros, cons, explanation }: MatchAnalysisProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Match Analysis</h3>
        <div className="flex items-center">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                className="text-gray-200"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
              <circle
                className={`${
                  matchScore >= 70 ? 'text-green-500' : matchScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                }`}
                strokeWidth="8"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * matchScore) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="28"
                cx="32"
                cy="32"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="text-lg font-bold">{matchScore}%</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-gray-600 mb-6">{explanation}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-green-600 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h4>
          <ul className="space-y-2">
            {pros.map((pro, index) => (
              <li key={index} className="text-gray-600 flex items-start">
                <span className="text-green-500 mr-2">•</span>
                {pro}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-red-600 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Areas for Improvement
          </h4>
          <ul className="space-y-2">
            {cons.map((con, index) => (
              <li key={index} className="text-gray-600 flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
} 