import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email: user.email, code });
      await refreshUser();
      navigate('/survey');
    } catch (err) {
      setError(err.response?.data?.detail || '验证失败，请检查验证码');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      await api.post('/auth/resend-verification', { email: user.email });
      setResendMsg('验证码已重新发送，请查收邮箱');
    } catch (err) {
      setResendMsg(err.response?.data?.detail || '重发失败');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✉️</div>
          <h1 className="text-2xl font-bold">验证邮箱</h1>
          <p className="text-gray-400 mt-1">
            验证码已发送至 <span className="font-medium text-primary-600">{user?.email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="card space-y-4 animate-slide-up">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}
          {resendMsg && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-2xl">{resendMsg}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">输入6位验证码</label>
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

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '验证中...' : '验证'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-primary-500 hover:text-primary-600 disabled:opacity-50"
            >
              {resending ? '发送中...' : '重新发送验证码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
