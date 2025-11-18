import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                Relation Thermo
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                홈
              </Link>
              <Link
                to="/practice"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                학습하기
              </Link>
              <Link
                to="/stats"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                통계
              </Link>

              {/* User menu */}
              <div className="flex items-center space-x-4 border-l pl-6">
                <span className="text-sm text-gray-600">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-red-600 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
};

export default Layout;
