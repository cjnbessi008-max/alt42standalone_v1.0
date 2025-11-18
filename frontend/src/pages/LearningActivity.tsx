import { useState, useEffect, useRef } from 'react'
import { useEventTracking } from '../hooks/useEventTracking'

export default function LearningActivity() {
  const [answer, setAnswer] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { trackEvent, startSession, endSession } = useEventTracking()
  const activityRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Start learning session
    const initSession = async () => {
      const session = await startSession('course-1', 'problem-1')
      setSessionId(session)
    }
    initSession()

    // End session on unmount
    return () => {
      if (sessionId) {
        endSession(sessionId)
      }
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnswer(e.target.value)

    if (sessionId) {
      trackEvent(sessionId, 'input', {
        event_action: 'answer_change',
        event_target: 'answer_field',
        event_data: { value_length: e.target.value.length },
      })
    }
  }

  const handleSubmit = () => {
    if (sessionId) {
      trackEvent(sessionId, 'submit', {
        event_action: 'submit_answer',
        event_target: 'submit_button',
        event_data: { answer },
      })

      alert(`제출되었습니다! 답안: ${answer}`)
      setAnswer('')
    }
  }

  return (
    <div className="dashboard" ref={activityRef}>
      <div className="dashboard-header">
        <h1 className="dashboard-title">학습 활동</h1>
        <p className="dashboard-subtitle">문제를 풀면서 사고 전성기가 자동으로 추적됩니다</p>
      </div>

      <div className="section">
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          <strong>🔴 실시간 추적 중</strong>
          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.9 }}>
            학습 활동이 실시간으로 기록되고 있습니다
          </div>
        </div>

        <h2 className="section-title">문제: 분수 덧셈</h2>

        <div style={{
          background: '#f8f9fa',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
            <strong>1/4 + 1/4 = ?</strong>
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            marginBottom: '2rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'conic-gradient(#667eea 0deg 90deg, #e1e8ed 90deg 360deg)',
                margin: '0 auto',
              }} />
              <div style={{ marginTop: '1rem', color: '#7f8c8d' }}>1/4</div>
            </div>
            <div style={{ fontSize: '3rem', display: 'flex', alignItems: 'center' }}>+</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'conic-gradient(#764ba2 0deg 90deg, #e1e8ed 90deg 360deg)',
                margin: '0 auto',
              }} />
              <div style={{ marginTop: '1rem', color: '#7f8c8d' }}>1/4</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
              <strong>답을 입력하세요:</strong>
            </div>
            <input
              type="text"
              value={answer}
              onChange={handleInputChange}
              onFocus={() => sessionId && trackEvent(sessionId, 'focus', { event_target: 'answer_field' })}
              onBlur={() => sessionId && trackEvent(sessionId, 'blur', { event_target: 'answer_field' })}
              onClick={() => sessionId && trackEvent(sessionId, 'click', { event_target: 'answer_field' })}
              placeholder="예: 1/2"
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                border: '2px solid #667eea',
                borderRadius: '8px',
                width: '200px',
                textAlign: 'center',
              }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={handleSubmit}
              className="button"
              style={{ fontSize: '1.1rem', padding: '1rem 3rem' }}
            >
              제출하기
            </button>
          </div>
        </div>

        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffc107',
          padding: '1rem',
          borderRadius: '8px',
          color: '#856404',
        }}>
          <strong>💡 힌트:</strong> 분모가 같으면 분자만 더하면 됩니다.
        </div>
      </div>

      {sessionId && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '0.9rem',
        }}>
          <div style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ✓ 세션 활성화
          </div>
          <div style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
            Session ID: {sessionId.substring(0, 8)}...
          </div>
        </div>
      )}
    </div>
  )
}
