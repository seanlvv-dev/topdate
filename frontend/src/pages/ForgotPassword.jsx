import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full animate-slide-up">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold mb-2">验证码已发送</h2>
          <p className="text-gray-500 mb-6">
            密码重置验证码已发送至 <span className="font-medium text-primary-600">{email}</span>，
            请在10分钟内完成验证。
          </p>
          <Link to={`/reset-password?email=${encodeURIComponent(email)}`} className="btn-primary inline-block">
            去重设密码
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold">忘记密码</h1>
          <p className="text-gray-400 mt-1">输入注册邮箱，我们将发送验证码</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 animate-slide-up">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">注册邮箱</label>
            <input
              type="email"
              className="input-field"
              placeholder="yourname@edu.cn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '发送中...' : '发送验证码'}
          </button>

          <p className="text-center text-sm text-gray-400">
            想起密码了？<Link to="/login" className="text-primary-500 font-medium">登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
