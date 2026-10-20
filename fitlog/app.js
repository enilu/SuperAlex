/* 只读展示：数据由 data.js 提供，不读写浏览器存储，也不提供数据修改入口。 */
(() => {
  'use strict';
  const M = window.FitLog;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mealNames = {breakfast:'早餐',lunch:'午餐',dinner:'晚餐',snack:'加餐 / 饮料'};
  const titles = {overview:'健康总览',plan:'我的计划',diet:'饮食记录',exercise:'运动记录',history:'身体趋势',review:'每周复盘'};
  let data;
  try { data = M.validate(window.FITLOG_DATA); }
  catch { $('#status').textContent = '展示数据暂时无法读取，请稍后刷新。'; $('#status').className = 'error'; return; }
  const rows = data.records, latest = rows.at(-1), p = data.profile;
  function show(tab) {
    if (!titles[tab]) return;
    document.querySelectorAll('.panel').forEach(section => section.hidden = section.id !== tab);
    document.querySelectorAll('[data-tab]').forEach(b => { if (b.dataset.tab === tab) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current'); });
    $('#page-title').textContent = titles[tab];
  }
  function calorie(t) { return !t ? '未记录' : t.min === t.max ? `约 ${t.min}` : `${t.min}–${t.max}`; }
  function mealValue(m) { return m.min === null ? (m.text ? '待估算' : '未记录') : calorie({min:m.min,max:m.max??m.min}); }
  function mealCalorie(m) { return `${mealValue(m)}${m.min === null ? '' : '<small> 千卡</small>'}`; }
  function pendingCalories(r) { return M.meals.some(k => r.meals[k].text && r.meals[k].min === null); }
  function num(v, unit='') { return v === null || v === undefined ? '未记录' : `${v}${unit}`; }
  function sum(items,key) { const vs = items.map(r => r[key]).filter(v => v !== null); return vs.length ? Math.round(vs.reduce((a,b)=>a+b,0)*100)/100 : null; }
  function facts(items) { return items.map(([k,v]) => `<div class="fact"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join(''); }
  function chart() {
    const measured = rows.filter(r => r.weight !== null).slice(-30);
    if (!measured.length) return '<div class="empty">尚无晨起实测体重<br>当前仅有自报起点，暂不绘制变化曲线。</div>';
    const values = measured.map(r=>r.weight), lo = Math.min(...values)-.5, hi = Math.max(...values)+.5;
    const first = Date.parse(measured[0].date), span = Date.parse(measured.at(-1).date)-first;
    const x = r => 55+(span ? (Date.parse(r.date)-first)/span*500 : 250), y = v => 180-(v-lo)/(hi-lo)*140;
    const points = measured.map(r=>`${x(r)},${y(r.weight)}`).join(' ');
    return `<svg class="chart" viewBox="0 0 600 225" role="img" aria-label="最近 ${measured.length} 次晨起体重，${measured[0].date} 至 ${measured.at(-1).date}"><title>晨起体重（公斤），按日期间隔排列</title>${[lo,(lo+hi)/2,hi].map(v=>`<line x1="50" y1="${y(v)}" x2="565" y2="${y(v)}" stroke="#e2e8df"/><text x="8" y="${y(v)+4}">${v.toFixed(1)}</text>`).join('')}<polyline points="${points}" fill="none" stroke="#438463" stroke-width="2.5"/>${measured.map(r=>`<circle cx="${x(r)}" cy="${y(r.weight)}" r="4" fill="#438463"><title>${r.date}：${r.weight} 公斤</title></circle>`).join('')}<text x="50" y="215">${measured[0].date}</text><text x="480" y="215">${measured.at(-1).date}</text></svg>`;
  }
  function renderDiet() {
    const r = rows.find(r => r.date === $('#diet-date').value);
    if (!r) { $('#diet-detail').innerHTML = '<div class="empty">暂无饮食记录。</div>'; return; }
    $('#diet-detail').innerHTML = `<div class="day-total"><div><span>${r.date} · ${pendingCalories(r)?'已估算摄入小计（不含待估算餐次）':r.foodComplete?'全天饮食已确认':'已报告摄入小计'}</span><strong>${calorie(M.totals(r))} <small>千卡</small></strong></div><span class="pill">${r.foodComplete?'完整记录':'尚有待补内容'}</span></div><div class="meal-grid">${M.meals.map(k=>{const m=r.meals[k];return `<article class="meal-card"><div class="section-title"><h3>${mealNames[k]}</h3><strong>${mealCalorie(m)}</strong></div><p class="preserve">${esc(m.text || '尚未报告')}</p></article>`;}).join('')}</div>${r.notes?`<details><summary>当日说明与待确认内容</summary><p class="preserve">${esc(r.notes)}</p></details>`:''}`;
  }
  function renderRecords() {
    const month = $('#month-filter').value, filtered = rows.filter(r=>!month || r.date.startsWith(month)).slice().reverse();
    $('#records').innerHTML = filtered.length ? `<div class="table-wrap"><table><thead><tr><th>日期</th><th>晨起体重 kg</th><th>腰围 cm</th><th>睡眠 h</th><th>步数</th></tr></thead><tbody>${filtered.map(r=>`<tr><td>${r.date}</td><td>${num(r.weight)}</td><td>${num(r.waist)}</td><td>${num(r.sleep)}</td><td>${num(r.steps)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">暂无该月份记录。</div>';
  }
  $('#updated').textContent = data.updatedAt ? `更新于 ${data.updatedAt}` : '更新日期待补充';
  const lastMeasured = rows.filter(r=>r.weight!==null).at(-1);
  $('#summary').innerHTML = [
    ['自报起始体重',num(p.startWeight,' kg'),'作为计划起点，非晨起实测'],
    ['目标体重',num(p.targetWeight,' kg'),lastMeasured ? `最近实测 ${lastMeasured.weight} 公斤` : '晨起实测体重待记录'],
    ['最近已记摄入',latest ? calorie(M.totals(latest)) : '—',latest ? `${latest.date} · ${latest.foodComplete?'全天已确认':'已报告小计'} · 千卡` : '暂无饮食记录'],
    ['累计记录',`${rows.length} 天`,latest ? `最近记录 ${latest.date}` : '等待下一次更新']
  ].map(([k,v,h])=>`<div class="stat"><span class="label">${esc(k)}</span><strong>${esc(v)}</strong><small>${esc(h)}</small></div>`).join('');
  const week = latest ? M.week(latest.date) : null, weekRows = rows.filter(r=>week && M.week(r.date)===week);
  $('#week-label').textContent = week ? `最近记录周 · ${week} 起` : 'LATEST RECORDED WEEK';
  $('#week-summary').innerHTML = [['有记录的日子',`${weekRows.length} 天`],['已记有氧',num(sum(weekRows,'aerobic'),' 分钟')],['已记骑行',num(sum(weekRows,'cycling'),' 公里')],['力量训练',num(sum(weekRows,'strengthCount'),' 次')]].map(([k,v])=>`<div class="week-item"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('');
  $('#overview-chart').innerHTML = chart(); $('#history-chart').innerHTML = chart();
  $('#focus').textContent = data.focus || '持续积累饮食、运动与晨起体重记录，再回看每周变化。';
  $('#plan-stats').innerHTML = facts([['自报起始体重',num(p.startWeight,' 公斤')],['目标体重',num(p.targetWeight,' 公斤')],['摄入参考',num(p.calorieTarget,' 千卡/天')],['实际开始日期',p.startDate || '待确认']]);
  $('#plan-content').innerHTML = [['阶段计划',p.phases],['每周运动安排',p.weeklyPlan],['饮食与作息',p.routine]].map(([title,text])=>`<article class="card"><h2>${title}</h2><p class="preserve plan-text">${esc(text || '待更新')}</p></article>`).join('');
  $('#diet-date').innerHTML = rows.slice().reverse().map(r=>`<option value="${r.date}">${r.date}</option>`).join('');
  $('#diet-table').innerHTML = rows.length ? `<div class="table-wrap"><table><thead><tr><th>日期</th>${M.meals.map(k=>`<th>${mealNames[k]}</th>`).join('')}<th>已记合计</th><th>完整性</th></tr></thead><tbody>${rows.slice().reverse().map(r=>`<tr><td><button class="date-link" data-date="${r.date}">${r.date}</button></td>${M.meals.map(k=>{const m=r.meals[k];return `<td>${mealValue(m)}</td>`;}).join('')}<td>${calorie(M.totals(r))}</td><td>${pendingCalories(r)?'有餐次待估算':r.foodComplete?'全天已确认':'已记小计'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">暂无饮食记录。</div>';
  $('#exercise-stats').innerHTML = facts([['已记骑行',num(sum(rows,'cycling'),' 公里')],['骑行记录',`${rows.filter(r=>r.cycling!==null).length} 天`],['已记有氧',num(sum(rows,'aerobic'),' 分钟')],['力量训练',num(sum(rows,'strengthCount'),' 次')]]);
  const activityRows = rows.filter(r=>r.activity || ['steps','cycling','aerobic','strengthCount','exerciseCalories'].some(k=>r[k]!==null));
  $('#exercise-records').innerHTML = activityRows.length ? activityRows.slice().reverse().map(r=>`<article class="card"><h2>${r.date}</h2><div class="facts">${facts([['步数',num(r.steps)],['骑行',num(r.cycling,' 公里')],['确认有氧',num(r.aerobic,' 分钟')],['力量训练',num(r.strengthCount,' 次')],['应用估算消耗',num(r.exerciseCalories,' 千卡')]])}</div>${r.activity?`<p class="preserve">${esc(r.activity)}</p>`:''}</article>`).join('') : '<article class="card empty">暂无运动记录。</article>';
  const weeks = M.weeks(rows);
  $('#weekly-weights').innerHTML = weeks.length ? `<div class="table-wrap"><table><caption>晨起体重周平均</caption><thead><tr><th>周一日期</th><th>测量次数</th><th>平均（公斤）</th><th>较上一周</th></tr></thead><tbody>${weeks.map((r,i)=>{const prev=weeks[i-1],adjacent=prev&&(Date.parse(r.date)-Date.parse(prev.date))===7*86400000,change=adjacent?r.average-prev.average:null;return `<tr><td>${r.date}</td><td>${r.count}</td><td>${r.average.toFixed(2)}</td><td>${change===null?'—':`${change>0?'+':''}${change.toFixed(2)}`}</td></tr>`;}).join('')}</tbody></table></div>` : '';
  $('#month-filter').innerHTML = '<option value="">全部月份</option>'+[...new Set(rows.map(r=>r.date.slice(0,7)))].reverse().map(m=>`<option value="${m}">${m}</option>`).join('');
  $('#reviews').innerHTML = data.reviews.length ? data.reviews.slice().reverse().map(r=>`<article class="card"><h2>${r.date} 这一周</h2>${[['最容易坚持的事',r.wins],['状态与困难',r.feelings],['下周只调整一项',r.next]].map(([k,v])=>`<h3>${k}</h3><p class="preserve">${esc(v || '未记录')}</p>`).join('')}</article>`).join('') : '<article class="card empty">暂未形成每周复盘记录。<br>后续随记录更新。</article>';
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.tab)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.go)));
  $('#diet-date').addEventListener('change',renderDiet);
  $('#month-filter').addEventListener('change',renderRecords);
  $('#diet-table').addEventListener('click',e=>{const b=e.target.closest('[data-date]');if(b){$('#diet-date').value=b.dataset.date;renderDiet();$('#diet-detail').scrollIntoView({block:'start'});}});
  renderDiet();renderRecords();
})();
