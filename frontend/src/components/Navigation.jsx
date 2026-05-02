import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="text-2xl">❤️</span>
          <span className="gradient-text">TopDate</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/matches" className="text-gray-600 hover:text-primary-500 transition-colors font-medium text-sm">我的匹配</Link>
              <Link to="/profile" className="text-gray-600 hover:text-primary-500 transition-colors font-medium text-sm">个人资料</Link>
              {user.is_admin && (
                <Link to="/admin" className="text-accent-600 hover:text-accent-700 transition-colors font-medium text-sm">管理</Link>
              )}
              <span className="text-sm text-gray-400">|</span>
              <span className="text-sm text-gray-500">{user.nickname || user.email}</span>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-500 transition-colors">退出</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary-500 transition-colors font-medium text-sm">登录</Link>
              <Link to="/register" className="btn-primary !py-2 !px-5 text-sm">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
