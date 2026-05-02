import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useData';
import StatsBar from '../components/StatsBar';

export default function Home() {
  const { user } = useAuth();
  const { stats } = useStats();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 opacity-60" />
        <div className="absolute top-20 right-[-50px] w-72 h-72 bg-primary-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-[-80px] w-96 h-96 bg-accent-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              覆盖全国39所985高校
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
              在<span className="gradient-text">985</span>校园里
              <br />找到与你<span className="gradient-text">同频</span>的人
            </h1>
            <p className="text-gray-500 text-lg mb-8 leading-relaxed">
              基于科学匹配算法，结合你的性格、习惯与价值观，
              <br />为你推荐同城或同省最契合的校园伴侣。
            </p>
            <div className="flex gap-4 justify-center">
              {user ? (
                <Link to="/matches" className="btn-primary text-lg">查看本周匹配</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg">开始注册</Link>
                  <Link to="/login" className="btn-outline text-lg">登录</Link>
                </>
              )}
            </div>
          </div>

          {/* Floating cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="text-3xl mb-2">📧</div>
              <h3 className="font-bold text-gray-800">校园邮箱认证</h3>
              <p className="text-sm text-gray-400 mt-1">仅限985高校edu.cn邮箱注册，确保真实性</p>
            </div>
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="text-3xl mb-2">🔬</div>
              <h3 className="font-bold text-gray-800">科学匹配算法</h3>
              <p className="text-sm text-gray-400 mt-1">基于心理学研究的多维度加权评分系统</p>
            </div>
            <div className="card text-center animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-bold text-gray-800">隐私安全</h3>
              <p className="text-sm text-gray-400 mt-1">双向确认后才交换联系方式，全程保护隐私</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-8">平台数据一览</h2>
          <StatsBar stats={stats} />
          {stats?.top_universities?.length > 0 && (
            <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">🏫 注册人数最多的高校</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stats.top_universities.slice(0, 10).map((uni, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-gray-600 truncate">{uni.university_name}</span>
                    <span className="text-gray-400 ml-auto text-xs">{uni.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-center text-2xl font-bold mb-12">使用流程</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📝', title: '注册账号', desc: '使用你的985高校邮箱注册' },
              { step: '2', icon: '📋', title: '填写问卷', desc: '完成5个部分的趣味问卷' },
              { step: '3', icon: '💫', title: '等待匹配', desc: '每周三18:00生成匹配结果' },
              { step: '4', icon: '💕', title: '双向确认', desc: '互相喜欢即可获得联系方式' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-primary-500 mb-2">步骤 {item.step}</div>
                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Trust */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">为什么选择 TopDate？</h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            我们专注于985高校学生群体，利用科学匹配算法（基于相似性吸引理论、最佳差异化理论等学术研究），
            结合地理位置优先策略，帮助你在同城或同省的校园里找到真正契合的人。
            你的隐私是我们的首要考量——邮箱地址仅在双向匹配确认后才会交换。
          </p>
        </div>
      </section>
    </div>
  );
}
