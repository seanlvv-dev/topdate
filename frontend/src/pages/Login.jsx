import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/matches');
    } catch (err) {
      setError(err.response?.data?.detail || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-4xl mb-3">❤️</div>
          <h1 className="text-2xl font-bold">欢迎回来</h1>
          <p className="text-gray-400 mt-1">登录 TopDate 查看你的匹配</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 animate-slide-up">
          {successMessage && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-2xl">{successMessage}</div>
          )}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">学校邮箱</label>
            <input
              type="email"
              className="input-field"
              placeholder="yourname@pku.edu.cn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
            <input
              type="password"
              className="input-field"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm text-primary-500 hover:text-primary-600">忘记密码？</Link>
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-gray-400">
            还没有账号？<Link to="/register" className="text-primary-500 font-medium">立即注册</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
