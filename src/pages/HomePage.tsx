import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <motion.div
        className="title-container"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="main-title">수학사 여정</h1>
        <h2 className="subtitle">수의 문명을 찾아서</h2>
      </motion.div>

      <motion.div
        className="intro-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <p>
          "그 밤, 별은 고요히 숨을 고르고 있었도다."
        </p>
        <p>
          인류가 수를 발견한 순간부터,<br />
          복소평면을 완성하기까지.
        </p>
        <p>
          17개의 수학 영역을 여행하며,<br />
          문명의 발자취를 따라가는 여정이 시작되도다.
        </p>
      </motion.div>

      <motion.div
        className="button-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <button
          className="start-button"
          onClick={() => navigate('/game')}
        >
          여정 시작하기
        </button>
        <button
          className="album-button"
          onClick={() => navigate('/album')}
        >
          카드 앨범 보기
        </button>
      </motion.div>

      <motion.div
        className="chapter-preview"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <h3>여정의 장들</h3>
        <div className="chapter-list">
          <span className="chapter-item active">1. 수체계</span>
          <span className="chapter-item">2. 지수와 로그</span>
          <span className="chapter-item">3. 수열</span>
          <span className="chapter-item">4. 식의 계산</span>
          <span className="chapter-item">5. 집합과 명제</span>
          <span className="chapter-item">...그리고 12개의 여정</span>
        </div>
      </motion.div>
    </div>
  );
}
