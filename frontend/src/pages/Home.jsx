import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useData';

function getNextMatchTime() {
  const now = new Date();
  const targets = [];
  const wed = new Date(now);
  let d = (3 - now.getDay() + 7) % 7;
  if (d === 0 && now.getHours() >= 18) d = 7;
  wed.setDate(now.getDate() + d); wed.setHours(18, 0, 0, 0);
  targets.push(wed);
  const sat = new Date(now);
  d = (6 - now.getDay() + 7) % 7;
  if (d === 0 && now.getHours() >= 18) d = 7;
  sat.setDate(now.getDate() + d); sat.setHours(18, 0, 0, 0);
  targets.push(sat);
  return targets.sort((a, b) => a - b)[0];
}

function HeroCountdown() {
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

  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5 mt-4 mb-3">
      {[
        { num: d, label: '天' },
        { num: h, label: '时' },
        { num: m, label: '分' },
        { num: s, label: '秒' },
      ].map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-3xl sm:text-4xl font-black tabular-nums bg-white/80 rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
            {String(item.num).padStart(2, '0')}
          </div>
          <div className="text-xs text-white/70 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { stats } = useStats();
  const matchDate = getNextMatchTime();
  const dateStr = matchDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const timeStr = matchDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500">
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ background: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <div className="animate-slide-up">
            <p className="text-sm text-white/80 mb-6 tracking-wide">
              Join {stats?.total_users?.toLocaleString() || '0'} students
            </p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4">
              在<span className="text-white/90">985</span>校园里
              <br />找到与你<span className="text-white/90">同频</span>的人
            </h1>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed mb-8">
              只需填写一份深度问卷，每周三和周六晚六点，
              <br />你将收到匹配结果，并附上我们认为你们会合拍的理由。
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link to="/matches" className="px-8 py-3 bg-white text-primary-500 font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  查看本周匹配
                </Link>
              ) : (
                <Link to="/register" className="px-8 py-3 bg-white text-primary-500 font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  立即加入
                </Link>
              )}
            </div>

            <div className="mt-10">
              <p className="text-white/50 text-xs tracking-widest mb-3">距下次配对揭晓</p>
              <HeroCountdown />
              <p className="text-white/50 text-xs mt-2">{dateStr} · {timeStr}</p>
          </div>
          {/* university ranking in hero */}
          {stats?.top_universities?.length > 0 && (
            <div className="mt-8 bg-white/10 backdrop-blur rounded-3xl p-6">
              <h3 className="font-bold text-white mb-4">🏫 注册人数最多的高校</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stats.top_universities.slice(0, 10).map((uni, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <span className="truncate">{uni.university_name}</span>
                    <span className="ml-auto text-xs text-white/60">{uni.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-2">How It Works</h2>
          <p className="text-center text-gray-400 text-sm mb-12">三步，开启你的故事</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: '填写一份深度问卷',
                desc: '45 道题，涵盖价值观、情感风格和生活方式。从华北到华南，从华东到西北，认真回答，让算法找到最契合你的人。',
                icon: '📋',
              },
              {
                step: '02',
                title: '每周两次，打开信封',
                desc: '周三和周六晚六点，收到对方的昵称、匹配度，以及每个维度的契合分析。一周两次，没有「左滑右滑」。',
                icon: '💌',
              },
              {
                step: '03',
                title: '双向确认后，见见TA吧',
                desc: '互相喜欢后交换联系方式。剩下的交给你们：或许在校园散步，或许一起去图书馆。',
                icon: '💕',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <div className="text-xs font-bold text-primary-500 mb-2">{item.step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Why TopDate ====== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-2">Why TopDate</h2>
          <p className="text-center text-gray-400 text-sm mb-12">为什么选择我们</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { icon: '🎯', title: '每周两次', desc: '周三和周六晚六点统一揭晓。用心等待，而非无尽刷屏。' },
              { icon: '💡', title: '精准匹配', desc: '基于价值观、情感风格与生活方式的契合度算法，不只看相似，也捕捉互补。' },
              { icon: '🔒', title: '隐私优先', desc: '不是公开社交平台。你只能看到与自己有关的匹配信息。' },
              { icon: '🎓', title: '覆盖39校', desc: '仅支持 985 高校 .edu.cn 邮箱注册，守护校园的那份真实。' },
            ].map((item) => (
              <div key={item.title} className="card text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Stats ====== */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-8">平台数据一览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: '已注册', value: stats?.total_users?.toLocaleString() || '0', icon: '👥' },
              { label: '成功匹配', value: stats?.total_match_pairs?.toLocaleString() || '0', icon: '💕' },
              { label: '匹配率', value: (stats?.match_success_rate || 0) + '%', icon: '📊' },
              { label: '本周活跃', value: stats?.active_users_this_week?.toLocaleString() || '0', icon: '🔥' },
              { label: '覆盖高校', value: stats?.total_universities || 39, icon: '🏫' },
            ].map((item) => (
              <div key={item.label} className="card text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xl font-bold gradient-text">{item.value}</div>
                <div className="text-xs text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Final CTA ====== */}
      <section className="py-16 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">准备好了吗？</h2>
          <p className="text-white/70 mb-8 text-sm">
            每周两次，为你揭晓最契合的 TA。
          </p>
          {user ? (
            <Link to="/matches" className="inline-block px-8 py-3 bg-white text-primary-500 font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all">
              查看本周匹配
            </Link>
          ) : (
            <Link to="/register" className="inline-block px-8 py-3 bg-white text-primary-500 font-medium rounded-2xl shadow-lg hover:shadow-xl transition-all">
              加入 TopDate
            </Link>
          )}
        </div>
      </section>

    </div>
  );
}
