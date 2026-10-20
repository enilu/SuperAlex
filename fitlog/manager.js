/* 独立数据模型：所有缺失数值均为 null，避免与真实零值混淆。 */
(() => {
  'use strict';
  const meals = ['breakfast', 'lunch', 'dinner', 'snack'];
  const limits = {height:[50,250],startWeight:[20,500],targetWeight:[20,500],calorieTarget:[1,20000],weight:[20,500],waist:[20,300],sleep:[0,24],steps:[0,200000],aerobic:[0,1440],cycling:[0,1000],strengthCount:[0,20],exerciseCalories:[0,20000],min:[0,20000],max:[0,20000]};
  const integers = ['calorieTarget','steps','strengthCount','exerciseCalories','min','max'];
  function object(v) { if (!v || typeof v !== 'object' || Array.isArray(v)) throw Error('数据对象格式不正确'); return v; }
  function str(v, max = 20000) { if (v == null) return ''; if (typeof v !== 'string' || v.length > max) throw Error('文本类型或长度不正确'); return v; }
  function number(v, key) {
    if (v == null || v === '') return null;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < limits[key][0] || v > limits[key][1] || (integers.includes(key) && !Number.isInteger(v))) throw Error(`${key} 数值超出范围或格式错误`);
    return v;
  }
  function date(v, optional = false) {
    if (optional && (v == null || v === '')) return '';
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v < '1900-01-01' || v > '2100-12-31' || new Date(v + 'T12:00:00Z').toISOString().slice(0,10) !== v) throw Error('日期无效');
    return v;
  }
  function week(v) { date(v); const d = new Date(v + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - (d.getUTCDay()+6)%7); return d.toISOString().slice(0,10); }
  function profile(v = {}) {
    object(v); const p = {name:str(v.name,60),startDate:date(v.startDate,true),phases:str(v.phases),weeklyPlan:str(v.weeklyPlan),routine:str(v.routine)};
    ['height','startWeight','targetWeight','calorieTarget'].forEach(k => p[k] = number(v[k],k)); return p;
  }
  function record(v) {
    object(v); const r = {date:date(v.date),activity:str(v.activity),notes:str(v.notes),foodComplete:v.foodComplete === true,meals:{}};
    if (v.foodComplete != null && typeof v.foodComplete !== 'boolean') throw Error('饮食完整标记格式不正确');
    ['weight','waist','sleep','steps','aerobic','cycling','strengthCount','exerciseCalories'].forEach(k => r[k] = number(v[k],k));
    object(v.meals || {});
    meals.forEach(k => { const m = object((v.meals || {})[k] || {}); r.meals[k] = {min:number(m.min,'min'),max:number(m.max,'max'),text:str(m.text)}; if (r.meals[k].max !== null && (r.meals[k].min === null || r.meals[k].max < r.meals[k].min)) throw Error('热量上限应不小于下限，且下限不能为空'); });
    return r;
  }
  function review(v) { object(v); return {date:week(date(v.date)),wins:str(v.wins),feelings:str(v.feelings),next:str(v.next)}; }
  function unique(rows, label) { const keys = new Set(); for (const row of rows) { if (keys.has(row.date)) throw Error(`${label}含重复日期`); keys.add(row.date); } return rows.sort((a,b) => a.date.localeCompare(b.date)); }
  function validate(v) {
    object(v); if (v.schemaVersion !== 1) throw Error('不支持的 FitLog 数据版本');
    for (const k of ['records','reviews']) if (!Array.isArray(v[k])) throw Error(`缺少 ${k} 数据列表`);
    if (v.records.length > 20000 || v.reviews.length > 10000) throw Error('数据条数过多');
    return {schemaVersion:1,updatedAt:date(v.updatedAt,true),focus:str(v.focus),profile:profile(v.profile),records:unique(v.records.map(record),'每日记录'),reviews:unique(v.reviews.map(review),'复盘')};
  }
  function totals(r) { let count = 0, min = 0, max = 0; meals.forEach(k => { const m = r.meals[k]; if (m.min !== null) { count++; min += m.min; max += m.max ?? m.min; } }); return count ? {min,max} : null; }
  function weeks(records) {
    const groups = new Map();
    records.filter(r => r.weight !== null).forEach(r => { const w = week(r.date); if (!groups.has(w)) groups.set(w,[]); groups.get(w).push(r.weight); });
    return [...groups].sort((a,b) => a[0].localeCompare(b[0])).map(([date,values]) => ({date,count:values.length,average:values.reduce((a,b)=>a+b,0)/values.length}));
  }
  const api = {meals,week,validate,totals,weeks};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else window.FitLog = api;
})();
