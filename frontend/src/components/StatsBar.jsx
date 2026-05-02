export default function StatsBar({ stats, compact = false }) {
  if (!stats) return null;

  const items = [
    { label: '已注册', value: stats.total_users?.toLocaleString() || '0', icon: '👥' },
    { label: '成功匹配', value: stats.total_match_pairs?.toLocaleString() || '0', icon: '💕' },
    { label: '匹配率', value: (stats.match_success_rate || 0) + '%', icon: '📊' },
    { label: '本周活跃', value: stats.active_users_this_week?.toLocaleString() || '0', icon: '🔥' },
    { label: '覆盖高校', value: stats.total_universities || 39, icon: '🏫' },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 ${compact ? 'gap-2' : ''}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-gray-100"
        >
          <div className="text-2xl mb-1">{item.icon}</div>
          <div className="text-xl font-bold gradient-text">{item.value}</div>
          <div className="text-xs text-gray-400">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
