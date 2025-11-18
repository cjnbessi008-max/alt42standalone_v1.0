import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ProblemInputProps {
  onSubmit: (problem: string, subject: string) => void;
  loading: boolean;
}

export const ProblemInput: React.FC<ProblemInputProps> = ({ onSubmit, loading }) => {
  const [problem, setProblem] = useState('');
  const [subject, setSubject] = useState('math');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.trim()) {
      onSubmit(problem.trim(), subject);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          문제를 입력하세요
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 과목 선택 */}
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            과목
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     transition-all"
          >
            <option value="math">수학</option>
            <option value="physics">물리</option>
            <option value="chemistry">화학</option>
            <option value="programming">프로그래밍</option>
            <option value="other">기타</option>
          </select>
        </div>

        {/* 문제 입력 */}
        <div>
          <label
            htmlFor="problem"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            문제
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="해결하고 싶은 문제를 입력하세요. 예: 1/2 + 1/3을 계산하세요."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:ring-2 focus:ring-purple-500 focus:border-transparent
                     transition-all resize-none"
          />
        </div>

        {/* 제출 버튼 */}
        <motion.button
          type="submit"
          disabled={loading || !problem.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-white
            flex items-center justify-center gap-2
            transition-all
            ${
              loading || !problem.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 shadow-lg'
            }
          `}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              전략 생성 중...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              해결 전략 생성하기
            </>
          )}
        </motion.button>
      </form>

      {/* 예제 문제 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">예제 문제:</p>
        <div className="flex flex-wrap gap-2">
          {[
            '1/2 + 1/3을 계산하세요.',
            '2x + 5 = 15를 풀어보세요.',
            '원의 넓이를 구하는 방법을 설명하세요.',
          ].map((example, index) => (
            <button
              key={index}
              onClick={() => setProblem(example)}
              className="text-xs px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900
                       text-purple-700 dark:text-purple-300 hover:bg-purple-200
                       dark:hover:bg-purple-800 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
