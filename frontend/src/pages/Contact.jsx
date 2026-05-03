import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">联系我们</h1>

      <div className="card space-y-5 text-sm text-gray-600 leading-relaxed">
        <p>
          如果你有建议、反馈或合作想法，欢迎随时来信联系我们。
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-primary-100 text-primary-500 rounded-full flex items-center justify-center text-sm shrink-0">✉</span>
            <div>
              <p className="text-xs text-gray-400">邮箱</p>
              <a href="mailto:TopDate@163.com" className="text-primary-500 hover:text-primary-600 font-medium">
                TopDate@163.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-sm shrink-0">💬</span>
            <div>
              <p className="text-xs text-gray-400">微信</p>
              <p className="text-gray-700 font-medium">lvjiaxuan325</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          我们会在 1-3 个工作日内回复你的来信。如遇紧急问题（如骚扰举报），请在邮件标题注明「紧急」。
        </p>
      </div>

      <div className="text-center mt-8">
        <Link to="/" className="text-sm text-primary-500 hover:text-primary-600">← 返回首页</Link>
      </div>
    </div>
  );
}
