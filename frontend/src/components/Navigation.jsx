import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isHome = location.pathname === '/' || location.pathname === '/dashboard';

  const scrollToStats = () => {
    if (isHome) {
      const el = document.getElementById('stats-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/?scroll=stats';
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 左侧：Logo + 导航项 */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold shrink-0">
            <span className="text-2xl">❤️</span>
            <span className="gradient-text">TopDate</span>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  isHome ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                仪表盘
              </Link>
              <button
                onClick={scrollToStats}
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                配对局势
              </button>
              <span className="px-3 py-1.5 rounded-xl text-sm font-medium text-gray-400 cursor-not-allowed">
                📣 活动公告
              </span>
            </div>
          )}
        </div>

        {/* 右侧：用户区 */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdown(!dropdown)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors"
              >
                <span className="w-7 h-7 bg-primary-100 text-primary-500 rounded-full flex items-center justify-center text-xs font-bold">
                  {user.nickname?.[0] || '?'}
                </span>
                <span className="hidden sm:inline">{user.nickname}</span>
              </button>

              {dropdown && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-fade-in z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    个人资料
                  </Link>
                  <Link
                    to="/matches"
                    onClick={() => setDropdown(false)}
                    className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    我的匹配
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdown(false)}
                      className="block px-4 py-2 text-sm text-accent-600 hover:bg-gray-50 transition-colors"
                    >
                      管理员面板
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => { setDropdown(false); logout(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors"
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
                登录
              </Link>
              <Link to="/register" className="btn-primary !py-2 !px-5 text-sm">
                注册
              </Link>
            </>
          )}
        </div>
      </div>

      {/* 移动端底部导航 */}
      {user && (
        <div className="sm:hidden border-t border-gray-100 px-4 h-12 flex items-center justify-around text-xs">
          <Link to="/" className={`font-medium ${isHome ? 'text-primary-500' : 'text-gray-400'}`}>
            仪表盘
          </Link>
          <button onClick={scrollToStats} className="font-medium text-gray-400">
            配对局势
          </button>
          <Link to="/matches" className="font-medium text-gray-400">
            匹配
          </Link>
          <Link to="/profile" className="font-medium text-gray-400">
            我的
          </Link>
        </div>
      )}
    </nav>
  );
}
