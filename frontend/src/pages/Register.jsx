import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUniversities } from '../hooks/useData';
import api from '../utils/api';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [universityId, setUniversityId] = useState('');
  const [code, setCode] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { register, refreshUser } = useAuth();
  const { universities } = useUniversities();
  const navigate = useNavigate();

  const selectedUni = universities.find(u => u.id === parseInt(universityId));

  const handleSendCode = async () => {
    setError('');
    if (!email || !universityId) {
      setError('请填写邮箱和选择大学');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-code', {
        email,
        university_id: parseInt(universityId),
      });
      setCodeSent(true);
      if (res.data.verification_code) {
        setReceivedCode(res.data.verification_code);
      }
    } catch (err) {
      setError(err.response?.data?.detail || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setError('');
    if (!nickname || !password) {
      setError('请填写昵称和密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        email,
        university_id: parseInt(universityId),
        password,
        nickname,
        code: code || undefined,
      });
      if (res.verification_code) {
        // 未验证，需要验证
        setReceivedCode(res.verification_code);
        setStep(3);
      } else {
        // 已验证，直接跳转
        await refreshUser();
        navigate('/survey');
      }
    } catch (err) {
      setError(err.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { email, code: code || receivedCode });
      await refreshUser();
      navigate('/survey');
    } catch (err) {
      setError(err.response?.data?.detail || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold">加入 TopDate</h1>
          <p className="text-gray-400 mt-1">
            {step === 1 ? '仅限985高校在校学生' : step === 2 ? '设置账号信息' : '验证邮箱'}
          </p>
        </div>

        {/* 进度指示 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step >= s ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
            }`}>{s}</div>
          ))}
        </div>

        <div className="card animate-slide-up space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl">{error}</div>
          )}

          {/* Step 1: 选大学 + 填邮箱 + 发送验证码 */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">选择你的大学</label>
                <select
                  className="input-field"
                  value={universityId}
                  onChange={(e) => setUniversityId(e.target.value)}
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
                    请使用 {selectedUni.email_domains?.map(d => `@${d}`).join(' 或 ')} 邮箱
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">学校邮箱</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder={selectedUni ? `yourname@${selectedUni.email_domains?.[0] || 'edu.cn'}` : 'yourname@edu.cn'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button onClick={handleSendCode} className="btn-primary w-full" disabled={loading}>
                {loading ? '发送中...' : '发送验证码'}
              </button>

              {codeSent && receivedCode && (
                <button onClick={() => setStep(2)} className="btn-outline w-full">
                  已有验证码，继续注册
                </button>
              )}

              {codeSent && !receivedCode && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">验证码已发送，请查收邮箱</p>
                  <button onClick={() => setStep(2)} className="text-sm text-primary-500 mt-1">
                    我已收到验证码，继续 →
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 2: 填验证码 + 密码 + 昵称 */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">邮箱</label>
                <p className="text-gray-500 text-sm bg-gray-50 px-3 py-2 rounded-xl">{email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">验证码</label>
                <input
                  type="text"
                  className="input-field text-center text-xl tracking-widest font-bold"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  inputMode="numeric"
                />
                {receivedCode && (
                  <p className="text-xs text-primary-500 mt-1">邮件不可用时，验证码：{receivedCode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">昵称</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="你的专属昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="至少6位密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button onClick={handleFinish} className="btn-primary w-full" disabled={loading}>
                {loading ? '注册中...' : '完成注册'}
              </button>
            </>
          )}

          {/* Step 3: 验证（仅当注册时未验证才出现） */}
          {step === 3 && (
            <>
              <div className="text-center">
                <div className="text-3xl mb-2">📧</div>
                <p className="text-gray-500 text-sm">
                  邮件发送暂不可用，验证码已生成
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">验证码</label>
                <input
                  type="text"
                  className="input-field text-center text-xl tracking-widest font-bold"
                  value={code || receivedCode}
                  onChange={(e) => setCode(e.target.value)}
                />
                <p className="text-xs text-primary-500 mt-1">验证码：{receivedCode}</p>
              </div>

              <button onClick={handleFinalVerify} className="btn-primary w-full" disabled={loading}>
                {loading ? '验证中...' : '完成验证 → 填写问卷'}
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-400">
            已有账号？<Link to="/login" className="text-primary-500 font-medium">登录</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
