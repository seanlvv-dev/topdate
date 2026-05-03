import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useData';
import api from '../utils/api';

const POEMS = [
  { text: '窈窕淑女，君子好逑。', from: '《诗经·周南·关雎》' },
  { text: '愿我如星君如月，夜夜流光相皎洁。', from: '范成大《车遥遥篇》' },
  { text: '金风玉露一相逢，便胜却人间无数。', from: '秦观《鹊桥仙》' },
  { text: '身无彩凤双飞翼，心有灵犀一点通。', from: '李商隐《无题》' },
  { text: '愿得一心人，白头不相离。', from: '卓文君《白头吟》' },
  { text: '两情若是久长时，又岂在朝朝暮暮。', from: '秦观《鹊桥仙》' },
];

function getNextMatchTime() {
  const now = new Date();
  const target = new Date(now);
  let daysUntil = (3 - now.getDay() + 7) % 7;
  if (daysUntil === 0 && now.getHours() >= 18) daysUntil = 7;
  target.setDate(now.getDate() + daysUntil);
  target.setHours(18, 0, 0, 0);
  return target;
}

function Countdown() {
  const [now, setNow] = useState(new Date());
  const target = getNextMatchTime();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const dateStr = target.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = target.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {[
          { num: d, label: '天' },
          { num: h, label: '时' },
          { num: m, label: '分' },
          { num: s, label: '秒' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1 sm:gap-2">
            <div className="w-16 h-20 sm:w-20 sm:h-24 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-black tabular-nums">
                {String(item.num).padStart(2, '0')}
              </span>
            </div>
            <span className="text-sm text-gray-400 font-medium pt-2">{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-4">
        {dateStr} · {timeStr}
      </p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
      <span className="w-1 h-4 bg-primary-500 rounded-full" />
      {children}
    </h2>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const statsRef = useRef(null);
  const [matches, setMatches] = useState([]);
  const [poemIdx] = useState(() => Math.floor(Math.random() * POEMS.length));
  const hasSurvey = user?.survey_completed;

  useEffect(() => {
    if (window.location.hash === '#stats' && statsRef.current) {
      statsRef.current.scrollIntoView({ behavior: 'smooth' });
      window.location.hash = '';
    }
  }, []);

  useEffect(() => {
    if (!user || !hasSurvey) return;
    api.get('/matches').then((r) => setMatches(r.data)).catch(() => {});
  }, [user, hasSurvey]);

  if (authLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const activeMatches = matches.filter((m) => m.status !== 'rejected' && m.status !== 'expired');
  const matchedCount = matches.filter((m) => m.status === 'matched').length;
  const likedCount = matches.filter((m) => m.status === 'liked').length;
  const pendingCount = matches.filter((m) => m.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-12">
      {/* ── 欢迎区 ── */}
      <section className="text-center">
        <h1 className="text-2xl font-bold">
          你好，<span className="gradient-text">{user?.nickname}</span> <span className="animate-bounce inline-block">👋</span>
        </h1>
        <p className="text-gray-400 mt-2 text-sm">这是你的专属空间。等待属于你的那封信。</p>
      </section>

      {/* ── 倒计时 ── */}
      <section className="card py-10 space-y-2">
        <p className="text-sm text-gray-400 tracking-wide text-center">距下次配对揭晓</p>
        <Countdown />
      </section>

      {/* ── 三卡片 ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/survey')}
          className="card text-left group hover:border-primary-200 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${hasSurvey ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
              {hasSurvey ? '✓' : '◎'}
            </span>
            <h3 className="font-bold text-gray-800 text-sm">问卷状态</h3>
          </div>
          <p className={`text-xs font-medium ${hasSurvey ? 'text-green-600' : 'text-orange-500'}`}>
            {hasSurvey ? '已完成' : '待完成'}
          </p>
          {!hasSurvey && (
            <p className="text-xs text-gray-400 mt-1">
              点击前往填写问卷
              <span className="ml-1 group-hover:translate-x-1 inline-block transition-transform">›</span>
            </p>
          )}
          {hasSurvey && (
            <p className="text-xs text-gray-400 mt-1 group-hover:text-primary-500 transition-colors">点击修改问卷</p>
          )}
        </button>

        <button
          onClick={() => { if (hasSurvey) navigate('/matches'); }}
          className={`card text-left group transition-all ${hasSurvey ? 'hover:border-primary-200 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-default'}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${activeMatches.length > 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
              {activeMatches.length > 0 ? activeMatches.length : '◎'}
            </span>
            <h3 className="font-bold text-gray-800 text-sm">本期配对</h3>
          </div>
          {hasSurvey ? (
            <>
              <p className="text-xs font-medium text-gray-600">
                {activeMatches.length > 0 ? `${pendingCount} 个待查看` : '暂无新匹配'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {activeMatches.length > 0 ? '周三晚 18:00 已揭晓' : '等待下周三揭晓'}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-400 mt-1">点击后将提示先完成问卷</p>
          )}
        </button>

        <div className="card text-left opacity-60">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-sm">◎</span>
            <h3 className="font-bold text-gray-800 text-sm">线上活动</h3>
          </div>
          <p className="text-xs font-medium text-gray-400">暂无活动</p>
          <p className="text-xs text-gray-300 mt-1">敬请期待</p>
        </div>
      </section>

      {/* ── 首次填写入口 ── */}
      {!hasSurvey && (
        <section className="card border-primary-100 bg-gradient-to-br from-primary-50/60 to-white relative overflow-hidden">
          <div className="absolute right-4 top-4 text-4xl opacity-30">🎓</div>
          <div className="relative z-10">
            <h3 className="font-bold text-gray-800 mb-2">首次填写入口</h3>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              先完成你的第一份问卷。首次完整提交后，你才能参与正式匹配。提交完成后，右上角和功能区里的"修改问卷"也会开放。
            </p>
            <Link to="/survey" className="btn-primary inline-block mt-4 !py-2.5 !px-8 text-sm font-medium">
              立即填写问卷
            </Link>
          </div>
        </section>
      )}

      {/* ── 本周一言 ── */}
      <section className="card py-8 text-center border-primary-50 bg-gradient-to-b from-white to-primary-50/30">
        <div className="text-2xl mb-2">🕊️</div>
        <p className="text-sm text-gray-500 italic leading-relaxed max-w-sm mx-auto">
          「{POEMS[poemIdx].text}」
        </p>
        <p className="text-xs text-gray-300 mt-3">—— {POEMS[poemIdx].from}</p>
      </section>

      {/* ── 功能入口 ── */}
      <section>
        <SectionTitle>功能</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 主动出击 */}
          <div className="card text-center opacity-70">
            <div className="text-2xl mb-3">💘</div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">Shoot Your Shot</h3>
            <p className="text-xs text-primary-500 font-medium mb-2">主动出击</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              努力开发中 ε=( o｀ω′)ノ
            </p>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              向心仪的人发出信号。即使本周没有被算法匹配，也可以让 TA 知道你的心意。
            </p>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs text-gray-300 border border-gray-200">
              敬请期待
            </span>
          </div>

          {/* 推荐给朋友 */}
          <div className="card text-center opacity-70">
            <div className="text-2xl mb-3">🌸</div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">推荐给朋友</h3>
            <p className="text-xs text-primary-500 font-medium mb-2">好友牵线</p>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              努力开发中 ε=( o｀ω′)ノ
            </p>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              为你的朋友匿名推荐。也许缘分从来不只是算法，还有你牵的线。
            </p>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs text-gray-300 border border-gray-200">
              敬请期待
            </span>
          </div>

          {/* 修改问卷 */}
          <button
            onClick={() => { if (hasSurvey) navigate('/survey'); }}
            className={`card text-center transition-all ${hasSurvey ? 'hover:border-primary-200 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-default'}`}
          >
            <div className="text-2xl mb-3">✏️</div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">修改问卷</h3>
            {hasSurvey ? (
              <>
                <p className="text-xs text-primary-500 font-medium mb-2">随时微调</p>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  重新提交问卷将覆盖当前答案。
                </p>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs text-primary-500 border border-primary-200 hover:bg-primary-50 transition-colors">
                  修改 →
                </span>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                  首次完整提交问卷后开放修改功能。
                </p>
                <span className="inline-block px-4 py-1.5 rounded-full text-xs text-gray-300 border border-gray-200">
                  完成首次填写后开放
                </span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ── 配对历史 ── */}
      <section>
        <SectionTitle>配对历史</SectionTitle>
        {hasSurvey ? (
          matches.length > 0 ? (
            <div className="space-y-3">
              {matches.slice(0, 8).map((m) => (
                <div key={m.match_id} className="card flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {m.user?.nickname?.[0] || '?'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.user?.nickname || '匿名'}</p>
                      <p className="text-xs text-gray-400">{m.user?.university_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${m.compatibility_score >= 80 ? 'text-green-500' : 'text-primary-500'}`}>
                      {m.compatibility_score}%
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      m.status === 'matched' ? 'bg-pink-50 text-pink-600'
                      : m.status === 'liked' ? 'bg-primary-50 text-primary-600'
                      : m.status === 'rejected' ? 'bg-gray-50 text-gray-400'
                      : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {{ matched: '已匹配', liked: '已喜欢', rejected: '已跳过', pending: '待确认', expired: '已过期' }[m.status] || m.status}
                    </span>
                  </div>
                </div>
              ))}
              {matches.length > 8 && (
                <div className="text-center">
                  <Link to="/matches" className="text-sm text-primary-500 hover:text-primary-600">查看全部 {matches.length} 条记录 →</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="card py-12 text-center">
              <div className="text-4xl mb-4">🌙</div>
              <p className="text-sm text-gray-500">还没有配对记录</p>
              <p className="text-xs text-gray-300 mt-1">
                {hasSurvey ? '等待下周三配对揭晓' : '完成问卷并参与本期配对，周三晚 18:00 揭晓！'}
              </p>
            </div>
          )
        ) : (
          <div className="card py-12 text-center">
            <div className="text-4xl mb-4">🌙</div>
            <p className="text-sm text-gray-500">还没有配对记录</p>
            <p className="text-xs text-gray-300 mt-1">完成问卷并参与本期配对，周三晚 18:00 揭晓！</p>
          </div>
        )}
      </section>

      {/* ── 平台数据 ── */}
      <section ref={statsRef} id="stats-section">
        <SectionTitle>平台数据</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center py-5">
            <div className="text-xl sm:text-2xl font-black">{stats?.total_users?.toLocaleString() || '—'}</div>
            <div className="text-xs text-gray-400 mt-1">
              已注册用户
              {stats?.total_survey_completed ? (
                <span className="block text-gray-300 mt-0.5">
                  {stats.total_survey_completed} / {stats.total_users}
                </span>
              ) : null}
            </div>
          </div>
          <div className="card text-center py-5">
            <div className="text-xl sm:text-2xl font-black gradient-text">
              {stats?.total_survey_completed
                ? Math.round((stats.total_survey_completed / Math.max(stats.total_users, 1)) * 100 * 10) / 10 + '%'
                : '—'}
            </div>
            <div className="text-xs text-gray-400 mt-1">问卷完成率</div>
          </div>
          <div className="card text-center py-5">
            <div className="text-xl sm:text-2xl font-black gradient-text">
              {stats?.total_match_pairs?.toLocaleString() || '0'}
              <span className="text-xs font-normal text-gray-400 ml-1">对</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">成功配对</div>
          </div>
        </div>
      </section>

      {/* ── 常见问题 ── */}
      <section>
        <SectionTitle>常见问题</SectionTitle>
        <div className="space-y-2">
          {[
            { q: '匹配多久进行一次？', a: '每周固定时间统一匹配一次。' },
            { q: '如果我这周没匹配成功怎么办？', a: '你会自动进入下一个匹配周期。' },
            { q: '我的问卷可以修改吗？', a: '可以，重新提交问卷会覆盖当前模板下的答案。' },
          ].map((faq, i) => (
            <details key={i} className="card group cursor-pointer">
              <summary className="text-sm font-medium text-gray-700 list-none flex items-center justify-between">
                <span>Q. {faq.q}</span>
                <span className="text-gray-300 group-open:rotate-180 transition-transform ml-2">▾</span>
              </summary>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed pl-1">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}
