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
    <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 mb-3">
      {[{ num: d, label: '天' }, { num: h, label: '时' }, { num: m, label: '分' }, { num: s, label: '秒' }].map((item) => (
        <div key={item.label} className="text-center">
          <div className="w-16 h-20 sm:w-18 sm:h-22 bg-white/95 rounded-2xl flex items-center justify-center shadow-lg border border-white/50">
            <span className="text-2xl sm:text-3xl font-black tabular-nums text-gray-800">{String(item.num).padStart(2, '0')}</span>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-amber-400">
        {/* 装饰层 */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
        <div className="absolute top-10 left-[10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[5%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-[30%] right-[20%] w-4 h-4 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-[60%] left-[25%] w-3 h-3 bg-white/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        {/* 底部波浪 */}
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none" className="w-full h-8 sm:h-12">
            <path d="M0 30 Q180 0 360 30 T720 30 T1080 30 T1440 30 L1440 60 L0 60 Z" fill="#fafafa" />
          </svg>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/10">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
              Join {stats?.total_users?.toLocaleString() || '0'} students
            </div>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
              在<span className="text-white"> 985 </span>校园里
              <br />找到与你<span className="text-white">同频</span>的人
            </h1>
            <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed mb-8">
              只需填写一份深度问卷，每周三和周六晚六点，
              <br />你将收到匹配结果，并附上我们认为你们会合拍的理由。
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link to="/matches" className="px-8 py-3 bg-white text-rose-500 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                  查看本周匹配
                </Link>
              ) : (
                <Link to="/register" className="px-8 py-3 bg-white text-rose-500 font-semibold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                  立即加入
                </Link>
              )}
            </div>

            <div className="mt-12">
              <p className="text-white/40 text-xs tracking-[0.3em] mb-4">距下次配对揭晓</p>
              <HeroCountdown />
              <p className="text-white/40 text-xs mt-3">{dateStr} · {timeStr}</p>
            </div>

            {/* 高校排行 (hero内) */}
            {stats?.top_universities?.length > 0 && (
              <div className="mt-10 max-w-lg mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                  <h3 className="text-white/60 text-xs font-medium mb-3">🏫 注册人数最多的高校</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {stats.top_universities.slice(0, 6).map((uni, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/80">
                        <span className="w-5 h-5 bg-white/15 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                        <span className="truncate">{uni.university_name}</span>
                        <span className="ml-auto text-white/50">{uni.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== How It Works ====== */}
      <section className="py-20 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">How It Works</span>
            <h2 className="text-2xl font-bold mt-2 text-gray-800">三步，开启你的故事</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { step: '01', title: '填写一份深度问卷', desc: '45 道题，涵盖价值观、情感风格和生活方式。从华北到华南，从华东到西北，认真回答，让算法找到最契合你的人。', icon: '📋', color: 'from-rose-100 to-rose-50' },
              { step: '02', title: '每周两次，打开信封', desc: '周三和周六晚六点，收到对方的昵称、匹配度，以及每个维度的契合分析。一周两次，没有「左滑右滑」。', icon: '💌', color: 'from-amber-100 to-amber-50' },
              { step: '03', title: '双向确认后，见见TA吧', desc: '互相喜欢后交换联系方式。剩下的交给你们：或许在校园散步，或许一起去图书馆。', icon: '💕', color: 'from-rose-100 to-amber-50' },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className={`absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl -z-10 rotate-6 group-hover:rotate-12 transition-transform`} />
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-4">{item.icon}</div>
                  <div className="text-3xl font-black text-gray-900/5 mb-2">{item.step}</div>
                  <h3 className="font-bold text-gray-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Why TopDate ====== */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-rose-400 tracking-widest uppercase">Why TopDate</span>
            <h2 className="text-2xl font-bold mt-2 text-gray-800">为什么选择我们</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[
              { icon: '🎯', title: '每周两次', desc: '周三和周六晚六点统一揭晓。用心等待，而非无尽刷屏。' },
              { icon: '💡', title: '精准匹配', desc: '基于价值观、情感风格与生活方式的契合度算法，不只看相似，也捕捉互补。' },
              { icon: '🔒', title: '隐私优先', desc: '不是公开社交平台。你只能看到与自己有关的匹配信息。' },
              { icon: '🎓', title: '覆盖39校', desc: '仅支持 985 高校 .edu.cn 邮箱注册，守护校园的那份真实。' },
            ].map((item) => (
              <div key={item.title} className="group">
                <div className="bg-[#fafafa] rounded-2xl p-5 border border-gray-100 group-hover:border-rose-100 group-hover:shadow-sm transition-all">
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1.5">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Stats ====== */}
      <section className="py-16 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-xl font-bold text-gray-800 mb-8">平台数据一览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: '已注册', value: stats?.total_users?.toLocaleString() || '0', icon: '👥' },
              { label: '成功匹配', value: stats?.total_match_pairs?.toLocaleString() || '0', icon: '💕' },
              { label: '匹配率', value: (stats?.match_success_rate || 0) + '%', icon: '📊' },
              { label: '本周活跃', value: stats?.active_users_this_week?.toLocaleString() || '0', icon: '🔥' },
              { label: '覆盖高校', value: stats?.total_universities || 39, icon: '🏫' },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xl font-black gradient-text">{item.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Final CTA ====== */}
      <section className="py-20 bg-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ background: 'radial-gradient(circle at 30% 50%, #f43f5e 0%, transparent 40%), radial-gradient(circle at 70% 50%, #f59e0b 0%, transparent 40%)' }} />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">准备好了吗？</h2>
          <p className="text-gray-400 mb-8 text-sm">每周两次，为你揭晓最契合的 TA。</p>
          {user ? (
            <Link to="/matches" className="inline-block px-10 py-3.5 bg-gradient-to-r from-rose-400 to-amber-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              查看本周匹配
            </Link>
          ) : (
            <Link to="/register" className="inline-block px-10 py-3.5 bg-gradient-to-r from-rose-400 to-amber-400 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              加入 TopDate
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
