import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMatches } from '../hooks/useData';

function MatchCard({ match, onAction }) {
  const [acting, setActing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAction = async (action) => {
    if (acting) return;
    setActing(true);
    try {
      const res = await onAction(match.match_id, action);
      setResult(res);
    } catch {
    } finally {
      setActing(false);
    }
  };

  if (result?.status === 'matched') {
    return (
      <div className="card text-center border-primary-200 bg-primary-50 animate-fade-in">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold text-primary-600 mb-2">匹配成功！</h3>
        <p className="text-sm text-gray-600 mb-1">你们互相喜欢了对方！</p>
        <p className="text-sm font-medium text-primary-500">
          对方的学校邮箱：{result.contact?.email}
        </p>
        <p className="text-xs text-gray-400 mt-2">昵称：{result.contact?.nickname}</p>
      </div>
    );
  }

  if (result?.status === 'liked' || result?.status === 'rejected') {
    return (
      <div className="card text-center opacity-60">
        <div className="text-2xl mb-2">{result.status === 'liked' ? '👍' : '👋'}</div>
        <p className="text-sm text-gray-500">{result.message}</p>
      </div>
    );
  }

  if (match.status === 'rejected' || match.status === 'expired') return null;

  const u = match.user;
  const scoreColor =
    match.compatibility_score >= 80 ? 'text-green-500' :
    match.compatibility_score >= 60 ? 'text-primary-500' :
    match.compatibility_score >= 40 ? 'text-yellow-500' : 'text-gray-400';

  return (
    <div className="card space-y-4 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">{u.nickname}</h3>
          <p className="text-sm text-gray-400">{u.university_name}</p>
          <p className="text-xs text-gray-400">{u.city} · {u.province}</p>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${scoreColor}`}>{match.compatibility_score}%</div>
          <div className="text-xs text-gray-400">匹配度</div>
        </div>
      </div>

      {/* Detail scores */}
      {match.detail_scores && Object.keys(match.detail_scores).length > 0 && (
        <div className="grid grid-cols-5 gap-1 text-center">
          {Object.entries({
            first_impression: '第一印象',
            attraction: '吸引力',
            daily_life: '日常',
            connection: '情感',
            future: '未来',
          }).map(([key, label]) => (
            <div key={key} className="text-xs">
              <div className="text-gray-400 mb-0.5">{label}</div>
              <div className={`font-bold ${(match.detail_scores?.[key] || 0) >= 70 ? 'text-primary-500' : 'text-gray-500'}`}>
                {match.detail_scores?.[key] || 0}%
              </div>
            </div>
          ))}
        </div>
      )}

      {match.city_bonus > 0 && (
        <div className="text-xs text-accent-600 flex items-center gap-1">
          📍 地理位置加分 +{match.city_bonus}
        </div>
      )}

      {match.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('reject')}
            className="flex-1 py-2.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-all text-sm"
            disabled={acting}
          >
            ✕ 跳过
          </button>
          <button
            onClick={() => handleAction('like')}
            className="flex-1 py-2.5 rounded-2xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-all text-sm"
            disabled={acting}
          >
            ♥ 喜欢
          </button>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const { matches, loading, doAction } = useMatches();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">我的匹配</h1>
        <p className="text-gray-400 mt-1">周三 / 周六 18:00 更新匹配结果，记得来看哦</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" />
        </div>
      ) : matches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="font-bold text-lg mb-2">暂无匹配</h3>
          <p className="text-gray-400 text-sm">
            这可能是因为还没有到匹配时间，或者本周适合你的人还不多。<br />
            我们会不断优化算法，下次匹配日再见！
          </p>
          <Link to="/profile" className="btn-outline inline-block mt-6">完善个人资料</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.match_id} match={match} onAction={doAction} />
          ))}
        </div>
      )}
    </div>
  );
}
