import { useState } from 'react';
import { FunctionInput } from './components/FunctionInput';
import { GraphCanvas } from './components/GraphCanvas';
import { AnalysisResults } from './components/AnalysisResults';
import { MobileSimulator } from './components/MobileSimulator';
import { GraphAnalyzer } from './utils/graphAnalyzer';
import { GraphAnalysis } from './utils/types';

function App() {
  const [analysis, setAnalysis] = useState<GraphAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (expression: string, domain: { min: number; max: number }) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const analyzer = new GraphAnalyzer(expression, domain);
      const result = analyzer.analyze();

      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || '함수 분석 중 오류가 발생했습니다.');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Graph Skeleton Visualizer
          </h1>
          <p className="text-white/90 text-lg">
            함수의 증가/감소, 극값, 변곡점을 자동으로 분석하는 도구
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 animate-fade-in-up">
            <strong className="font-bold">오류: </strong>
            <span>{error}</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Input */}
          <div className="lg:col-span-1">
            <FunctionInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
          </div>

          {/* Right Column: Graph and Results */}
          <div className="lg:col-span-2 space-y-6">
            <GraphCanvas analysis={analysis} />
            <AnalysisResults analysis={analysis} />
          </div>
        </div>

        {/* Mobile Simulator - Fixed Bottom Right */}
        <MobileSimulator analysis={analysis} />

        {/* Footer */}
        <div className="text-center text-white/80 text-sm mt-12">
          <p>Built with React + TypeScript + Math.js + Recharts</p>
          <p className="mt-2">
            KAIST Touch Math Academy | AI Education System Pipeline
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
