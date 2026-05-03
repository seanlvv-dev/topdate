import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">隐私协议</h1>

      <div className="card space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          我们承诺严格保护您的隐私，所有问卷数据仅用于匹配算法计算，
          <strong>绝不向任何第三方泄露</strong>。
        </p>

        <h3 className="font-bold text-gray-800 mt-6">数据使用</h3>
        <p>
          你填写的问卷答案将被系统用于计算与其他用户的匹配度分数。匹配结果仅对相关用户展示
          （昵称、学校、匹配度分数等基本画像信息），不会展示具体的问卷答案。
        </p>

        <h3 className="font-bold text-gray-800 mt-6">联系方式保护</h3>
        <p>
          你的大学邮箱地址仅在<strong>双方互相确认喜欢</strong>之后才会交换。在任何一方未确认之前，
          对方无法看到你的邮箱地址。平台仅提供基于算法的匹配建议，不保证匹配结果的绝对完美。
        </p>

        <h3 className="font-bold text-gray-800 mt-6">安全提醒</h3>
        <p>
          请各位同学在后续的线上交流与线下见面中，保持真诚与礼貌，同时注意保护个人隐私与人身财产安全。
          如遇骚扰或违规行为，请及时通过反馈通道向我们举报。
        </p>

        <h3 className="font-bold text-gray-800 mt-6">数据安全</h3>
        <p>
          平台采用加密传输，所有敏感数据均以安全方式存储。你可以随时在个人资料页自行删除账号，
          删除后所有相关数据将被永久清除。
        </p>
      </div>

      <div className="text-center mt-8">
        <Link to="/" className="text-sm text-primary-500 hover:text-primary-600">← 返回首页</Link>
      </div>
    </div>
  );
}
