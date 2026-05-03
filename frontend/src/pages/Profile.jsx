import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', bio: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    api.get('/profile').then((res) => {
      setProfile(res.data);
      setForm({ nickname: res.data.nickname || '', bio: res.data.bio || '' });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/profile', form);
      await refreshUser();
      setMessage('资料更新成功');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.post('/account/delete', { password: deletePassword });
      window.location.href = '/';
    } catch (err) {
      setMessage(err.response?.data?.detail || '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd.length < 6) { setMessage('新密码至少6位'); return; }
    setChangingPwd(true);
    try {
      await api.post('/auth/change-password', { current_password: currentPwd, new_password: newPwd });
      setMessage('密码修改成功');
      setShowChangePwd(false);
      setCurrentPwd(''); setNewPwd('');
    } catch (err) {
      setMessage(err.response?.data?.detail || '修改失败');
    } finally {
      setChangingPwd(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const statusLabels = {
    pending: '待验证',
    verified: '已验证',
    active: '已激活',
    suspended: '已冻结',
  };
  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-50',
    verified: 'text-blue-600 bg-blue-50',
    active: 'text-green-600 bg-green-50',
    suspended: 'text-red-600 bg-red-50',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">个人资料</h1>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-2xl text-sm ${message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      <div className="card space-y-6">
        {/* Basic info */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
            👤
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{profile.nickname}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[profile.verification_status] || ''}`}>
                {statusLabels[profile.verification_status] || profile.verification_status}
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-0.5">{profile.email}</p>
            <p className="text-gray-400 text-sm">
              {profile.university_name} · {profile.city}, {profile.province}
            </p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">自我介绍</h3>
          {editing ? (
            <textarea
              className="input-field h-24 resize-none"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="介绍一下自己..."
            />
          ) : (
            <p className="text-gray-700">{profile.bio || '尚未填写自我介绍'}</p>
          )}
        </div>

        {/* Nickname */}
        {editing && (
          <div>
            <label className="text-sm font-medium text-gray-500 mb-2 block">昵称</label>
            <input
              className="input-field"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
          </div>
        )}


        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-outline flex-1">取消</button>
              <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-outline flex-1">编辑资料</button>
          )}
        </div>
      </div>

      {/* Change Password */}
      <div className="card mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">🔑 修改密码</h3>
        {!showChangePwd ? (
          <button
            onClick={() => setShowChangePwd(true)}
            className="text-sm px-4 py-2 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            修改密码
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="password" className="input-field"
              placeholder="当前密码" value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
            />
            <input
              type="password" className="input-field"
              placeholder="新密码（至少6位）" value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowChangePwd(false); setCurrentPwd(''); setNewPwd(''); }}
                className="btn-outline flex-1 !py-2">取消</button>
              <button onClick={handleChangePassword}
                className="btn-primary flex-1 !py-2" disabled={changingPwd || !currentPwd || !newPwd}>
                {changingPwd ? '修改中...' : '确认修改'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="card mt-6 border-red-100">
        <h3 className="text-sm font-medium text-red-500 mb-3">⚠️ 危险操作</h3>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm px-4 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            删除我的账号
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">此操作不可撤销！请输入密码确认删除。</p>
            <input
              type="password"
              className="input-field"
              placeholder="输入密码确认"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                className="btn-outline flex-1 !py-2"
              >
                取消
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2 rounded-2xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all text-sm"
                disabled={deleting || !deletePassword}
              >
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
