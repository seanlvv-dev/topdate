import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">关于我们</h1>

      <div className="card space-y-5 text-sm text-gray-600 leading-relaxed">
        <p>
          <span className="font-bold gradient-text">TopDate</span> 是一个面向 985 高校及合作院校在校学生的专属交友匹配平台。
          我们相信，在相似的学术环境与成长背景中，更容易找到灵魂契合的人。
        </p>
        <p>
          平台基于<strong>心理学研究中的相似性吸引理论、最佳差异化理论</strong>，并结合
          地理位置优先策略，构建了一套多维度的加权匹配算法。你只需完成一份精心设计的问卷，
          系统就会在每个匹配周期为你推荐最契合的潜在同伴。
        </p>
        <p>
          隐私与真诚是 TopDate 的核心原则——邮箱地址仅在双向确认匹配后才会交换，
          所有问卷数据仅用于匹配计算，绝不会向第三方泄露。
        </p>
          <p>
            TopDate 是一个<strong>纯公益项目</strong>，不向用户收取任何费用，
            不投放商业广告，不进行任何形式的商业变现。
            我们仅通过算法为高校学生提供匹配建议，所有服务永久免费。
          </p>
          <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-xs text-gray-400">
            TopDate 不隶属于任何大学。平台仅供在校学生自愿使用。
          </p>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/" className="text-sm text-primary-500 hover:text-primary-600">← 返回首页</Link>
      </div>
    </div>
  );
}
