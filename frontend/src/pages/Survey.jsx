import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getErrorMessage } from '../utils/api';

function SliderQuestion({ question, value, onChange }) {
  const currentVal = value ?? Math.floor((question.min + question.max) / 2);
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{question.label}</label>
      <div className="flex items-center gap-3">
        {question.min_label && <span className="text-xs text-gray-400 w-16 text-right shrink-0">{question.min_label}</span>}
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step || 1}
          value={currentVal}
          onChange={(e) => onChange(question.id, parseInt(e.target.value))}
          className="flex-1"
        />
        {question.max_label && <span className="text-xs text-gray-400 w-16 shrink-0">{question.max_label}</span>}
      </div>
      <div className="text-center text-sm font-bold text-primary-500">{currentVal}</div>
    </div>
  );
}

function RadioQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{question.label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(question.id, opt.value)}
            className={`px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
              value === opt.value
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{question.label}</label>
      <select
        className="input-field"
        value={value || ''}
        onChange={(e) => onChange(question.id, e.target.value)}
      >
        <option value="">请选择</option>
        {question.options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxQuestion({ question, value, onChange }) {
  const selected = value || [];
  const maxSelect = question.max_select || 999;
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(question.id, selected.filter((v) => v !== opt));
    } else if (selected.length < maxSelect) {
      onChange(question.id, [...selected, opt]);
    }
  };
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {question.label}
        <span className="text-gray-400 text-xs ml-1">（最多选{maxSelect}项，已选{selected.length}）</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const optVal = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const isSelected = selected.includes(optVal);
          return (
            <button
              key={optVal}
              type="button"
              onClick={() => toggle(optVal)}
              className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-primary-400 bg-primary-50 text-primary-600'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SECTION_NAMES = {
  first_impression: { title: '第一印象', icon: '👀', desc: '基本信息与第一眼偏好' },
  attraction: { title: '吸引力', icon: '✨', desc: '心动瞬间与个人特质' },
  daily_life: { title: '日常生活', icon: '🌿', desc: '生活习惯与兴趣爱好' },
  connection: { title: '情感连接', icon: '💬', desc: '情感风格与沟通模式' },
  future: { title: '未来愿景', icon: '🚀', desc: '价值观与人生方向' },
};

export default function Survey() {
  const [sections, setSections] = useState([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [distancePref, setDistancePref] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/survey/questions').then((res) => {
      const secs = res.data.sections;
      setSections(secs);
      setQuestionsLoading(false);

      // 为所有 slider 类型设置默认中间值
      const defaults = {};
      secs.forEach((sec) => {
        sec.questions.forEach((q) => {
          if (q.type === 'slider') {
            defaults[q.id] = Math.floor((q.min + q.max) / 2);
          }
        });
      });

      // 加载已有答案（覆盖默认值）
      api.get('/survey/my-answers').then((r) => {
        if (r.data.answers) {
          setAnswers({ ...defaults, ...r.data.answers });
          setDistancePref(r.data.answers.max_distance_preference || '');
        } else {
          setAnswers((prev) => ({ ...defaults, ...prev }));
        }
      }).catch(() => {
        setAnswers((prev) => ({ ...defaults, ...prev }));
      });
    }).catch(() => setQuestionsLoading(false));
  }, []);

  const updateAnswer = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const isSectionComplete = (section) => {
    return section.questions.every((q) => {
      if (q.required === false) return true;
      const val = answers[q.id];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
  };

  const progress = ((currentSection + 1) / (sections.length + 1)) * 100;

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!distancePref) {
      setError('请选择距离偏好');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/survey/submit', {
        answers: { ...answers, max_distance_preference: distancePref },
      });
      await refreshUser();
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (questionsLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary-300 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  if (user?.survey_completed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">问卷已完成</h2>
          <p className="text-gray-500 mb-4">你已经完成问卷了！可以修改答案重新提交。</p>
          <button onClick={() => navigate('/matches')} className="btn-primary">查看匹配</button>
        </div>
      </div>
    );
  }

  const isLastSection = currentSection === sections.length;
  const currentSectionData = isLastSection ? null : sections[currentSection];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">完成你的个人问卷</h1>
          <span className="text-sm text-gray-400">{currentSection + 1}/{sections.length + 1}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-accent-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section navigation pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {sections.map((sec, idx) => {
          const complete = isSectionComplete(sec);
          const active = idx === currentSection;
          return (
            <button
              key={sec.id}
              onClick={() => { setCurrentSection(idx); window.scrollTo(0, 0); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? 'bg-primary-500 text-white'
                  : complete
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {complete ? '✅ ' : ''}{SECTION_NAMES[sec.id]?.title || sec.title}
            </button>
          );
        })}
        <button
          onClick={() => setCurrentSection(sections.length)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isLastSection ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}
        >
          📍 匹配范围
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-6">{error}</div>
      )}

      {isLastSection ? (
        /* Distance preference section */
        <div className="card space-y-6 animate-fade-in">
          <div className="text-center">
            <div className="text-3xl mb-3">📍</div>
            <h2 className="text-lg font-bold mb-1">匹配范围设置</h2>
            <p className="text-sm text-gray-400">你愿意匹配多远距离的人？</p>
          </div>

          <div className="space-y-2">
            {[
              { value: 'same_city', label: '仅同城', desc: '只匹配和你在同一个城市的人' },
              { value: 'same_province', label: '同省即可', desc: '接受同一个省内的匹配' },
              { value: 'neighboring', label: '邻省也能接受', desc: '相邻省份的人也可以匹配' },
              { value: 'anywhere', label: '距离不是问题', desc: '不限制地理位置' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDistancePref(opt.value)}
                className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                  distancePref === opt.value
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`font-medium ${distancePref === opt.value ? 'text-primary-600' : 'text-gray-700'}`}>
                  {opt.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary w-full"
            disabled={loading || !distancePref}
          >
            {loading ? '提交中...' : '提交问卷，开始匹配！'}
          </button>
        </div>
      ) : (
        /* Question section */
        currentSectionData && (
          <div className="card animate-fade-in space-y-6">
            <div className="text-center border-b border-gray-100 pb-4">
              <div className="text-2xl mb-1">{SECTION_NAMES[currentSectionData.id]?.icon}</div>
              <h2 className="text-lg font-bold">{SECTION_NAMES[currentSectionData.id]?.title}</h2>
              <p className="text-sm text-gray-400">{SECTION_NAMES[currentSectionData.id]?.desc}</p>
            </div>

            {currentSectionData.questions.map((q) => {
              const key = q.id;
              const value = answers[key];
              const commonProps = { question: q, value, onChange: updateAnswer };
              switch (q.type) {
                case 'slider': return <div key={key} className="py-2"><SliderQuestion {...commonProps} /></div>;
                case 'radio': return <div key={key} className="py-2"><RadioQuestion {...commonProps} /></div>;
                case 'select': return <div key={key} className="py-2"><SelectQuestion {...commonProps} /></div>;
                case 'checkbox': return <div key={key} className="py-2"><CheckboxQuestion {...commonProps} /></div>;
                default: return null;
              }
            })}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {currentSection > 0 && (
                <button onClick={handlePrev} className="btn-outline flex-1">上一步</button>
              )}
              <button
                onClick={handleNext}
                className="btn-primary flex-1"
                disabled={!isSectionComplete(currentSectionData)}
              >
                下一步
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
