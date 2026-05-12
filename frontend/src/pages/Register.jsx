import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUniversities } from '../hooks/useData';
import api, { setToken } from '../utils/api';

export default function Register() {
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register, refreshUser } = useAuth();
  const { universities } = useUniversities();
  const navigate = useNavigate();

  const selectedUni = universities.find(u => u.id === parseInt(universityId));

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setError('');
    setMsg('');
    if (!email || !universityId) {
      setError('请填写邮箱并选择大学');
      return;
    }
    setSendingCode(true);
    try {
      const res = await api.post('/auth/send-code', {
        email,
        university_id: parseInt(universityId),
      });
      setCodeSent(true);
      setCountdown(60);
      if (res.data.verification_code) {
        setCode(res.data.verification_code);
        setMsg('邮件暂时不可用。验证码已显示在下方，直接使用即可。');
      } else {
        setMsg('验证码已发送至你的邮箱，请查收。');
      }
    } catch (err) {
      setError(err.response?.data?.detail || '发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!code || !nickname || !password) {
      setError('请填写所有必填项');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    setRegistering(true);
    try {
      const res = await register({
        email,
        university_id: parseInt(universityId),
        password,
        nickname,
        department,
        code,
      });
      // 注册成功后自动登录
      if (res.access_token) {
        setToken(res.access_token);
        await refreshUser();
      }
      if (res.verification_code) {
        setMsg('验证码已显示在下方：' + res.verification_code);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold">加入 TopDate</h1>
          <p className="text-gray-400 mt-1">仅限985高校在校学生</p>
        </div>

        <div className="card space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>}
          {msg && <div className="bg-blue-50 text-blue-600 text-sm px-4 py-3 rounded-2xl">{msg}</div>}

          {/* 大学选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">选择你的大学</label>
            <select
              className="input-field"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
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
                请使用 {selectedUni.email_domains?.map(d => `@${d}`).join(' 或 ')} 邮箱
              </p>
            )}
          </div>

          {/* 邮箱 + 发送验证码 一行 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">学校邮箱</label>
            <div className="flex gap-2">
              <input
                type="email"
                className="input-field flex-1"
                placeholder={selectedUni ? `yourname@${selectedUni.email_domains?.[0] || 'edu.cn'}` : 'yourname@edu.cn'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0 || !email || !universityId}
                className="shrink-0 px-4 py-3 bg-primary-500 text-white font-medium rounded-2xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                {sendingCode ? '发送中' : countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>

          {/* 验证码 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">验证码</label>
            <input
              type="text"
              className="input-field tracking-widest text-center text-lg font-bold"
              placeholder="6位数字"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              inputMode="numeric"
            />
          </div>

          {/* 昵称 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">昵称</label>
            <input
              type="text"
              className="input-field"
              placeholder="你的专属昵称"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">院系</label>
            <input
              type="text"
              className="input-field"
              placeholder="如：计算机科学与技术学院"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
            <input
              type="password"
              className="input-field"
              placeholder="至少6位密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>

          {/* 注册按钮 */}
          <button
            onClick={handleRegister}
            className="btn-primary w-full"
            disabled={registering || !code || !nickname || !password}
          >
            {registering ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-gray-400">
            已有账号？<Link to="/login" className="text-primary-500 font-medium">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
