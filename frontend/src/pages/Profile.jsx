import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: '', bio: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/profile/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const res = await api.get('/profile');
      setProfile(res.data);
      setMessage('照片上传成功');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async (url) => {
    try {
      await api.delete('/profile/photo', { params: { url } });
      const res = await api.get('/profile');
      setProfile(res.data);
      setMessage('照片已删除');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || '删除失败');
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

        {/* Photos */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">照片 ({profile.photos?.length || 0}/3)</h3>
          <div className="flex gap-3 flex-wrap">
            {profile.photos?.map((url, i) => (
              <div key={i} className="relative group">
                <div className="w-24 h-24 bg-gray-100 rounded-2xl overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => handlePhotoDelete(url)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            {(!profile.photos || profile.photos.length < 3) && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl text-gray-300 border-2 border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-400 transition-colors cursor-pointer"
              >
                {uploading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-primary-300 border-t-primary-600 rounded-full" />
                ) : '+'}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WebP 格式，单张最大 5MB</p>
        </div>

        {/* Answers summary */}
        {profile.survey_answers && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">问卷概览</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400">性别：</span>
                <span>{profile.survey_answers.gender === 'male' ? '男' : '女'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400">年龄：</span>
                <span>{profile.survey_answers.age || '-'}岁</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400">家乡：</span>
                <span>{profile.survey_answers.home_province || '-'}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400">匹配范围：</span>
                <span>{{
                  same_city: '仅同城',
                  same_province: '同省',
                  neighboring: '邻省',
                  anywhere: '不限',
                }[profile.survey_answers.max_distance_preference] || '-'}</span>
              </div>
            </div>
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
