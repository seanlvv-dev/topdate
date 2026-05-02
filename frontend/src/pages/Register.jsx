import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUniversities } from '../hooks/useData';
import api from '../utils/api';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', nickname: '', university_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifCode, setVerifCode] = useState('');
  const [verifCodeInput, setVerifCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const { register, refreshUser } = useAuth();
  const { universities } = useUniversities();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await register({
        ...form,
        university_id: parseInt(form.university_id),
      });
      setSuccess(true);
      if (res.verification_code) {
        setVerifCode(res.verification_code);
        setVerifCodeInput(res.verification_code);
      }
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setVerifying(true);
    try {
      await api.post('/auth/verify-email', { email: form.email, code: verifCodeInput });
      await refreshUser();
      navigate('/survey');
    } catch (err) {
      setError(err.response?.data?.detail || '验证失败');
    } finally {
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card max-w-md w-full animate-slide-up space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold mb-2">注册成功！</h2>
            <p className="text-gray-500 text-sm">
              {verifCode
                ? `验证码已生成：${verifCode}（邮件服务暂不可用）`
                : `验证码已发送至 ${form.email}，请查收邮箱`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">输入6位验证码</label>
            <input
              type="text"
              className="input-field text-center text-2xl tracking-widest font-bold"
              placeholder="000000"
              value={verifCodeInput}
              onChange={(e) => setVerifCodeInput(e.target.value)}
              required
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          <button onClick={handleVerify} className="btn-primary w-full" disabled={verifying}>
            {verifying ? '验证中...' : '完成验证'}
          </button>

          {verifCode && (
            <p className="text-xs text-gray-400 text-center">
              邮件服务尚未配置完整，验证码已直接显示在上方
            </p>
          )}
        </div>
      </div>
    );
  }

  const selectedUni = universities.find(u => u.id === parseInt(form.university_id));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold">加入 TopDate</h1>
          <p className="text-gray-400 mt-1">仅限985高校在校学生</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 animate-slide-up">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">昵称</label>
            <input
              type="text"
              name="nickname"
              className="input-field"
              placeholder="你的专属昵称"
              value={form.nickname}
              onChange={handleChange}
              required
              minLength={1}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">选择你的大学</label>
            <select
              name="university_id"
              className="input-field"
              value={form.university_id}
              onChange={handleChange}
              required
            >
              <option value="">请选择大学</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} - {uni.city}
                </option>
              ))}
            </select>
            {selectedUni && (
              <p className="text-xs text-gray-400 mt-1">
                请使用 {selectedUni.email_domains?.map(d => `@${d}`).join(' 或 ')} 邮箱注册
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">学校邮箱</label>
            <input
              type="email"
              name="email"
              className="input-field"
              placeholder={selectedUni ? `yourname@${selectedUni.email_domains?.[0] || 'edu.cn'}` : 'yourname@edu.cn'}
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
            <input
              type="password"
              name="password"
              className="input-field"
              placeholder="至少6位密码"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-gray-400">
            已有账号？<Link to="/login" className="text-primary-500 font-medium">登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
