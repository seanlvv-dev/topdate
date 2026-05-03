import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <p className="font-bold gradient-text text-lg mb-2">TopDate</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          在 985 校园里，遇见对的人。
        </p>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          <Link to="/about" className="hover:text-gray-600 transition-colors">关于我们</Link>
          <Link to="/privacy" className="hover:text-gray-600 transition-colors">隐私协议</Link>
          <Link to="/contact" className="hover:text-gray-600 transition-colors">联系我们</Link>
        </div>
        <p className="text-xs text-gray-300 mt-4">© 2026 TopDate</p>
      </div>
    </footer>
  );
}
