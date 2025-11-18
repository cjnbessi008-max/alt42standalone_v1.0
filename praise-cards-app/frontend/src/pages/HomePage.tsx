import Feed from '@/components/Feed';
import './HomePage.css';

export default function HomePage() {
  // In a real app, you'd get this from auth context
  const currentStudentId = localStorage.getItem('currentStudentId') || undefined;

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="container">
          <h1 className="logo">✨ 오늘 너 잘했어!</h1>
          <p className="tagline">AI가 만들어주는 칭찬 카드</p>
        </div>
      </header>

      <main className="home-main">
        <Feed currentStudentId={currentStudentId} />
      </main>

      <footer className="home-footer">
        <div className="container">
          <p>© 2024 Praise Cards System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
