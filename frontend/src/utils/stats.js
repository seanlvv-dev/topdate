/**
 * 虚拟用户数膨胀 — 纯前端实现，不存数据库
 * 效果：首页显示已注册人数 = 真实人数 + 虚拟基础(~350) + 真实用户×50%随机膨胀
 */
const VIRTUAL_UNIVERSITY_COUNTS = {
  '复旦大学': 178,
  '上海交通大学': 28,
  '同济大学': 26,
  '北京大学': 33,
  '清华大学': 31,
  '浙江大学': 18,
  '南京大学': 16,
  '武汉大学': 14,
  '华中科技大学': 12,
  '西安交通大学': 10,
  '哈尔滨工业大学': 9,
  '中国人民大学': 8,
  '中国科学技术大学': 8,
  '中山大学': 8,
  '南开大学': 7,
  '北京师范大学': 7,
  '山东大学': 7,
  '东南大学': 7,
  '华南理工大学': 7,
  '四川大学': 6,
  '电子科技大学': 6,
  '天津大学': 5,
  '中南大学': 5,
  '厦门大学': 5,
  '北京航空航天大学': 5,
  '北京理工大学': 4,
  '大连理工大学': 4,
  '吉林大学': 4,
  '华东师范大学': 4,
  '湖南大学': 4,
  '重庆大学': 3,
  '西北工业大学': 3,
  '兰州大学': 3,
  '中国农业大学': 3,
  '东北大学': 3,
  '中国海洋大学': 3,
  '西北农林科技大学': 2,
  '国防科技大学': 2,
  '中央民族大学': 2,
};

function hashStr(s) {
  let hash = 0;
  for (let i = 0; i < (s || '').length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** 虚拟基础总数 */
const VIRTUAL_BASE_TOTAL = Object.values(VIRTUAL_UNIVERSITY_COUNTS).reduce((a, b) => a + b, 0);

/**
 * 膨胀 stats 数据
 * @param {object} real - 后端返回的真实 stats
 * @returns {object} 膨胀后的 stats
 */
export function inflateStats(real) {
  if (!real) return real;

  // 每个真实用户随机膨胀 +1 或 +2（基于 hash，同一用户永远相同数）
  const inflationExtra = Math.max(0, Math.floor(real.total_users * 0.5));
  const total_users = (real.total_users || 0) + VIRTUAL_BASE_TOTAL + inflationExtra;

  // 高校排名：真实人数 + 虚拟人数
  const top_universities = (real.top_universities || []).map((uni) => {
    const virtual = VIRTUAL_UNIVERSITY_COUNTS[uni.university_name] ?? Math.floor(hashStr(uni.university_name) % 6) + 3;
    return { ...uni, count: (uni.count || 0) + virtual };
  });

  // 补上虚拟用户所在的高校（如果真实排行里没有）
  const coveredMap = new Map(top_universities.map((u) => [u.university_name, true]));
  for (const [name, count] of Object.entries(VIRTUAL_UNIVERSITY_COUNTS)) {
    if (!coveredMap.has(name)) {
      top_universities.push({ university_name: name, province: '', count });
    }
  }
  top_universities.sort((a, b) => b.count - a.count);

  const total_unis = Math.min(39, new Set([
    ...top_universities.map((u) => u.university_name),
    ...Object.keys(VIRTUAL_UNIVERSITY_COUNTS),
  ]).size);

  return {
    ...real,
    total_users,
    total_verified_users: Math.floor(total_users * 0.85),
    total_survey_completed: Math.floor(total_users * 0.62),
    total_match_pairs: Math.floor(total_users * 0.12),
    match_success_rate: 12.0,
    active_users_this_week: Math.floor(total_users * 0.35),
    top_universities: top_universities.slice(0, 10),
    total_universities: total_unis,
  };
}
