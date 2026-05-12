import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api, { getErrorMessage } from '../utils/api';

function SliderQuestion({ question, value, onChange, highlight, isImportant, onToggleImp }) {
  const currentVal = value ?? Math.floor((question.min + question.max) / 2);
  return (
    <div className={`space-y-3 rounded-2xl p-3 transition-all duration-500 ${highlight ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''}`} data-field={question.id}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{question.label}</label>
        <button type="button" onClick={() => onToggleImp(question.id)}
          className={`text-lg transition-all ${isImportant ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          title={isImportant ? '已设为重要' : '设为重要'}
        >★</button>
      </div>
      <div className="flex items-center gap-3">
        {question.min_label && <span className="text-xs text-gray-400 w-16 text-right shrink-0">{question.min_label}</span>}
        <input
          type="range" min={question.min} max={question.max} step={question.step || 1}
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

function RadioQuestion({ question, value, onChange, highlight, isImportant, onToggleImp }) {
  return (
    <div className={`space-y-2 rounded-2xl p-3 transition-all duration-500 ${highlight ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''}`} data-field={question.id}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{question.label}</label>
        <button type="button" onClick={() => onToggleImp(question.id)}
          className={`text-lg transition-all ${isImportant ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          title={isImportant ? '已设为重要' : '设为重要'}
        >★</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt) => (
          <button key={opt.value} type="button"
            onClick={() => onChange(question.id, opt.value)}
            className={`px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
              value === opt.value ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >{opt.label}</button>
        ))}
      </div>
    </div>
  );
}

function SelectQuestion({ question, value, onChange, highlight, isImportant, onToggleImp }) {
  return (
    <div className={`space-y-2 rounded-2xl p-3 transition-all duration-500 ${highlight ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''}`} data-field={question.id}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{question.label}</label>
        <button type="button" onClick={() => onToggleImp(question.id)}
          className={`text-lg transition-all ${isImportant ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          title={isImportant ? '已设为重要' : '设为重要'}
        >★</button>
      </div>
      <select className="input-field" value={value || ''} onChange={(e) => onChange(question.id, e.target.value)}>
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

function CheckboxQuestion({ question, value, onChange, highlight, isImportant, onToggleImp }) {
  const selected = value || [];
  const maxSelect = question.max_select || 999;
  const toggle = (opt) => {
    if (selected.includes(opt)) onChange(question.id, selected.filter((v) => v !== opt));
    else if (selected.length < maxSelect) onChange(question.id, [...selected, opt]);
  };
  return (
    <div className={`space-y-2 rounded-2xl p-3 transition-all duration-500 ${highlight ? 'bg-yellow-50 ring-2 ring-yellow-400' : ''}`} data-field={question.id}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {question.label}
          <span className="text-gray-400 text-xs ml-1">（最多选{maxSelect}项，已选{selected.length}）</span>
        </label>
        <button type="button" onClick={() => onToggleImp(question.id)}
          className={`text-lg transition-all ${isImportant ? 'text-amber-400 scale-110' : 'text-gray-300 hover:text-gray-400'}`}
          title={isImportant ? '已设为重要' : '设为重要'}
        >★</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const optVal = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const isSelected = selected.includes(optVal);
          return (
            <button key={optVal} type="button" onClick={() => toggle(optVal)}
              className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                isSelected ? 'border-primary-400 bg-primary-50 text-primary-600' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >{optLabel}</button>
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
  const [submitted, setSubmitted] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [highlightedFields, setHighlightedFields] = useState([]);
  const [missingCount, setMissingCount] = useState(0);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const sectionRefs = useRef({});

  useEffect(() => {
    api.get('/survey/questions').then((res) => {
      const secs = res.data.sections;
      setSections(secs);
      setQuestionsLoading(false);

      const defaults = {};
      secs.forEach((sec) => {
        sec.questions.forEach((q) => {
          if (q.type === 'slider') {
            defaults[q.id] = Math.floor((q.min + q.max) / 2);
          }
        });
      });

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
    setHighlightedFields((prev) => prev.filter((f) => f !== id));
  };

  const toggleImportance = (qid) => {
    setAnswers((prev) => ({ ...prev, [`_imp_${qid}`]: !prev[`_imp_${qid}`] }));
  };

  const isQuestionAnswered = useCallback((q) => {
    if (q.required === false) return true;
    const val = answers[q.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }, [answers]);

  const isSectionComplete = useCallback((section) => {
    return section.questions.every(isQuestionAnswered);
  }, [isQuestionAnswered]);

  const allSectionsComplete = sections.length > 0 && sections.every(isSectionComplete);

  const findMissingFields = () => {
    const missing = [];
    sections.forEach((sec, secIdx) => {
      sec.questions.forEach((q) => {
        if (!isQuestionAnswered(q)) missing.push({ id: q.id, sectionIdx: secIdx });
      });
    });
    return missing;
  };

  const scrollToMissingField = (fieldId) => {
    setTimeout(() => {
      const el = document.querySelector(`[data-field="${fieldId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleNext = () => {
    const section = sections[currentSection];
    if (!isSectionComplete(section)) {
      const missing = section.questions.filter((q) => !isQuestionAnswered(q));
      setMissingCount(missing.length);
      setHighlightedFields(missing.map((q) => q.id));
      if (missing.length > 0) {
        scrollToMissingField(missing[0].id);
      }
      setTimeout(() => setHighlightedFields([]), 2500);
      return;
    }
    setMissingCount(0);
    setHighlightedFields([]);
    if (currentSection < sections.length) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canSwitchToSection = (targetIdx) => {
    for (let i = 0; i < targetIdx; i++) {
      if (!isSectionComplete(sections[i])) return false;
    }
    return true;
  };

  const handleTabClick = (idx) => {
    if (idx === currentSection) return;
    if (canSwitchToSection(idx)) {
      setCurrentSection(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHighlightedFields([]);
    }
  };

  const handleSubmit = async () => {
    if (!distancePref) {
      setError('请选择距离偏好');
      return;
    }
    const allMissing = findMissingFields();
    if (allMissing.length > 0) {
      setError(`还有 ${allMissing.length} 个必填项未完成，请回到对应部分填写`);
      setMissingCount(allMissing.length);
      setHighlightedFields(allMissing.map((m) => m.id));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/survey/submit', {
        answers: { ...answers, max_distance_preference: distancePref },
      });
      setSubmitted(true);
      await refreshUser();
      setTimeout(() => navigate('/'), 800);
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

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full animate-slide-up">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">提交成功！</h2>
          <p className="text-gray-500 mb-4">问卷已提交，正在为你返回首页...</p>
          <div className="animate-spin w-8 h-8 border-4 border-primary-300 border-t-primary-600 rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  const isLastSection = currentSection === sections.length;
  const currentSectionData = isLastSection ? null : sections[currentSection];
  const progress = ((currentSection + 1) / (sections.length + 1)) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {submitted && (
        <div className="card text-center max-w-md mx-auto animate-slide-up">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">提交成功！</h2>
          <p className="text-gray-500 mb-4">已为你转跳至首页。</p>
        </div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">完成你的个人问卷</h1>
          <span className="text-sm text-gray-400">{currentSection + 1}/{sections.length + 1}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-400 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Section nav tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((sec, idx) => {
          const complete = isSectionComplete(sec);
          const active = idx === currentSection;
          const locked = !canSwitchToSection(idx) && idx !== currentSection;
          return (
            <button
              key={sec.id}
              onClick={() => handleTabClick(idx)}
              title={locked ? '请先完成当前部分' : ''}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                active
                  ? 'bg-primary-500 text-white'
                  : complete
                  ? 'bg-primary-50 text-primary-600 border border-primary-200 cursor-pointer'
                  : locked
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
              }`}
            >
              {complete ? '✅ ' : locked ? '🔒 ' : ''}{SECTION_NAMES[sec.id]?.title || sec.title}
            </button>
          );
        })}
        <button
          onClick={() => allSectionsComplete ? setCurrentSection(sections.length) : null}
          title={!allSectionsComplete ? '请先完成所有问卷部分' : ''}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isLastSection
              ? 'bg-primary-500 text-white'
              : allSectionsComplete
              ? 'bg-gray-100 text-gray-400 cursor-pointer hover:bg-gray-200'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          }`}
        >
          {allSectionsComplete ? '📍' : '🔒'} 匹配范围
        </button>
      </div>

      {/* Error + missing-fields badge */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-2xl mb-4">{error}</div>
      )}
      {missingCount > 0 && !isLastSection && (
        <div className="bg-yellow-50 text-yellow-700 text-sm px-4 py-3 rounded-2xl mb-4 flex items-center justify-between">
          <span>还有 {missingCount} 个必填项未完成</span>
          <span className="text-xs opacity-60">高亮显示中</span>
        </div>
      )}

      {isLastSection ? (
        /* Distance preference */
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
              <button key={opt.value} type="button"
                onClick={() => setDistancePref(opt.value)}
                className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition-all ${
                  distancePref === opt.value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`font-medium ${distancePref === opt.value ? 'text-primary-600' : 'text-gray-700'}`}>{opt.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} className="btn-primary w-full" disabled={loading || !distancePref}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                提交中...
              </span>
            ) : '提交问卷，开始匹配！'}
          </button>
        </div>
      ) : (
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
              const isHighlighted = highlightedFields.includes(key);
              const commonProps = { question: q, value, onChange: updateAnswer, highlight: isHighlighted, isImportant: !!answers[`_imp_${q.id}`], onToggleImp: toggleImportance };
              switch (q.type) {
                case 'slider': return <div key={key} ref={(el) => { if (el) sectionRefs.current[key] = el; }} className="py-1"><SliderQuestion {...commonProps} /></div>;
                case 'radio': return <div key={key} ref={(el) => { if (el) sectionRefs.current[key] = el; }} className="py-1"><RadioQuestion {...commonProps} /></div>;
                case 'select': return <div key={key} ref={(el) => { if (el) sectionRefs.current[key] = el; }} className="py-1"><SelectQuestion {...commonProps} /></div>;
                case 'checkbox': return <div key={key} ref={(el) => { if (el) sectionRefs.current[key] = el; }} className="py-1"><CheckboxQuestion {...commonProps} /></div>;
                default: return null;
              }
            })}

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
