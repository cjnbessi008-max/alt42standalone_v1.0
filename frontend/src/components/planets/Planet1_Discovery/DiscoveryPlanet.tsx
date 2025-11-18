/**
 * KTM Math Planet - Discovery Planet (Planet 1)
 * World Model Reconstruction: Teacher inputs natural language request
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanetContainer } from '../../shared/PlanetContainer';
import { PlanetNumber } from '../../../types/planets';
import { ConceptMap } from './ConceptMap';
import { NLPInput } from './NLPInput';
import { WorldModel } from '../../../types/pipeline';

export const DiscoveryPlanet: React.FC = () => {
  const [step, setStep] = useState<'input' | 'analyzing' | 'reviewing'>('input');
  const [teacherRequest, setTeacherRequest] = useState('');
  const [worldModel, setWorldModel] = useState<WorldModel | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSubmitRequest = async (request: string) => {
    setTeacherRequest(request);
    setStep('analyzing');
    setProgress(30);

    // Simulate AI processing
    setTimeout(() => {
      // Mock world model for demo
      const mockWorldModel: WorldModel = {
        concepts: [
          { id: '1', name: '분수', type: 'concept', description: '부분과 전체의 관계' },
          { id: '2', name: '분자', type: 'concept', description: '분수의 위 부분' },
          { id: '3', name: '분모', type: 'concept', description: '분수의 아래 부분' },
          { id: '4', name: '피자', type: 'concept', description: '시각화 도구' },
          { id: '5', name: '분수 덧셈', type: 'operation' },
          { id: '6', name: '분수 뺄셈', type: 'operation' }
        ],
        relationships: [
          {
            id: 'r1',
            sourceId: '1',
            targetId: '2',
            relationshipType: 'has-a',
            description: '분수는 분자를 가진다'
          },
          {
            id: 'r2',
            sourceId: '1',
            targetId: '3',
            relationshipType: 'has-a',
            description: '분수는 분모를 가진다'
          },
          {
            id: 'r3',
            sourceId: '4',
            targetId: '1',
            relationshipType: 'represents',
            description: '피자는 분수를 표현한다'
          }
        ],
        operations: ['분수 덧셈', '분수 뺄셈', '분수 시각화', '분수 비교'],
        learningObjectives: [
          '분수의 개념을 시각적으로 이해한다',
          '분수의 덧셈과 뺄셈을 수행할 수 있다',
          '실생활 예시를 통해 분수를 익힌다'
        ],
        clarificationQuestions: [
          '학생들이 분수를 처음 배우나요, 아니면 복습인가요?',
          '분수의 곱셈과 나눗셈도 포함할까요?',
          '난이도는 어느 정도로 설정할까요? (쉬움/보통/어려움)'
        ]
      };

      setWorldModel(mockWorldModel);
      setStep('reviewing');
      setProgress(100);
    }, 3000);
  };

  const handleApprove = () => {
    // Move to next planet
    console.log('World model approved, moving to Logic Planet');
  };

  const handleModify = () => {
    setStep('input');
    setProgress(0);
  };

  return (
    <PlanetContainer
      planetNumber={PlanetNumber.DISCOVERY}
      progressPercentage={progress}
      canProceed={step === 'reviewing'}
      onNext={handleApprove}
    >
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <NLPInput
            key="input"
            onSubmit={handleSubmitRequest}
            initialValue={teacherRequest}
          />
        )}

        {step === 'analyzing' && (
          <motion.div
            key="analyzing"
            className="flex flex-col items-center justify-center h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-8xl mb-8"
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                scale: { duration: 1.5, repeat: Infinity }
              }}
            >
              🔭
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">
              AI가 개념을 탐험하고 있습니다...
            </h2>
            <p className="text-gray-300 mb-8">
              교육 모듈의 세계관을 재구성하는 중입니다
            </p>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3 }}
              />
            </div>
          </motion.div>
        )}

        {step === 'reviewing' && worldModel && (
          <motion.div
            key="reviewing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                🎉 세계관 재구성 완료!
              </h2>
              <p className="text-gray-300">
                AI가 발견한 개념들을 검토하고 확인해주세요.
              </p>
            </div>

            {/* Original Request */}
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">
                📝 선생님의 요청
              </h3>
              <p className="text-white">{teacherRequest}</p>
            </div>

            {/* Concept Map */}
            <ConceptMap worldModel={worldModel} />

            {/* Learning Objectives */}
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h3 className="text-sm font-semibold text-green-300 mb-3">
                🎯 학습 목표
              </h3>
              <ul className="space-y-2">
                {worldModel.learningObjectives.map((objective, index) => (
                  <li key={index} className="text-white flex items-start gap-2">
                    <span className="text-green-400 mt-1">✓</span>
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clarification Questions */}
            {worldModel.clarificationQuestions && worldModel.clarificationQuestions.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-300 mb-3">
                  ❓ 명확화 질문
                </h3>
                <div className="space-y-3">
                  {worldModel.clarificationQuestions.map((question, index) => (
                    <div key={index}>
                      <p className="text-white mb-2">{question}</p>
                      <input
                        type="text"
                        placeholder="답변을 입력하세요..."
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleModify}
                className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
              >
                ✏️ 요청 수정하기
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition"
              >
                ✅ 승인하고 다음 단계로
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlanetContainer>
  );
};
