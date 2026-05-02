import { useState, useEffect } from 'react';
import api from '../utils/api';
import StatsBar from '../components/StatsBar';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [detailStats, setDetailStats] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'logs') fetchLogs();
    if (tab === 'stats') fetchDetailStats();
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search, status: statusFilter } });
      setUsers(res.data);
    } catch {}
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/logs');
      setLogs(res.data);
    } catch {}
    setLoading(false);
  };

  const fetchDetailStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats/detail');
      setDetailStats(res.data);
    } catch {}
    setLoading(false);
  };

  const handleAction = async (userId, action) => {
    try {
      await api.post('/admin/users/action', {
        action,
        target_user_id: userId,
        reason: '',
      });
      setMessage(`用户 #${userId} ${action} 操作成功`);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.detail || '操作失败');
    }
  };

  const statusLabels = {
    pending: '待验证',
    verified: '已验证',
    active: '活跃',
    suspended: '已冻结',
    inactive: '不活跃',
  };
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    verified: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-500',
  };

  const tabs = [
    { id: 'users', label: '用户管理', icon: '👥' },
    { id: 'stats', label: '详细统计', icon: '📊' },
    { id: 'logs', label: '操作日志', icon: '📝' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">管理员面板</h1>

      {message && (
        <div className="mb-6 px-4 py-3 rounded-2xl text-sm bg-primary-50 text-primary-600">{message}</div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div>
          <div className="flex gap-3 mb-6">
            <input
              className="input-field flex-1"
              placeholder="搜索用户（昵称/邮箱）"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
            <select
              className="input-field w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="pending">待验证</option>
              <option value="verified">已验证</option>
              <option value="active">活跃</option>
              <option value="suspended">已冻结</option>
            </select>
            <button onClick={fetchUsers} className="btn-primary !py-2 !px-4">搜索</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" /></div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="card flex items-center justify-between flex-wrap gap-3 animate-fade-in">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{u.nickname || '未设置'}</div>
                    <div className="text-sm text-gray-400 truncate">{u.email}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[u.verification_status] || ''}`}>
                        {statusLabels[u.verification_status] || u.verification_status}
                      </span>
                      <span className="text-xs text-gray-400">{u.university_name}</span>
                      {u.survey_completed && <span className="text-xs text-green-500">✓ 已问卷</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {u.verification_status !== 'suspended' ? (
                      <button
                        onClick={() => handleAction(u.id, 'suspend')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        冻结
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(u.id, 'unsuspend')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      >
                        解冻
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && <p className="text-center text-gray-400 py-12">暂无用户数据</p>}
            </div>
          )}
        </div>
      )}

      {/* Stats tab */}
      {tab === 'stats' && detailStats && (
        <div className="space-y-6">
          <StatsBar stats={detailStats.overview} />

          <div className="card">
            <h3 className="font-bold text-gray-700 mb-4">性别比例</h3>
            {detailStats.gender_ratio ? (
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-blue-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{detailStats.gender_ratio.male}</div>
                  <div className="text-sm text-gray-400">男生</div>
                </div>
                <div className="text-gray-300 text-xl">:</div>
                <div className="flex-1 bg-pink-50 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-pink-500">{detailStats.gender_ratio.female}</div>
                  <div className="text-sm text-gray-400">女生</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">暂无数据</p>
            )}
          </div>

          {/* Top Universities */}
          {detailStats.overview?.top_universities?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-700 mb-4">高校注册排行 Top 10</h3>
              <div className="space-y-2">
                {detailStats.overview.top_universities.map((uni, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <span className="flex-1 text-gray-600">{uni.university_name}</span>
                    <span className="text-xs text-gray-400">{uni.province}</span>
                    <span className="font-bold text-primary-500">{uni.count}人</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" /></div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 text-sm py-3 px-4 bg-white rounded-xl border border-gray-100">
                  <span className="font-medium text-gray-700 min-w-[80px]">{log.action}</span>
                  <span className="text-gray-400">用户 #{log.target_user_id}</span>
                  {log.detail && <span className="text-gray-400 truncate">{log.detail}</span>}
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-center text-gray-400 py-12">暂无操作日志</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
