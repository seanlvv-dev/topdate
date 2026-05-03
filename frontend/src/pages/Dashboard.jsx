import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useData';
import api from '../utils/api';

function getNextMatchTime() {
  const now = new Date();
  const target = new Date(now);
  // 3 = Wednesday (0=Sun)
  let daysUntil = (3 - now.getDay() + 7) % 7;
  if (daysUntil === 0 && now.getHours() >= 18) daysUntil = 7;
  target.setDate(now.getDate() + daysUntil);
  target.setHours(18, 0, 0, 0);
  return target;
}

function Countdown({ target }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      {[
        { num: d, label: '天' },
        { num: h, label: '时' },
        { num: m, label: '分' },
        { num: s, label: '秒' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl sm:text-4xl font-black tabular-nums bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
            {String(item.num).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-400 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ scrollTo }) {
  const { user, loading: authLoading } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [matchCount, setMatchCount] = useState(null);
  const [matches, setMatches] = useState([]);
  const nextMatch = getNextMatchTime();

  useEffect(() => {
    if (scrollTo === 'stats' && statsRef.current) {
      statsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scrollTo]);

  useEffect(() => {
    if (!user) return;
    api.get('/matches')
      .then((res) => {
        setMatches(res.data);
        setMatchCount(res.data.length);
      })
      .catch(() => {});
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const hasSurvey = user?.survey_completed;
  const myMatches = matches.filter(
    (m) => m.status !== 'rejected' && m.status !== 'expired'
  );
  const pendingMatches = myMatches.filter((m) => m.status === 'pending');
  const likedMatches = myMatches.filter((m) => m.status === 'liked' || m.status === 'matched');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* ── 欢迎 ── */}
      <section className="text-center animate-fade-in">
        <h1 className="text-3xl font-bold">
          你好，<span className="gradient-text">{user?.nickname}</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">这是你的专属空间。等待属于你的那封信。</p>
      </section>

      {/* ── 倒计时 ── */}
      <section className="card text-center py-8 animate-slide-up">
        <p className="text-sm text-gray-400 mb-4 tracking-wide">距下次配对揭晓</p>
        <Countdown target={nextMatch} />
        <p className="text-xs text-gray-400 mt-4">
          每周三 18:00 准时揭晓，锁定{nextMatch.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
        </p>
      </section>

      {/* ── 三卡片 ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 问卷状态 */}
        <button
          onClick={() => navigate('/survey')}
          className="card text-center group hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="text-3xl mb-2">{hasSurvey ? '📝' : '✏️'}</div>
          <h3 className="font-bold text-gray-800 group-hover:text-primary-500 transition-colors">
            {hasSurvey ? '修改问卷' : '填写问卷'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {hasSurvey ? '点击修改你的匹配偏好' : '完成5部分趣味问卷'}
          </p>
          {hasSurvey && (
            <div className="mt-2 w-fit mx-auto px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">
              已完成
            </div>
          )}
        </button>

        {/* 本期配对 */}
        <button
          onClick={() => navigate('/matches')}
          className="card text-center group hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="text-3xl mb-2">💌</div>
          <h3 className="font-bold text-gray-800 group-hover:text-primary-500 transition-colors">
            本期配对
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {(pendingMatches.length + likedMatches.length) > 0
              ? `${pendingMatches.length} 个待查看，${likedMatches.length} 个已互动`
              : '配对结果将在周三揭晓'}
          </p>
          {(pendingMatches.length + likedMatches.length) > 0 && (
            <div className="mt-2 w-fit mx-auto px-2 py-0.5 bg-primary-50 text-primary-600 text-xs rounded-full font-medium">
              共 {myMatches.length} 个
            </div>
          )}
        </button>

        {/* 线上活动 */}
        <div className="card text-center opacity-60 cursor-default">
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-bold text-gray-800">线上活动</h3>
          <p className="text-xs text-gray-400 mt-1">敬请期待</p>
        </div>
      </section>

      {/* ── 新用户引导 ── */}
      {!hasSurvey && (
        <section className="card border-primary-200 bg-gradient-to-br from-primary-50 to-white animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="text-3xl shrink-0">🎓</div>
            <div>
              <h3 className="font-bold text-gray-800">先完成你的第一份问卷</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                首次完整提交后，你才能参与正式匹配。提交完成后，右上角和功能区里的"修改问卷"也会开放。
              </p>
              <Link to="/survey" className="btn-primary inline-block mt-4 !py-2 !px-6 text-sm">
                开始填写问卷
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 配对历史 ── */}
      {hasSurvey && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-800">配对历史</h2>
          {likedMatches.length > 0 ? (
            <div className="space-y-3">
              {likedMatches.slice(0, 5).map((m) => (
                <div key={m.match_id} className="card flex items-center justify-between animate-fade-in">
                  <div>
                    <span className="font-medium">{m.user?.nickname}</span>
                    <span className="text-xs text-gray-400 ml-2">{m.user?.university_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${m.compatibility_score >= 80 ? 'text-green-500' : 'text-primary-500'}`}>
                      {m.compatibility_score}%
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      m.status === 'matched' ? 'bg-pink-50 text-pink-600' : 'bg-primary-50 text-primary-600'
                    }`}>
                      {m.status === 'matched' ? '已匹配' : '已喜欢'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8 text-gray-400 text-sm">
              暂无配对记录，<Link to="/survey" className="text-primary-500">完善问卷</Link>后等待周三揭晓
            </div>
          )}
          {(likedMatches.length > 5 || myMatches.length > 0) && (
            <div className="text-center">
              <Link to="/matches" className="text-sm text-primary-500 hover:text-primary-600">
                查看全部 →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── 平台数据 ── */}
      <section ref={statsRef} id="stats-section" className="space-y-4 scroll-mt-20">
        <h2 className="text-lg font-bold text-gray-800">平台数据</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <div className="text-2xl font-black gradient-text">
              {stats?.total_users?.toLocaleString() || '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">已注册用户</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-black gradient-text">
              {stats?.total_survey_completed
                ? Math.round((stats.total_survey_completed / Math.max(stats.total_users, 1)) * 100) + '%'
                : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">问卷完成率</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-black gradient-text">
              {stats?.total_match_pairs?.toLocaleString() || '0'}
            </div>
            <div className="text-xs text-gray-400 mt-1">成功配对</div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800">常见问题</h2>
        <div className="space-y-2">
          {[
            { q: '匹配多久进行一次？', a: '每周固定时间统一匹配一次。' },
            { q: '如果我这周没匹配成功怎么办？', a: '你会自动进入下一个匹配周期。' },
            { q: '我的问卷可以修改吗？', a: '可以，重新提交问卷会覆盖当前模板下的答案。' },
          ].map((faq, i) => (
            <details key={i} className="card group cursor-pointer">
              <summary className="font-medium text-gray-700 text-sm list-none flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-gray-300 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}
