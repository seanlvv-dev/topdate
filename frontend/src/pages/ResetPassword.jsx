import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        code,
        new_password: newPassword,
      });
      navigate('/login', { state: { message: '密码重置成功，请使用新密码登录' } });
    } catch (err) {
      setError(err.response?.data?.detail || '重置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold">重设密码</h1>
          <p className="text-gray-400 mt-1">
            验证码已发送至 <span className="font-medium text-primary-600">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 animate-slide-up">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">验证码</label>
            <input
              type="text"
              className="input-field text-center text-2xl tracking-widest font-bold"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">新密码</label>
            <input
              type="password"
              className="input-field"
              placeholder="至少6位密码"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">确认密码</label>
            <input
              type="password"
              className="input-field"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '重置中...' : '重置密码'}
          </button>

          <p className="text-center text-sm text-gray-400">
            <Link to="/login" className="text-primary-500 font-medium">返回登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
