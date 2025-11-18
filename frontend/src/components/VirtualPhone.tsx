import { motion, AnimatePresence } from 'framer-motion';
import { MoodleActivity, ScanState } from '../types';

interface VirtualPhoneProps {
  activity: MoodleActivity | null;
  scanState: ScanState;
}

const VirtualPhone = ({ activity, scanState }: VirtualPhoneProps) => {
  return (
    <div className="sticky top-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          가상 스마트폰 화면
        </h3>

        {/* 스마트폰 프레임 */}
        <div className="relative mx-auto" style={{ width: '280px' }}>
          {/* 스마트폰 외부 프레임 */}
          <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
            {/* 노치 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>

            {/* 화면 */}
            <div className="relative bg-white rounded-[2rem] overflow-hidden" style={{ height: '500px' }}>
              {/* 상태바 */}
              <div className="bg-gray-100 px-4 py-2 flex justify-between items-center text-xs">
                <span className="font-semibold">9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                </div>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 40px)' }}>
                <AnimatePresence mode="wait">
                  {activity ? (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* 활동 헤더 */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">
                          {activity.modulename.toUpperCase()}
                        </div>
                        <h4 className="text-base font-bold text-gray-900">
                          {activity.name}
                        </h4>
                      </div>

                      {/* 조건 표시 영역 */}
                      {activity.conditions && activity.conditions.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-gray-700 border-b pb-2">
                            접근 조건
                          </div>
                          {activity.conditions.map((condition, index) => (
                            <motion.div
                              key={condition.id}
                              className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                                scanState.isScanning && scanState.currentIndex === index
                                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                                  : scanState.isScanning && scanState.currentIndex > index
                                  ? 'border-green-400 bg-green-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                              animate={
                                scanState.isScanning && scanState.currentIndex === index
                                  ? {
                                      scale: [1, 1.05, 1],
                                      boxShadow: [
                                        '0 0 0 0 rgba(59, 130, 246, 0.7)',
                                        '0 0 0 10px rgba(59, 130, 246, 0)',
                                        '0 0 0 0 rgba(59, 130, 246, 0.7)',
                                      ],
                                    }
                                  : {}
                              }
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <div className="flex items-start gap-2">
                                {/* 상태 아이콘 */}
                                <div className="flex-shrink-0 mt-0.5">
                                  {scanState.isScanning && scanState.currentIndex === index ? (
                                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                    </div>
                                  ) : scanState.isScanning && scanState.currentIndex > index ? (
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
                                  )}
                                </div>

                                {/* 조건 내용 */}
                                <div className="flex-1">
                                  <div className="text-xs text-gray-500 mb-1">
                                    {condition.type.toUpperCase()}
                                    {condition.operator && ` (${condition.operator})`}
                                  </div>
                                  <div className="text-sm text-gray-800">
                                    {condition.description}
                                  </div>
                                  {condition.value && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      값: {condition.value}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 중첩 조건 */}
                              {condition.nested && condition.nested.length > 0 && (
                                <div className="ml-7 mt-2 pl-3 border-l-2 border-gray-300 space-y-2">
                                  {condition.nested.map((nested, nestedIndex) => (
                                    <div key={nested.id} className="text-xs text-gray-600">
                                      → {nested.description}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* 조건이 없는 경우 */}
                      {(!activity.conditions || activity.conditions.length === 0) && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          이 활동에는 접근 조건이 없습니다.
                        </div>
                      )}

                      {/* 스캔 상태 표시 */}
                      {scanState.isScanning && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>
                              조건 스캔 중... ({scanState.currentIndex + 1} / {activity.conditions?.length || 0})
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
                      활동을 선택하면<br />조건이 표시됩니다
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 홈 버튼 영역 */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-full"></div>
          </div>

          {/* 스마트폰 그림자 */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-gray-300 blur-xl opacity-50 transform translate-y-4"></div>
        </div>
      </div>
    </div>
  );
};

export default VirtualPhone;
