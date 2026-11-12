/* The research trace of the AttnRes-Canon post: one time axis with the operator's messages, the agent's turns, its key
   events and every experiment from launch to result, and below it the content of each turn.
   - One script serves both pages; the language comes from <html lang>.
   - trace-data.js (window.TRACE) holds the data; times are seconds from the start of the session.
   - Text from the session is always inserted as text nodes, never as HTML. */
(function () {
  'use strict';

  const D = window.TRACE;
  const mount = document.getElementById('trace-app');
  if (!D || !mount) return;

  const root = document.documentElement;
  const ZH = (root.lang || 'en').toLowerCase().startsWith('zh');
  const L = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? (ZH ? o.zh : o.en) : o);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const S = ZH ? {
    lanes: { human: '人的输入', agent: 'Agent 工作', events: '关键事件', exps: '实验' },
    all: '全程', fit: '全程', zoomIn: '放大', zoomOut: '缩小', replay: '重放',
    legend: {
      approve: '批准 Agent 提出的方案', otherInput: '其他输入：任务说明、环境决定、暂停', turnHuman: '由人的输入触发的回合',
      turnResume: '人恢复会话后的回合（没有新的指令）', turnWake: '由后台监视触发的回合（实验有进展时唤醒）',
      side: '与研究无关的工作（不展示内容）', web: '联网搜索', review: '请 Codex 评审', ask: '向人提问', compact: '上下文压缩',
      waitRun: '发起 → 等待 GPU（细线）→ 训练（色条）', ref: 'baseline 与对照', final: '最终模型 AttnRes-Canon', failed: '失败', cancelled: '取消',
      night: '浅色竖带是每天 0 点到 8 点', thread: '连线：结果回到 Agent 的那个回合',
    },
    hint: '拖动可平移，Ctrl + 滚轮或双指可缩放，点击任一标记查看内容。',
    steps: '回合', filters: { all: '全部', human: '人的输入', wake: '监视唤醒', launch: '发起实验', result: '收到结果', web: '联网搜索' },
    trigHuman: '人的输入', trigWake: '后台监视唤醒', trigSession: '会话恢复', trigResume: '会话恢复',
    resumeLine: '会话恢复，没有新的指令', resumeNote: '人恢复了停下的会话，没有给出新的指令；Agent 从停下的地方接着做。',
    who: { human: '人', wake: '监视', resume: '恢复', web: '联网搜索' },
    input: '输入', output: '输出', stream: '过程', noReply: '这一回合没有留下回复。', inputTranslated: '英文翻译', inputSummarized: '摘要',
    watchFired: '后台监视结束', watchNote: 'Agent 在更早的回合里设好了这个监视；它结束时，Agent 被唤醒。',
    worked: '用时', actions: (n) => `${n} 次操作`, compacted: '这一回合中上下文被压缩过',
    launched: '发起', launchedAuto: '排队脚本在 Agent 空闲时发起', resultIn: '结果返回', finished: '结束于',
    sideTitle: '与研究无关的工作', sideNote: '这段时间 Agent 在处理与这次研究无关的事情，内容不在这里展示。', sideTurns: (n) => `${n} 个回合`,
    cats: { read: '查看', write: '修改', test: '运行', exp: '实验', wait: '等待', git: 'Git', web: '联网', review: '评审', ask: '提问', other: '工具', note: '说明' },
    webTitle: '联网搜索', webQuery: '搜索词', webHits: '返回的结果', webInput: '搜索输入', webOutput: '搜索返回的结果',
    webTook: (n) => `${n} 秒后返回`, webLinks: (n) => `${n} 条链接`, webSummary: '返回的摘要', webThen: 'Agent 随后做了什么', webInTurn: '所在回合', webOpen: '查看这次搜索',
    hiddenActs: (n) => `另有 ${n} 次集群与发布相关的操作未列出`, askTitle: '向人提问', askAnswer: '回答', askOptions: '选项',
    exp: {
      title: '实验', hyp: '假设', parent: '父模型', lineage: '与父模型的差别', scale: '规模', gpus: 'GPU', launched: '发起', started: '开跑', ended: '结束',
      waited: '等待', ran: '训练', result: '结果', devBpb: 'dev BPB', line: '胜出线', beat: '越过胜出线', notBeat: '未越过胜出线', evals: '各评估点的 dev BPB',
      step: '步数', arrived: '返回时间', toLaunch: '查看发起它的回合', toResult: '查看收到结果的回合', segments: (n) => `分 ${n} 段运行`,
      status: { succeeded: '完成', failed: '失败', cancelled: '取消', segment: '按计划在时限处结束' }, core: 'CORE', valBpb: '验证 BPB',
      neverRan: '没有开跑',
    },
    table: { title: '全部实验', group: '阶段', model: '模型', scale: '规模', launched: '发起', waited: '等待', ran: '训练', result: 'dev BPB', outcome: '结局' },
    tipTurn: '回合', day: (n) => `第 ${n} 天`, pick: '在时间轴或左侧列表中选一个回合，或点一个实验。',
    month: (m, d) => `${m}月${d}日`, dur: { s: ' 秒', m: ' 分', h: ' 小时', d: ' 天' },
    aria: '研究轨迹时间轴：人的输入、Agent 的回合、关键事件和实验',
  } : {
    lanes: { human: 'Operator input', agent: 'Agent at work', events: 'Key events', exps: 'Experiments' },
    all: 'Whole session', fit: 'Fit', zoomIn: 'Zoom in', zoomOut: 'Zoom out', replay: 'Replay',
    legend: {
      approve: 'Approval of what the agent proposed', otherInput: 'Other input: the brief, an environment decision, a hold',
      turnHuman: 'Turn started by an operator input', turnResume: 'Turn after the operator resumed the session (no new instruction)',
      turnWake: 'Turn started by a background watcher (the agent is woken when an experiment moves)',
      side: 'Work unrelated to the research (content not shown)', web: 'Web search', review: 'Review by Codex', ask: 'Question to the operator',
      compact: 'Context compacted', waitRun: 'Launch → waiting for GPUs (line) → training (bar)', ref: 'Baselines and reference runs',
      final: 'The final model, AttnRes-Canon', failed: 'Failed', cancelled: 'Cancelled', night: 'Shaded bands mark midnight to 8 am',
      thread: 'Thread: the turn in which the result reached the agent',
    },
    hint: 'Drag to pan, Ctrl + wheel or pinch to zoom, click any mark to read it.',
    steps: 'Turns', filters: { all: 'All', human: 'Operator input', wake: 'Woken by a watcher', launch: 'Launches', result: 'Results', web: 'Web search' },
    trigHuman: 'Operator input', trigWake: 'Woken by a watcher', trigSession: 'Session resumed', trigResume: 'Session resumed',
    resumeLine: 'Session resumed, no new instruction', resumeNote: 'The operator restarted the stalled session without a new instruction; the agent carried on from where it had stopped.',
    who: { human: 'Operator', wake: 'Watcher', resume: 'Resumed', web: 'Web search' },
    input: 'Input', output: 'Output', stream: 'What it did', noReply: 'The agent left no reply in this turn.', inputTranslated: 'translated', inputSummarized: 'summarized',
    watchFired: 'A background watcher finished', watchNote: 'The agent set this watcher in an earlier turn; when it ended, the agent was woken.',
    worked: 'worked', actions: (n) => `${n} action${n === 1 ? '' : 's'}`, compacted: 'the context was compacted during this turn',
    launched: 'Launched', launchedAuto: 'Launched by the agent\'s queue script while it was idle', resultIn: 'Result back', finished: 'finished',
    sideTitle: 'Work unrelated to the research', sideNote: 'During this time the agent worked on something outside this research. Its content is not shown here.',
    sideTurns: (n) => `${n} turn${n === 1 ? '' : 's'}`,
    cats: { read: 'Inspect', write: 'Edit', test: 'Run', exp: 'Experiment', wait: 'Wait', git: 'Git', web: 'Web', review: 'Review', ask: 'Ask', other: 'Tool', note: 'Note' },
    webTitle: 'Web search', webQuery: 'Query', webHits: 'Results returned', webInput: 'Search input', webOutput: 'What the search returned',
    webTook: (n) => `returned in ${n} s`, webLinks: (n) => `${n} link${n === 1 ? '' : 's'}`, webSummary: 'Summary returned', webThen: 'What the agent did next', webInTurn: 'In the turn', webOpen: 'Open this search',
    hiddenActs: (n) => `${n} more action${n === 1 ? '' : 's'} on cluster housekeeping and publishing are not listed`, askTitle: 'Question to the operator', askAnswer: 'Answer', askOptions: 'Options',
    exp: {
      title: 'Experiment', hyp: 'Hypothesis', parent: 'Parent', lineage: 'Change against the parent', scale: 'Scale', gpus: 'GPUs', launched: 'Launched', started: 'Started',
      ended: 'Ended', waited: 'Waited', ran: 'Trained', result: 'Result', devBpb: 'dev BPB', line: 'winning line', beat: 'beat the winning line',
      notBeat: 'did not beat the winning line', evals: 'Dev BPB at each evaluation', step: 'Update', arrived: 'Arrived',
      toLaunch: 'Go to the turn that launched it', toResult: 'Go to the turn that got the result', segments: (n) => `ran in ${n} segments`,
      status: { succeeded: 'Completed', failed: 'Failed', cancelled: 'Cancelled', segment: 'Ended at the time limit, as planned' }, core: 'CORE',
      valBpb: 'validation BPB', neverRan: 'never started',
    },
    table: { title: 'Every experiment', group: 'Stage', model: 'Model', scale: 'Scale', launched: 'Launched', waited: 'Waited', ran: 'Trained', result: 'dev BPB', outcome: 'Outcome' },
    tipTurn: 'Turn', day: (n) => `Day ${n}`, pick: 'Pick a turn on the time axis or in the list, or click an experiment.',
    month: (m, d) => `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${d}`,
    dur: { s: ' s', m: ' min', h: ' h', d: ' d' },
    aria: 'Time axis of the research trace: operator input, agent turns, key events and experiments',
  };

  // ---------- time ----------
  const START = Date.parse(D.meta.start) / 1000;
  const TZ = D.meta.tzHours * 3600;
  const SPAN = D.meta.span;
  const loc = (t) => new Date((START + t + TZ) * 1000);       // read with the UTC getters
  const pad = (n) => String(n).padStart(2, '0');
  const fmtDay = (t) => { const d = loc(t); return S.month(d.getUTCMonth() + 1, d.getUTCDate()); };
  const fmtClock = (t, sec) => { const d = loc(t); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}${sec ? ':' + pad(d.getUTCSeconds()) : ''}`; };
  const fmtStamp = (t) => `${fmtDay(t)}${ZH ? ' ' : ', '}${fmtClock(t)}`;
  const dayNo = (t) => Math.floor((START + t + TZ) / 86400) - Math.floor((START + TZ) / 86400) + 1;
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    if (sec < 60) return `${sec}${S.dur.s}`;
    if (sec < 3600) return `${Math.round(sec / 60)}${S.dur.m}`;
    if (sec < 86400) { const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60); return m && h < 10 ? `${h}${S.dur.h} ${m}${S.dur.m}` : `${Math.round(sec / 3600)}${S.dur.h}`; }
    const d = Math.floor(sec / 86400), h = Math.round((sec % 86400) / 3600);
    return h ? `${d}${S.dur.d} ${h}${S.dur.h}` : `${d}${S.dur.d}`;
  }
  const num = (v, n) => v.toFixed(n);

  // ---------- data, indexed ----------
  const turns = D.turns, exps = D.exps, events = D.events;
  const turnById = new Map(turns.map((t) => [t.i, t]));
  const expById = new Map(exps.map((e) => [e.id, e]));
  const phaseById = new Map(D.phases.map((p) => [p.id, p]));
  turns.forEach((t) => { t.launches = []; t.autoLaunches = []; t.results = []; t.marks = new Set(); });
  exps.forEach((e) => {
    const lt = turnById.get(e.launchTurn), st = turnById.get(e.seenTurn);
    if (lt) (e.auto ? lt.autoLaunches : lt.launches).push(e);
    if (st) st.results.push(e);
    e.final = e.method === 'attnres_full_canon_abcd';
    e.wait = e.segs.reduce((a, s) => a + ((s[1] == null ? s[2] : s[1]) - s[0]), 0);
    e.ran = e.segs.reduce((a, s) => a + (s[1] == null ? 0 : s[2] - s[1]), 0);
  });
  events.forEach((ev) => { const t = turnById.get(ev.turn); if (t) t.marks.add(ev.kind); });
  const searches = events.map((ev, k) => ({ ev, k })).filter((x) => x.ev.kind === 'web');
  const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (err) { return ''; } };
  const expName = (e) => {
    let name = L(e.name);
    if (e.offset) name += ZH ? `（重复 ${e.offset + 1}）` : ` (repeat ${e.offset + 1})`;
    return name;
  };
  const expGroup = (e) => L(D.groups[e.group]);

  // Experiments are packed into rows: each takes the first row that is free again at its launch.
  const rowEnd = [];
  exps.forEach((e) => {
    let row = rowEnd.findIndex((end) => end + 900 < e.launch);
    if (row < 0) { row = rowEnd.length; rowEnd.push(0); }
    rowEnd[row] = e.end;
    e.row = row;
  });
  const EXP_ROWS = rowEnd.length;
  const PITCH = 11;
  exps.forEach((e) => { e.prev = exps.filter((o) => o.row === e.row && o.end <= e.launch).pop() || null; });

  // ---------- small DOM helpers ----------
  function h(tag, attrs, kids) {
    const node = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'text') node.textContent = v;
      else if (k === 'class') node.className = v;
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of [].concat(kids || [])) if (kid != null) node.append(kid);
    return node;
  }
  const NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs || {}) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

  // ---------- a small Markdown reader for the agent's replies (headings, lists, tables, code, bold, links) ----------
  const SAFE_LINK = /^https:\/\/(github\.com\/Interactive-Active-AI\/|interactive-active-ai\.github\.io\/|arxiv\.org\/|(www\.)?alphaxiv\.org\/|neurips\.cc\/|nips\.cc\/|mlanthology\.org\/)/;
  function inline(text, into) {
    const re = /(`[^`\n]+`)|(\*\*[^*\n]+?\*\*)|(\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))|(https?:\/\/[^\s)<>"']+)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      if (m.index > last) into.append(text.slice(last, m.index));
      const tok = m[0];
      if (m[1]) into.append(h('code', { text: tok.slice(1, -1) }));
      else if (m[2]) { const b = h('strong'); inline(tok.slice(2, -2), b); into.append(b); }
      else {
        const label = m[3] ? tok.slice(1, tok.indexOf('](')) : tok.replace(/[.,;:]+$/, '');
        const url = m[3] ? tok.slice(tok.indexOf('](') + 2, -1) : tok.replace(/[.,;:]+$/, '');
        if (SAFE_LINK.test(url)) into.append(h('a', { href: url, rel: 'noopener', text: label }));
        else into.append(label);
        if (!m[3] && tok.length > url.length) into.append(tok.slice(url.length));
      }
      last = m.index + tok.length;
    }
    if (last < text.length) into.append(text.slice(last));
    return into;
  }
  function markdown(text) {
    const out = h('div', { class: 'md' });
    const lines = text.replace(/\r/g, '').split('\n');
    let i = 0, list = null, listIndent = 0;
    const closeList = () => { list = null; };
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        const buf = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
        i++; closeList();
        out.append(h('pre', {}, h('code', { text: buf.join('\n') })));
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const cells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const head = cells(line); i += 2;
        const body = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) body.push(cells(lines[i++]));
        closeList();
        const table = h('table', {}, [
          h('thead', {}, h('tr', {}, head.map((c) => inline(c, h('th'))))),
          h('tbody', {}, body.map((r) => h('tr', {}, r.map((c) => inline(c, h('td')))))),
        ]);
        out.append(h('div', { class: 'md-table' }, table));
        continue;
      }
      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) { closeList(); out.append(inline(heading[2], h('p', { class: 'md-h md-h' + Math.min(4, heading[1].length) }))); i++; continue; }
      const item = /^(\s*)([-*]|\d+[.)])\s+(.*)$/.exec(line);
      if (item) {
        const indent = item[1].length, ordered = /\d/.test(item[2]);
        if (!list || (indent < listIndent && indent === 0)) { list = h(ordered ? 'ol' : 'ul'); listIndent = indent; out.append(list); }
        let target = list;
        if (indent > listIndent && list.lastElementChild) {
          let sub = list.lastElementChild.querySelector(':scope > ul, :scope > ol');
          if (!sub) { sub = h(ordered ? 'ol' : 'ul'); list.lastElementChild.append(sub); }
          target = sub;
        }
        target.append(inline(item[3], h('li')));
        i++; continue;
      }
      if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) { closeList(); out.append(h('hr')); i++; continue; }
      if (!line.trim()) { closeList(); i++; continue; }
      if (list && /^\s{2,}\S/.test(line) && list.lastElementChild) {          // a continuation line of a list item
        const li = [...list.querySelectorAll('li')].pop();
        li.append(' '); inline(line.trim(), li); i++; continue;
      }
      closeList();
      const buf = [line.trim()]; i++;
      while (i < lines.length && lines[i].trim() && !/^(\s*([-*]|\d+[.)])\s+|#{1,6}\s|\s*```|\s*\|)/.test(lines[i])) buf.push(lines[i++].trim());
      const p = h('p');
      buf.forEach((part, k) => { if (k) p.append(h('br')); inline(part, p); });
      out.append(p);
    }
    return out;
  }

  // ---------- state ----------
  const state = { view: { a: -SPAN * 0.012, b: SPAN * 1.012 }, sel: null, filter: 'all', phase: null };
  const FULL = { a: -SPAN * 0.012, b: SPAN * 1.012 };
  const MIN_SPAN = 20 * 60;

  // ---------- page skeleton ----------
  const tip = h('div', { class: 'tip trace-tip', role: 'status' });
  document.body.append(tip);
  const chips = h('div', { class: 'tl-phases', role: 'group', 'aria-label': S.all });
  const zoomBox = h('div', { class: 'tl-zoom' });
  const svgHost = h('div', { class: 'tl-plot' });
  const legend = h('div', { class: 'tl-legend' });
  const figure = h('section', { class: 'tl-card' }, [h('div', { class: 'tl-controls' }, [chips, zoomBox]), svgHost, legend]);
  const listBox = h('div', { class: 'steps' });
  const detail = h('div', { class: 'detail', tabindex: '-1' });
  const explorer = h('section', { class: 'explorer' }, [listBox, detail]);
  const tableBox = h('section', { class: 'exp-table' });
  mount.append(figure, explorer, tableBox);

  // ---------- timeline ----------
  const TL = { svg: null, W: 0, geo: null, raf: 0 };
  const x = (t) => TL.geo.left + ((t - state.view.a) / (state.view.b - state.view.a)) * TL.geo.width;
  const tAt = (px) => state.view.a + ((px - TL.geo.left) / TL.geo.width) * (state.view.b - state.view.a);

  function clampView(a, b) {
    let span = Math.min(FULL.b - FULL.a, Math.max(MIN_SPAN, b - a));
    let mid = (a + b) / 2;
    a = mid - span / 2; b = mid + span / 2;
    if (a < FULL.a) { b += FULL.a - a; a = FULL.a; }
    if (b > FULL.b) { a -= b - FULL.b; b = FULL.b; }
    return { a: Math.max(FULL.a, a), b: Math.min(FULL.b, b) };
  }
  let tween = 0;
  function setView(a, b, animate) {
    const to = clampView(a, b);
    cancelAnimationFrame(tween);
    if (!animate || reduced.matches) { state.view = to; drawSoon(); return; }
    const from = { ...state.view }, t0 = performance.now(), ms = 420;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      state.view = { a: from.a + (to.a - from.a) * e, b: from.b + (to.b - from.b) * e };
      draw();
      if (k < 1) tween = requestAnimationFrame(step);
    };
    tween = requestAnimationFrame(step);
  }
  function zoomBy(factor, centerT) {
    const { a, b } = state.view, c = centerT == null ? (a + b) / 2 : centerT;
    setView(c - (c - a) * factor, c + (b - c) * factor, centerT == null);
  }
  function drawSoon() { if (!TL.raf) TL.raf = requestAnimationFrame(() => { TL.raf = 0; draw(); }); }

  // Tick step for the visible span, aligned to the local clock.
  function ticks() {
    const steps = [600, 1800, 3600, 7200, 10800, 21600, 43200, 86400];
    const pxPerSec = TL.geo.width / (state.view.b - state.view.a);
    const step = steps.find((v) => v * pxPerSec >= 64) || 86400;
    const base = START + TZ, first = Math.ceil((base + state.view.a) / step) * step - base;
    const out = [];
    for (let t = first; t <= state.view.b; t += step) out.push(t);
    return { list: out, step };
  }

  function draw() {
    const host = svgHost, W = Math.max(300, Math.floor(host.clientWidth));
    const wide = W >= 720;
    const gut = wide ? 124 : 0, labelRow = wide ? 0 : 15;
    const left = gut + 6, right = W - 10, width = right - left;
    let y = 0;
    const axisY = 15; y = 24;
    const phaseY = y; y += 24 + 8;
    const lane = {};
    for (const [key, hgt] of [['human', 20], ['agent', 26], ['events', 20], ['exps', EXP_ROWS * PITCH + 4]]) {
      y += labelRow;
      lane[key] = { y, h: hgt };
      y += hgt + (wide ? 12 : 8);
    }
    const H = y + 2;
    TL.geo = { left, right, width, W, H, lane, wide };
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': S.aria, class: 'tl-svg' });
    const C = {
      human: css('--c-human'), wake: css('--c-wake'), side: css('--c-side'), ref: css('--c-ref'), cand: css('--c-cand'), final: css('--c-final'),
      web: css('--c-web'), ink: css('--text-primary'), ink2: css('--text-secondary'), muted: css('--text-muted'), grid: css('--grid'), axis: css('--axis'),
      wash: css('--wash'), surface: css('--surface'), mark: css('--neutral-mark'),
    };
    const defs = s('defs', {}, svg);
    const clip = s('clipPath', { id: 'tl-clip' }, defs);
    s('rect', { x: left - 4, y: 0, width: width + 8, height: H }, clip);
    const { a, b } = state.view;
    const vis = (t0, t1) => t1 >= a && t0 <= b;

    // Night shading (midnight to 8 am, local time) and the time axis.
    const g0 = s('g', { 'clip-path': 'url(#tl-clip)' }, svg);
    const dayBase = START + TZ;
    for (let d = Math.floor((dayBase + a) / 86400); d <= Math.floor((dayBase + b) / 86400); d++) {
      const n0 = d * 86400 - dayBase, n1 = n0 + 8 * 3600;
      if (vis(n0, n1)) s('rect', { x: x(n0), y: phaseY + 26, width: Math.max(0, x(n1) - x(n0)), height: H - phaseY - 28, fill: C.wash, opacity: 0.55 }, g0);
    }
    const tk = ticks();
    const dayPx = 86400 * (width / (b - a));
    const shortDay = (t) => { const d = loc(t); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
    let lastLabel = -1e9;
    tk.list.forEach((t) => {
      const midnight = ((START + t + TZ) % 86400 + 86400) % 86400 === 0;
      const px = x(t);
      s('line', { x1: px, x2: px, y1: phaseY - 3, y2: H - 2, stroke: C.grid, 'stroke-width': 1 }, g0);
      const daily = tk.step >= 86400;
      const text = daily || midnight ? (dayPx < 74 ? shortDay(t) : fmtDay(t)) : fmtClock(t);
      const need = text.length * (ZH && /[月日]/.test(text) ? 9 : 6.6) + 10;
      if (px - lastLabel < need && !midnight) return;
      if (px - lastLabel < need * 0.8) return;
      lastLabel = px;
      const label = s('text', { x: px + (daily ? 4 : 0), y: axisY, 'font-size': 11.5, fill: midnight ? C.ink2 : C.muted, 'font-weight': midnight ? 600 : 400,
        'text-anchor': daily ? 'start' : 'middle' }, g0);
      label.textContent = text;
    });

    // Lane labels.
    for (const key of ['human', 'agent', 'events', 'exps']) {
      const ln = lane[key];
      const text = s('text', wide ? { x: gut - 8, y: ln.y + Math.min(ln.h, 24) / 2 + 4, 'text-anchor': 'end' } : { x: left, y: ln.y - 4 }, svg);
      text.setAttribute('font-size', wide ? 12 : 10.5); text.setAttribute('fill', C.muted);
      if (!wide) { text.setAttribute('letter-spacing', '0.6'); }
      text.textContent = S.lanes[key];
      if (wide) s('line', { x1: left - 4, x2: right + 4, y1: ln.y + ln.h + 6, y2: ln.y + ln.h + 6, stroke: C.grid, 'stroke-width': 1 }, svg);
    }

    const g = s('g', { 'clip-path': 'url(#tl-clip)', class: 'tl-marks' }, svg);

    // Phases.
    D.phases.forEach((p) => {
      if (!vis(p.t0, p.t1)) return;
      const x0 = Math.max(x(p.t0), left - 4) + 1, x1 = Math.min(x(p.t1), right + 4) - 1;
      if (x1 - x0 < 2) return;
      const box = s('g', { class: 'tl-phase', 'data-phase': p.id }, g);
      s('rect', { x: x0, y: phaseY, width: x1 - x0, height: 22, rx: 6, fill: css(`--step-${p.step}`), stroke: css(`--step-${p.step}-line`), 'stroke-width': 1 }, box);
      const name = L({ en: p.en, zh: p.zh });
      const room = x1 - x0 - 12;
      if (room > 26) {
        const label = s('text', { x: x0 + 7, y: phaseY + 15, 'font-size': 11.5, fill: C.ink2, 'font-weight': 600 }, box);
        label.textContent = name;
        const approx = name.length * (ZH ? 12 : 6.3);
        if (approx > room) label.textContent = name.slice(0, Math.max(1, Math.floor(room / (ZH ? 12 : 6.3)) - 1)) + '…';
      }
    });

    const selTurn = state.sel && state.sel.type === 'turn' ? turnById.get(state.sel.id) : null;
    const selExp = state.sel && state.sel.type === 'exp' ? expById.get(state.sel.id) : null;
    const related = new Set();
    if (selTurn) [...selTurn.launches, ...selTurn.autoLaunches, ...selTurn.results].forEach((e) => related.add(e.id));

    // The selected turn: a band through every lane.
    if (selTurn && vis(selTurn.t0, selTurn.t1)) {
      const x0 = x(selTurn.t0), w = Math.max(3, x(selTurn.t1) - x0);
      s('rect', { x: x0 - 1.5, y: lane.human.y - 6, width: w + 3, height: H - lane.human.y + 2, fill: css('--sel-band'), rx: 3 }, g);
    }
    if (selExp) {
      [selExp.launch, selExp.end].forEach((t) => { if (vis(t, t)) s('line', { x1: x(t), x2: x(t), y1: lane.human.y - 6, y2: H - 2, stroke: C.final, 'stroke-width': 1, opacity: 0.55 }, g); });
    }

    // Operator input: one dot per message; status questions are smaller.
    turns.forEach((t) => {
      if (t.trig !== 'human' || !vis(t.t0, t.t0)) return;
      const px = x(t.t0), cy = lane.human.y + lane.human.h / 2;
      const side = t.scope === 'side';
      const grp = s('g', { class: 'tl-hit', 'data-turn': t.i }, g);
      s('circle', { cx: px, cy, r: 11, fill: 'transparent' }, grp);
      const r = side ? 2.2 : inputGlyph(grp, t.kind, px, cy, C);
      if (side) s('circle', { cx: px, cy, r, fill: C.side }, grp);
      if (selTurn === t) s('circle', { cx: px, cy, r: r + 3.5, fill: 'none', stroke: C.ink, 'stroke-width': 1.5 }, grp);
    });

    // Agent at work: one bar per turn, and under it the density of its actions.
    const al = lane.agent;
    const pxPerSec = width / (b - a);
    const bins = new Map();
    turns.forEach((t) => {
      if (!vis(t.t0, t.t1)) return;
      const x0 = x(t.t0), w = Math.max(2, x(t.t1) - x0);
      const side = t.scope === 'side';
      const grp = s('g', { class: 'tl-hit', 'data-turn': t.i }, g);
      s('rect', { x: x0 - 3, y: al.y - 3, width: w + 6, height: al.h + 4, fill: 'transparent' }, grp);
      if (!side && t.trig === 'resume') s('rect', { x: x0 + 0.75, y: al.y + 0.75, width: Math.max(1.5, w - 1.5), height: 7.5, rx: 1.6, fill: C.surface, stroke: C.human, 'stroke-width': 1.5 }, grp);
      else s('rect', { x: x0, y: al.y, width: w, height: 9, rx: 2, fill: side ? C.side : t.trig === 'human' ? C.human : C.wake, opacity: side ? 0.55 : 1 }, grp);
      if (selTurn === t) s('rect', { x: x0 - 2, y: al.y - 2, width: w + 4, height: 13, rx: 3.5, fill: 'none', stroke: C.ink, 'stroke-width': 1.5 }, grp);
      if (side || !t.stream) return;
      t.stream.forEach((row) => {
        if (row[1] === 'note' || row[0] < a || row[0] > b) return;
        const key = Math.round(x(row[0]) / 2);
        bins.set(key, (bins.get(key) || 0) + 1);
      });
    });
    bins.forEach((count, key) => {
      const hgt = Math.min(11, 2 + count * (pxPerSec > 0.02 ? 2 : 1));
      s('rect', { x: key * 2 - 0.75, y: al.y + 13, width: 1.5, height: hgt, fill: C.mark, opacity: 0.5 }, g);
    });

    // Key events.
    const el = lane.events, ey = el.y + el.h / 2;
    events.forEach((ev) => {
      if (!vis(ev.t, ev.t) || ev.kind === 'session') return;
      const px = x(ev.t);
      const grp = s('g', { class: 'tl-hit', 'data-event': events.indexOf(ev) }, g);
      if (ev.turn != null) grp.setAttribute('data-turn', ev.turn);
      s('circle', { cx: px, cy: ey, r: 11, fill: 'transparent' }, grp);
      glyph(grp, ev.kind, px, ey, C);
    });

    // Threads between the agent's turns and its experiments: down at a launch, back up when the result reaches the agent.
    const xl = lane.exps;
    const threads = s('g', { class: 'tl-threads', fill: 'none' }, g);
    exps.forEach((e) => {
      const cy = xl.y + 5 + e.row * PITCH, base = al.y + 10;
      const lt = turnById.get(e.launchTurn), st = turnById.get(e.seenTurn);
      const strong = (selTurn && related.has(e.id)) || selExp === e;
      const style = { stroke: strong ? C.ink : C.mark, 'stroke-width': strong ? 1 : 0.8, opacity: strong ? 0.6 : 0.2 };
      if (lt && !e.auto && vis(e.launch, e.launch)) s('path', Object.assign({ d: `M${x(e.launch)},${base}V${cy}` }, style), threads);
      if (st && e.end != null) {
        const back = Math.max(st.t0, e.end);
        if (vis(Math.min(e.end, back), Math.max(e.end, back))) {
          const x0 = x(e.end) + 1, x1 = x(back);
          s('path', Object.assign({ d: x1 - x0 < 2 ? `M${x0},${cy}V${base}` : `M${x0},${cy}C${x0},${(cy + base) / 2} ${x1},${(cy + base) / 2} ${x1},${base}` }, style), threads);
        }
      }
    });

    // Experiments.
    const showEvals = pxPerSec * 3600 >= 44, labelRuns = pxPerSec * 3600 >= 24;
    exps.forEach((e) => {
      if (!vis(e.launch, e.end)) return;
      const cy = xl.y + 5 + e.row * PITCH;
      const color = e.final ? C.final : (e.group === 'r1' || e.group === 'r2' || e.group === 'r3') ? C.cand : C.ref;
      const dim = (related.size && !related.has(e.id)) || (selExp && selExp !== e);
      const grp = s('g', { class: 'tl-hit tl-exp', 'data-exp': e.id, opacity: dim ? 0.38 : 1 }, g);
      s('rect', { x: x(e.launch) - 3, y: cy - 4.5, width: Math.max(8, x(e.end) - x(e.launch)) + 6, height: 9, fill: 'transparent' }, grp);
      e.segs.forEach((seg) => {
        const [c0, st, en] = seg;
        const waitEnd = st == null ? en : st;
        s('line', { x1: x(c0), x2: x(waitEnd), y1: cy, y2: cy, stroke: C.axis, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, grp);
        if (st != null) s('rect', { x: x(st), y: cy - 3, width: Math.max(2, x(en) - x(st)), height: 6, rx: 2, fill: color }, grp);
      });
      s('circle', { cx: x(e.launch), cy, r: 1.8, fill: C.mark }, grp);
      const ex = x(e.end);
      if (e.status === 'failed') cross(grp, ex + 5, cy, C.ink);
      else if (e.status === 'cancelled') s('circle', { cx: ex + 4.5, cy, r: 2.6, fill: C.surface, stroke: C.mark, 'stroke-width': 1.3 }, grp);
      if (showEvals && e.evals) e.evals.forEach((ev) => { if (ev[1] > 0 && vis(ev[0], ev[0])) s('rect', { x: x(ev[0]) - 0.6, y: cy - 3, width: 1.2, height: 6, fill: C.surface }, grp); });
      if (selExp === e) s('rect', { x: x(e.launch) - 3, y: cy - 5.5, width: Math.max(8, x(e.end) - x(e.launch)) + 6 + (e.status === 'succeeded' || e.status === 'segment' ? 0 : 8), height: 11, rx: 4, fill: 'none', stroke: C.ink, 'stroke-width': 1.3 }, grp);
      // Direct labels. The two segments of the full run are always named; other runs are named once the view is close
      // enough, to the left of their launch point in their own row (or after their end when there is no room there).
      if (e.id === 'formal-1') {
        const x0 = Math.max(x(e.segs[0][1]), left) + 6, room = Math.min(x(e.end), right) - x0;
        const full = `${expName(e)} · ${L(D.scales.L)}`, wide = (t) => t.length * (/[\u3400-\u9fff]/.test(t) ? 8.5 : 5.6);
        const text = wide(full) <= room ? full : wide(expName(e)) <= room ? expName(e) : '';
        if (text) { const lab = s('text', { x: x0, y: cy - 6, 'font-size': 10.5, fill: C.ink2 }, grp); lab.textContent = text; }
      } else if (labelRuns && e.scale !== 'L') {
        const name = expName(e), wName = name.length * (/[\u3400-\u9fff]/.test(name) ? 10 : 5.4) + 4;
        const floor = Math.max(left, e.prev ? x(e.prev.end) + 12 : left);
        const xr = x(e.launch) - 6;
        const next = exps.find((o) => o.row === e.row && o.launch >= e.end);
        if (xr - wName >= floor) { const lab = s('text', { x: xr, y: cy + 3.5, 'font-size': 10, 'text-anchor': 'end', fill: C.muted }, grp); lab.textContent = name; }
        else if (x(e.end) + 12 + wName <= Math.min(right, next ? x(next.launch) - 8 : right)) { const lab = s('text', { x: x(e.end) + 11, y: cy + 3.5, 'font-size': 10, fill: C.muted }, grp); lab.textContent = name; }
      }
    });

    // Crosshair (drawn on pointer move).
    TL.cross = s('g', { class: 'tl-cross', visibility: 'hidden' }, svg);
    s('line', { y1: phaseY - 3, y2: H - 2, stroke: C.mark, 'stroke-width': 1, opacity: 0.7 }, TL.cross);
    const tag = s('g', {}, TL.cross);
    s('rect', { y: 2, height: 17, rx: 5, fill: C.ink }, tag);
    s('text', { y: 14.5, 'font-size': 11, fill: C.surface, 'text-anchor': 'middle', 'font-weight': 600 }, tag);

    if (TL.svg) TL.svg.replaceWith(svg); else host.append(svg);
    TL.svg = svg;
    chips.querySelectorAll('button').forEach((btn) => btn.classList.toggle('is-on', (btn.dataset.phase || null) === state.phase));
  }

  // An operator input: an approval is a filled circle with a check, any other input is a ring. Returns the radius.
  function inputGlyph(parent, kind, cx, cy, C) {
    if (kind === 'approve') {
      s('circle', { cx, cy, r: 6.5, fill: C.human }, parent);
      s('path', { d: `M${cx - 3},${cy + 0.3}L${cx - 0.9},${cy + 2.5}L${cx + 3.1},${cy - 2.3}`, fill: 'none', stroke: C.surface, 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
      return 6.5;
    }
    s('circle', { cx, cy, r: 4.4, fill: C.surface, stroke: C.human, 'stroke-width': 2 }, parent);
    return 5.4;
  }
  // The mark of a turn by what started it; used in the list and the legend.
  function searchMark() {
    const svg = s('svg', { viewBox: '0 0 16 16', width: 16, height: 16, class: 'step-mark', 'aria-hidden': 'true' });
    glyph(svg, 'web', 8, 8, { web: css('--c-web'), surface: css('--surface') });
    return svg;
  }
  function turnMark(trig, kind) {
    const C = { human: css('--c-human'), wake: css('--c-wake'), surface: css('--surface') };
    const svg = s('svg', { viewBox: '0 0 16 16', width: 16, height: 16, class: 'step-mark', 'aria-hidden': 'true' });
    if (trig === 'human') inputGlyph(svg, kind, 8, 8, C);
    else if (trig === 'resume') s('rect', { x: 3, y: 4, width: 10, height: 8, rx: 2, fill: C.surface, stroke: C.human, 'stroke-width': 1.6 }, svg);
    else s('rect', { x: 3, y: 4, width: 10, height: 8, rx: 2, fill: C.wake }, svg);
    return svg;
  }
  function cross(parent, cx, cy, color) {
    s('path', { d: `M${cx - 2.6},${cy - 2.6}L${cx + 2.6},${cy + 2.6}M${cx + 2.6},${cy - 2.6}L${cx - 2.6},${cy + 2.6}`, stroke: color, 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }, parent);
  }
  function glyph(parent, kind, cx, cy, C) {
    if (kind === 'web') s('path', { d: `M${cx},${cy - 6}L${cx + 6},${cy}L${cx},${cy + 6}L${cx - 6},${cy}Z`, fill: C.web, stroke: C.surface, 'stroke-width': 1.2 }, parent);
    else if (kind === 'review') s('rect', { x: cx - 4, y: cy - 4, width: 8, height: 8, rx: 1.5, fill: C.surface, stroke: C.mark, 'stroke-width': 1.6 }, parent);
    else if (kind === 'ask') {
      s('circle', { cx, cy, r: 6, fill: C.human, stroke: C.surface, 'stroke-width': 1.2 }, parent);
      const q = s('text', { x: cx, y: cy + 3.6, 'font-size': 10, 'font-weight': 700, 'text-anchor': 'middle', fill: C.surface }, parent); q.textContent = '?';
    } else if (kind === 'compact') s('path', { d: `M${cx - 1.8},${cy - 4}V${cy + 4}M${cx + 1.8},${cy - 4}V${cy + 4}`, stroke: C.muted, 'stroke-width': 1.3, 'stroke-linecap': 'round', opacity: 0.75 }, parent);
  }

  // ---------- tooltips ----------
  function tipRows(title, rows) {
    tip.replaceChildren(h('div', { class: 'tip-title', text: title }));
    rows.forEach(([label, value]) => tip.append(h('div', { class: 'tip-row' }, [h('span', { text: label }), value != null ? h('b', { text: value }) : null])));
  }
  function showTip(evt) {
    tip.classList.add('is-on');
    const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight;
    let px = evt.clientX + pad, py = evt.clientY + pad;
    if (px + w > window.innerWidth - 8) px = evt.clientX - w - pad;
    if (py + hh > window.innerHeight - 8) py = evt.clientY - hh - pad;
    tip.style.left = Math.max(8, px) + 'px'; tip.style.top = Math.max(8, py) + 'px';
  }
  const hideTip = () => tip.classList.remove('is-on');
  const turnLine = (t) => (t.scope === 'side' ? `${S.sideTitle}: ${L(D.sides[t.side])}` : t.trig === 'human' ? t.in : t.trig === 'resume' ? S.resumeLine : t.watch || S.watchFired);
  const turnTitle = (t) => (t.title ? L(t.title) : t.gist || '');
  const clip = (text, n) => { text = (text || '').replace(/\s+/g, ' ').trim(); return text.length > n ? text.slice(0, n - 1) + '…' : text; };
  // What is under the pointer. Dots and glyphs sit close together, so in those lanes the nearest mark in time wins,
  // whichever element happens to be drawn on top.
  function hitAt(clientX, clientY, node) {
    const box = svgHost.getBoundingClientRect(), px = clientX - box.left, py = clientY - box.top, { lane } = TL.geo;
    const inLane = (ln, padTop, padBottom) => py >= ln.y - padTop && py <= ln.y + ln.h + padBottom;
    if (px < TL.geo.left - 6 || px > TL.geo.right + 6) return null;
    if (inLane(lane.human, 6, 4)) {
      let best = null, bd = 13;
      turns.forEach((t) => { if (t.trig !== 'human') return; const d = Math.abs(x(t.t0) - px) - (t.scope === 'side' ? -4 : t.kind === 'approve' ? 3 : 2); if (d < bd) { bd = d; best = t; } });
      return best ? { turn: best.i } : null;
    }
    if (inLane(lane.agent, 4, 2)) {
      let best = null, bd = 7;
      turns.forEach((t) => {
        const x0 = x(t.t0), x1 = Math.max(x0 + 2, x(t.t1));
        const d = px < x0 ? x0 - px : px > x1 ? px - x1 : -1 / (1 + x1 - x0);      // inside a bar: the shortest bar wins
        if (d < bd) { bd = d; best = t; }
      });
      return best ? { turn: best.i } : null;
    }
    if (inLane(lane.events, 4, 4)) {
      let best = null, bd = 12;
      const bonus = { web: 4, ask: 3, review: 1, compact: 0 };
      events.forEach((ev, k) => { if (ev.kind === 'session') return; const d = Math.abs(x(ev.t) - px) - bonus[ev.kind]; if (d < bd) { bd = d; best = k; } });
      return best == null ? null : { event: best, turn: events[best].turn };
    }
    const hit = node && node.closest ? node.closest('.tl-exp, .tl-phase') : null;
    if (hit && hit.dataset.exp) return { exp: hit.dataset.exp };
    if (hit && hit.dataset.phase) return { phase: hit.dataset.phase };
    return null;
  }
  function describeTarget(hit) {
    if (!hit) return null;
    hit = { dataset: hit };
    if (hit.dataset.exp) {
      const e = expById.get(hit.dataset.exp);
      const rows = [[`${expGroup(e)} · ${L(D.scales[e.scale])}`, null], [S.exp.launched, fmtStamp(e.launch)]];
      if (e.ran) rows.push([S.exp.waited, fmtDur(e.wait)], [S.exp.ran, fmtDur(e.ran)]);
      rows.push([S.exp.ended, fmtStamp(e.end)]);
      if (e.bpb != null) rows.push([S.exp.devBpb, num(e.bpb, 4)]);
      else if (e.result) rows.push([S.exp.core, num(e.result.core, 2)]);
      else rows.push([S.exp.result, S.exp.status[e.status]]);
      return () => tipRows(expName(e), rows);
    }
    if (hit.dataset.event != null) {
      const ev = events[+hit.dataset.event];
      const title = S.legend[ev.kind];
      const rows = [[fmtStamp(ev.t), null]];
      if (ev.kind === 'web') rows.push([clip(ev.query, 60), null]);
      if (ev.kind === 'review' && ev.title) rows.push([clip(ev.title, 70), null]);
      if (ev.kind === 'ask') rows.push([clip(ev.questions[0].q, 90), null]);
      return () => tipRows(title, rows);
    }
    if (hit.dataset.turn != null) {
      const t = turnById.get(+hit.dataset.turn);
      const head = `${fmtStamp(t.t0)} · ${t.scope === 'side' ? S.sideTitle : t.trig === 'human' ? S.trigHuman : t.trig === 'resume' ? S.trigResume : S.trigWake}`;
      const rows = [[clip(turnLine(t), 90), null]];
      if (t.scope !== 'side' && turnTitle(t)) rows.push(['→ ' + clip(turnTitle(t), 110), null]);
      rows.push([S.worked, `${fmtDur(t.t1 - t.t0)} · ${S.actions(t.n)}`]);
      return () => tipRows(head, rows);
    }
    if (hit.dataset.phase) {
      const p = phaseById.get(hit.dataset.phase);
      return () => tipRows(L({ en: p.long_en, zh: p.long_zh }), [[`${fmtStamp(p.t0)} – ${fmtStamp(p.t1)}`, null], [ZH ? '时长' : 'Length', fmtDur(p.t1 - p.t0)]]);
    }
    return null;
  }

  // ---------- pointer: hover, drag to pan, pinch and wheel to zoom ----------
  const pointers = new Map();
  let drag = null, pinch = null;
  svgHost.addEventListener('pointerdown', (e) => {
    if (e.button && e.pointerType === 'mouse') return;
    pointers.set(e.pointerId, e.clientX);
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, a: state.view.a, b: state.view.b, moved: false, id: e.pointerId };
    else if (pointers.size === 2) { const xs = [...pointers.values()]; pinch = { d: Math.abs(xs[0] - xs[1]) || 1, a: state.view.a, b: state.view.b, mid: tAt((xs[0] + xs[1]) / 2 - svgHost.getBoundingClientRect().left) }; drag = null; }
  });
  svgHost.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, e.clientX);
    if (pinch && pointers.size === 2) {
      const xs = [...pointers.values()], d = Math.abs(xs[0] - xs[1]) || 1, f = pinch.d / d;
      setView(pinch.mid - (pinch.mid - pinch.a) * f, pinch.mid + (pinch.b - pinch.mid) * f);
      return;
    }
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) { drag.moved = true; svgHost.setPointerCapture(e.pointerId); svgHost.classList.add('is-dragging'); hideTip(); }
      if (drag.moved) { const dt = (dx / TL.geo.width) * (drag.b - drag.a); setView(drag.a - dt, drag.b - dt); return; }
    }
    if (e.pointerType === 'touch') return;
    const box = svgHost.getBoundingClientRect(), px = e.clientX - box.left;
    if (TL.cross && px >= TL.geo.left - 4 && px <= TL.geo.right + 4) {
      TL.cross.setAttribute('visibility', 'visible');
      const line = TL.cross.firstChild, tag = TL.cross.lastChild, t = tAt(px);
      line.setAttribute('x1', px); line.setAttribute('x2', px);
      const label = `${fmtDay(t)} ${fmtClock(t)}`, w = label.length * 6.4 + 14;
      const cx = Math.min(Math.max(px, TL.geo.left + w / 2 - 4), TL.geo.right - w / 2 + 4);
      tag.firstChild.setAttribute('x', cx - w / 2); tag.firstChild.setAttribute('width', w);
      tag.lastChild.setAttribute('x', cx); tag.lastChild.textContent = label;
    } else if (TL.cross) TL.cross.setAttribute('visibility', 'hidden');
    const found = hitAt(e.clientX, e.clientY, e.target);
    const fill = describeTarget(found);
    svgHost.style.cursor = found ? 'pointer' : '';
    if (fill) { fill(); showTip(e); } else hideTip();
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (drag && drag.id === e.pointerId) {
      const moved = drag.moved; drag = null; svgHost.classList.remove('is-dragging');
      if (!moved && e.type === 'pointerup') {
        const hit = hitAt(e.clientX, e.clientY, document.elementFromPoint(e.clientX, e.clientY));
        if (hit && hit.exp) select({ type: 'exp', id: hit.exp }, { from: 'timeline' });
        else if (hit && hit.event != null && events[hit.event].kind === 'web') select({ type: 'search', id: hit.event }, { from: 'timeline' });
        else if (hit && hit.turn != null) select({ type: 'turn', id: hit.turn, event: hit.event != null ? hit.event : null }, { from: 'timeline' });
        else if (hit && hit.phase) gotoPhase(hit.phase);
      }
    }
  };
  svgHost.addEventListener('pointerup', endPointer);
  svgHost.addEventListener('pointercancel', endPointer);
  svgHost.addEventListener('pointerleave', () => { hideTip(); if (TL.cross) TL.cross.setAttribute('visibility', 'hidden'); });
  svgHost.addEventListener('dblclick', (e) => { const box = svgHost.getBoundingClientRect(); zoomBy(0.45, tAt(e.clientX - box.left)); });
  svgHost.addEventListener('wheel', (e) => {
    const box = svgHost.getBoundingClientRect();
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomBy(Math.exp(e.deltaY * 0.01), tAt(e.clientX - box.left)); }
    else if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 1.2) { e.preventDefault(); const dt = (e.deltaX / TL.geo.width) * (state.view.b - state.view.a); setView(state.view.a + dt, state.view.b + dt); }
  }, { passive: false });

  // ---------- controls and legend ----------
  function gotoPhase(id) {
    state.phase = id;
    if (!id) { setView(FULL.a, FULL.b, true); renderList(); return; }
    const p = phaseById.get(id), m = Math.max(900, (p.t1 - p.t0) * 0.04);
    setView(p.t0 - m, p.t1 + m, true);
    renderList();
    const head = listBox.querySelector(`[data-phase-head="${id}"]`);
    if (head) scrollWithin(listScroll(), head, 0);
  }
  chips.append(h('button', { type: 'button', class: 'chip', text: S.all, onclick: () => gotoPhase(null) }));
  D.phases.forEach((p) => chips.append(h('button', { type: 'button', class: `chip step-${p.step}`, 'data-phase': p.id, text: L({ en: p.en, zh: p.zh }), title: L({ en: p.long_en, zh: p.long_zh }), onclick: () => gotoPhase(p.id) })));
  const icon = (path) => { const svg = s('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true' }); s('path', { d: path, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg); return svg; };
  zoomBox.append(
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': S.zoomOut, title: S.zoomOut, onclick: () => zoomBy(1.8) }, icon('M3.5 8h9')),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': S.zoomIn, title: S.zoomIn, onclick: () => zoomBy(1 / 1.8) }, icon('M3.5 8h9M8 3.5v9')),
    h('button', { type: 'button', class: 'icon-btn', 'aria-label': S.replay, title: S.replay, onclick: () => replay() }, icon('M3 8a5 5 0 1 0 1.6-3.7M3 2.6v2.9h2.9')),
  );
  function legendItem(draw, label) {
    const svg = s('svg', { viewBox: '0 0 26 14', width: 26, height: 14, 'aria-hidden': 'true' });
    draw(svg);
    return h('span', { class: 'legend-item' }, [svg, h('span', { text: label })]);
  }
  function renderLegend() {
    const C = { human: css('--c-human'), wake: css('--c-wake'), side: css('--c-side'), ref: css('--c-ref'), cand: css('--c-cand'), final: css('--c-final'), web: css('--c-web'),
      ink: css('--text-primary'), muted: css('--text-muted'), axis: css('--axis'), surface: css('--surface'), mark: css('--neutral-mark'), wash: css('--wash') };
    const c = D.meta.counts, nApprove = turns.filter((t) => t.kind === 'approve').length;
    const group = (title, items) => h('div', { class: 'legend-group' }, [h('span', { class: 'legend-title', text: title })].concat(items));
    legend.replaceChildren(
      group(S.lanes.human, [
        legendItem((g) => inputGlyph(g, 'approve', 13, 7, C), `${S.legend.approve} (${nApprove})`),
        legendItem((g) => inputGlyph(g, 'other', 13, 7, C), `${S.legend.otherInput} (${c.human - nApprove})`),
      ]),
      group(S.lanes.agent, [
        legendItem((g) => s('rect', { x: 3, y: 3, width: 20, height: 8, rx: 2, fill: C.human }, g), S.legend.turnHuman),
        legendItem((g) => s('rect', { x: 3.75, y: 3.75, width: 18.5, height: 6.5, rx: 1.6, fill: C.surface, stroke: C.human, 'stroke-width': 1.5 }, g), `${S.legend.turnResume} (${c.resume})`),
        legendItem((g) => s('rect', { x: 3, y: 3, width: 20, height: 8, rx: 2, fill: C.wake }, g), S.legend.turnWake),
        turns.some((t) => t.scope === 'side') ? legendItem((g) => s('rect', { x: 3, y: 3, width: 20, height: 8, rx: 2, fill: C.side, opacity: 0.55 }, g), S.legend.side) : null,
      ]),
      group(S.lanes.events, [
        legendItem((g) => glyph(g, 'web', 13, 7, C), `${S.legend.web} (${c.web})`),
        legendItem((g) => glyph(g, 'review', 13, 7, C), `${S.legend.review} (${c.review})`),
        c.ask ? legendItem((g) => glyph(g, 'ask', 13, 7, C), `${S.legend.ask} (${c.ask})`) : null,
        legendItem((g) => glyph(g, 'compact', 13, 7, C), `${S.legend.compact} (${c.compact})`),
      ]),
      group(S.lanes.exps, [
        legendItem((g) => { s('circle', { cx: 3, cy: 7, r: 1.8, fill: C.mark }, g); s('line', { x1: 3, x2: 12, y1: 7, y2: 7, stroke: C.axis, 'stroke-width': 1.5, 'stroke-linecap': 'round' }, g); s('rect', { x: 12, y: 4, width: 12, height: 6, rx: 2, fill: C.cand }, g); }, S.legend.waitRun),
        legendItem((g) => s('rect', { x: 3, y: 4, width: 20, height: 6, rx: 2, fill: C.ref }, g), S.legend.ref),
        legendItem((g) => s('rect', { x: 3, y: 4, width: 20, height: 6, rx: 2, fill: C.final }, g), S.legend.final),
        legendItem((g) => { cross(g, 8, 7, C.ink); s('circle', { cx: 19, cy: 7, r: 2.6, fill: C.surface, stroke: C.mark, 'stroke-width': 1.3 }, g); }, `${S.legend.failed} / ${S.legend.cancelled}`),
        legendItem((g) => s('path', { d: 'M4,12C4,6 22,8 22,2', fill: 'none', stroke: C.mark, 'stroke-width': 1, opacity: 0.7 }, g), S.legend.thread),
      ]),
      h('p', { class: 'legend-hint', text: `${S.legend.night}${ZH ? '。' : '. '}${S.hint}` }),
    );
  }

  // ---------- entrance and replay: the marks are revealed from left to right ----------
  let playing = 0;
  function replay() {
    if (reduced.matches || !TL.svg) return;
    cancelAnimationFrame(playing);
    const t0 = performance.now(), ms = 2600;
    const frame = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const marks = TL.svg.querySelector('.tl-marks');
      if (marks) marks.style.clipPath = k < 1 ? `inset(0 ${(1 - e) * 100}% 0 0)` : '';
      if (k < 1) playing = requestAnimationFrame(frame);
    };
    playing = requestAnimationFrame(frame);
  }

  // ---------- list of turns ----------
  const filterBar = h('div', { class: 'steps-filter', role: 'group', 'aria-label': S.steps });
  const list = h('ol', { class: 'steps-list' });
  listBox.append(h('div', { class: 'steps-head' }, [h('h2', { text: S.steps }), filterBar]), list);
  const listScroll = () => list;
  function scrollWithin(container, node, offset) {
    if (container.scrollHeight <= container.clientHeight + 4) return;   // the list is not a scroll area (narrow screens)
    const top = node.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: Math.max(0, top - (offset == null ? container.clientHeight / 3 : offset)), behavior: reduced.matches ? 'auto' : 'smooth' });
  }
  const FILTERS = {
    all: () => true, human: (t) => t.trig === 'human', wake: (t) => t.trig === 'wake',
    launch: (t) => t.launches.length + t.autoLaunches.length > 0, result: (t) => t.results.length > 0,
    web: () => false,      // only the search entries themselves
  };
  Object.keys(FILTERS).forEach((key) => {
    const n = key === 'all' ? null : key === 'web' ? searches.length : turns.filter((t) => t.scope === 'path' && FILTERS[key](t)).length;
    filterBar.append(h('button', { type: 'button', class: 'chip small', 'data-filter': key, text: n == null ? S.filters[key] : `${S.filters[key]} ${n}`, onclick: () => { state.filter = key; renderList(); } }));
  });
  function badge(kind, text, title) { return h('span', { class: `badge b-${kind}`, title, text }); }
  function renderList() {
    filterBar.querySelectorAll('button').forEach((b) => b.classList.toggle('is-on', b.dataset.filter === state.filter));
    const keep = FILTERS[state.filter];
    const frag = document.createDocumentFragment();
    let phase = null, sideRun = null;
    const flushSide = () => {
      if (!sideRun) return;
      const { first, last, count, key } = sideRun;
      frag.append(h('li', { class: 'step side' }, [
        h('span', { class: 'step-time' }, [h('b', { text: fmtDay(first.t0) }), h('span', { text: fmtClock(first.t0) })]),
        h('span', { class: 'step-body' }, [h('span', { class: 'step-in', text: `${S.sideTitle} · ${L(D.sides[key])}` }),
          h('span', { class: 'step-out', text: `${S.sideTurns(count)} · ${fmtClock(first.t0)}–${fmtClock(last.t1)}` })]),
      ]));
      sideRun = null;
    };
    turns.forEach((t) => {
      if (t.scope === 'side') {
        if (state.filter !== 'all') return;
        if (sideRun && sideRun.key === t.side) { sideRun.last = t; sideRun.count++; } else { flushSide(); sideRun = { first: t, last: t, count: 1, key: t.side }; }
        return;
      }
      const found = state.filter === 'all' || state.filter === 'web' ? searches.filter((x) => x.ev.turn === t.i) : [];
      if (!keep(t) && !found.length) return;
      flushSide();
      if (t.phase !== phase) {
        phase = t.phase;
        const p = phaseById.get(phase);
        if (p) frag.append(h('li', { class: `step-phase step-${p.step}`, 'data-phase-head': p.id }, [h('span', { text: L({ en: p.long_en, zh: p.long_zh }) }), h('span', { class: 'when', text: `${fmtDay(p.t0)} – ${fmtDay(p.t1)}` })]));
      }
      const badges = [];
      const nl = t.launches.length + t.autoLaunches.length;
      if (nl) badges.push(badge('launch', `▲ ${nl}`, `${S.launched}: ${nl}`));
      if (t.results.length) badges.push(badge('result', `■ ${t.results.length}`, `${S.resultIn}: ${t.results.length}`));
      if (t.marks.has('web')) badges.push(badge('web', '◆', S.legend.web));
      if (t.marks.has('review')) badges.push(badge('review', '□', S.legend.review));
      if (t.marks.has('ask')) badges.push(badge('ask', '?', S.legend.ask));
      const btn = h('button', { type: 'button', class: 'step-btn', onclick: () => select({ type: 'turn', id: t.i }, { from: 'list' }) }, [
        h('span', { class: 'step-time' }, [h('b', { text: fmtDay(t.t0) }), h('span', { text: fmtClock(t.t0) })]),
        turnMark(t.trig, t.kind),
        h('span', { class: 'step-body' }, [
          h('span', { class: 'step-in' }, [h('span', { class: 'who', text: S.who[t.trig] }), clip(turnLine(t), 150)]),
          h('span', { class: 'step-out', text: turnTitle(t) ? '→ ' + clip(turnTitle(t), 170) : '→ ' + S.noReply }),
          badges.length ? h('span', { class: 'step-badges' }, badges) : null,
        ]),
      ]);
      if (keep(t)) frag.append(h('li', { class: 'step', 'data-turn': t.i }, btn));
      // A web search is an entry of its own, right under the turn it happened in: what was asked and what came back.
      found.forEach(({ ev, k }) => {
        const first = ev.hits && ev.hits[0] ? ev.hits[0].title : '';
        frag.append(h('li', { class: 'step search', 'data-search': k }, h('button', { type: 'button', class: 'step-btn', onclick: () => select({ type: 'search', id: k }, { from: 'list' }) }, [
          h('span', { class: 'step-time' }, [h('b', { text: fmtDay(ev.t) }), h('span', { text: fmtClock(ev.t) })]),
          searchMark(),
          h('span', { class: 'step-body' }, [
            h('span', { class: 'step-in' }, [h('span', { class: 'who', text: S.who.web }), clip(ev.query, 150)]),
            h('span', { class: 'step-out', text: `→ ${S.webLinks(ev.hits.length)}${first ? ': ' + clip(first, 110) : ''}` }),
          ]),
        ])));
      });
    });
    flushSide();
    list.replaceChildren(frag);
    markSelected();
  }
  function markSelected() {
    list.querySelectorAll('.step.is-sel').forEach((n) => n.classList.remove('is-sel'));
    if (state.sel && state.sel.type === 'turn') { const li = list.querySelector(`[data-turn="${state.sel.id}"]`); if (li) li.classList.add('is-sel'); }
    if (state.sel && state.sel.type === 'search') { const li = list.querySelector(`[data-search="${state.sel.id}"]`); if (li) li.classList.add('is-sel'); }
    tableBox.querySelectorAll('tr.is-sel').forEach((n) => n.classList.remove('is-sel'));
    if (state.sel && state.sel.type === 'exp') { const tr = tableBox.querySelector(`tr[data-exp="${state.sel.id}"]`); if (tr) tr.classList.add('is-sel'); }
  }

  // ---------- detail ----------
  const expLink = (e, text) => h('button', { type: 'button', class: 'link-btn', text: text || expName(e), onclick: () => select({ type: 'exp', id: e.id }, { from: 'detail' }) });
  const turnLink = (i, text) => h('button', { type: 'button', class: 'link-btn', text, onclick: () => select({ type: 'turn', id: i }, { from: 'detail' }) });
  function expResult(e) {
    if (e.bpb != null) return `${S.exp.devBpb} ${num(e.bpb, 4)}`;
    if (e.result) return `${S.exp.core} ${num(e.result.core, 2)} · ${S.exp.valBpb} ${num(e.result.val_bpb, 4)}`;
    return S.exp.status[e.status];
  }
  function section(label, kids, cls) { return h('section', { class: 'd-sec ' + (cls || '') }, [h('h3', { class: 'd-label', text: label })].concat(kids)); }

  function renderTurn(t, focusEvent) {
    const p = phaseById.get(t.phase);
    const head = h('header', { class: 'd-head' }, [
      h('p', { class: 'eyebrow', text: `${p ? L({ en: p.long_en, zh: p.long_zh }) : ''}` }),
      t.scope !== 'side' && turnTitle(t) ? h('h3', { class: 'd-title', text: turnTitle(t) }) : null,
      h('p', { class: 'd-when' }, [h('b', { text: `${S.day(dayNo(t.t0))} · ${fmtStamp(t.t0)}` }), h('span', { text: ` · ${S.worked} ${fmtDur(t.t1 - t.t0)} · ${S.actions(t.n)}` }),
        t.compact ? h('span', { class: 'd-flag', text: ' · ' + S.compacted }) : null]),
    ]);
    const kids = [head];
    if (t.scope === 'side') {
      kids.push(section(S.sideTitle, [h('p', { class: 'd-side', text: `${L(D.sides[t.side])}. ${S.sideNote}` })]));
      return kids;
    }
    // Input.
    if (t.trig === 'human') {
      // The operator's messages are shown in English: the opening brief in full, later ones as short summaries.
      const how = t.kind === 'brief' ? S.inputTranslated : S.inputSummarized;
      const box = h('div', { class: 'bubble human', lang: 'en' }, [h('p', { class: 'bubble-who', lang: ZH ? 'zh-CN' : 'en', text: S.trigHuman + (how ? ' · ' + how : '') }), markdownPlain(t.in)]);
      kids.push(section(S.input, [box]));
    } else if (t.trig === 'resume') {
      kids.push(section(S.input, [h('div', { class: 'bubble resume' }, [h('p', { class: 'bubble-who', text: S.trigResume }), h('p', { class: 'bubble-orig plain', text: S.resumeNote })])]));
    } else {
      kids.push(section(S.input, [h('div', { class: 'bubble wake' }, [h('p', { class: 'bubble-who', text: S.watchFired }),
        t.watch ? h('p', { class: 'watch-name', text: t.watch }) : null, t.watch ? h('p', { class: 'bubble-orig', text: S.watchNote }) : null])]));
    }
    // Results that reached the agent in this turn.
    if (t.results.length) {
      kids.push(section(`${S.resultIn} (${t.results.length})`, [h('ul', { class: 'exp-list' }, t.results.map((e) => h('li', {}, [
        h('span', { class: 'badge b-result', text: '■' }), expLink(e), h('span', { class: 'meta', text: ` · ${S.finished} ${fmtStamp(e.end)} · ${expResult(e)}` }),
      ])))], 'results'));
    }
    // The stream of actions and notes, with launches placed at their time.
    const rows = (t.stream || []).map((r) => ({ t: r[0], cat: r[1], text: r[2], took: r[3] }));
    t.launches.forEach((e) => rows.push({ t: e.launch, cat: 'launch', exp: e }));
    rows.sort((a, b) => a.t - b.t);
    if (rows.length) {
      const ol = h('ol', { class: 'stream' });
      rows.forEach((r) => {
        const time = h('time', { text: fmtClock(r.t, true) });
        if (r.cat === 'launch') {
          ol.append(h('li', { class: 'row launch' }, [time, h('span', { class: 'tag t-launch', text: '▲ ' + S.launched }), h('span', { class: 'what' }, [expLink(r.exp), h('span', { class: 'meta', text: ` · ${expGroup(r.exp)} · ${L(D.scales[r.exp.scale])}` })])]));
        } else if (r.cat === 'note') {
          ol.append(h('li', { class: 'row note' }, [time, h('span', { class: 'tag t-note', text: S.cats.note }), h('div', { class: 'what', lang: 'en' }, markdown(r.text))]));
        } else {
          const what = h('span', { class: 'what', text: r.text });
          if (r.took >= 90) what.append(h('span', { class: 'meta', text: ` · ${fmtDur(r.took)}` }));
          const li = h('li', { class: `row c-${r.cat}` }, [time, h('span', { class: `tag t-${r.cat}`, text: S.cats[r.cat] || r.cat }), what]);
          ol.append(li);
          const ev = events.find((v) => v.turn === t.i && v.t === r.t && v.kind === r.cat);
          if (ev && ev.kind === 'web') {
            li.classList.add('special');
            what.append(' ', h('button', { type: 'button', class: 'link-btn', text: S.webOpen, onclick: () => select({ type: 'search', id: events.indexOf(ev) }, { from: 'detail' }) }));
          }
          if (r.cat === 'review') li.classList.add('special');
        }
      });
      kids.push(section(`${S.stream} (${rows.length})`, [ol, t.hidden ? h('p', { class: 'stream-note', text: S.hiddenActs(t.hidden) }) : null], 'stream-sec'));
    }
    if (t.autoLaunches.length) {
      kids.push(section(S.launchedAuto, [h('ul', { class: 'exp-list' }, t.autoLaunches.map((e) => h('li', {}, [h('span', { class: 'badge b-launch', text: '▲' }), expLink(e), h('span', { class: 'meta', text: ` · ${fmtStamp(e.launch)} · ${L(D.scales[e.scale])}` })])))]));
    }
    // Output.
    kids.push(section(S.output + (t.tr ? ' · ' + S.inputTranslated : ''), [t.out ? h('div', { class: 'bubble agent', lang: 'en' }, markdown(t.out)) : h('p', { class: 'd-side', text: S.noReply })], 'out-sec'));
    return kids;
  }
  function markdownPlain(text) {
    const box = h('div', { class: 'md' });
    text.split(/\n{2,}/).forEach((par) => { const p = h('p'); par.split('\n').forEach((line, k) => { if (k) p.append(h('br')); p.append(line); }); box.append(p); });
    return box;
  }

  function sparkline(e) {
    const pts = e.evals.filter((v) => v[1] > 0);
    if (pts.length < 2) return null;
    const W = 320, H = 96, l = 44, r = 12, tp = 10, bt = 22;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'spark', role: 'img', 'aria-label': S.exp.evals });
    const xs = pts.map((p) => p[1]), ys = pts.map((p) => p[2]);
    const x0 = 0, x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const px = (v) => l + ((v - x0) / (x1 - x0 || 1)) * (W - l - r), py = (v) => tp + (1 - (v - y0) / (y1 - y0 || 1)) * (H - tp - bt);
    const ink = css('--text-muted'), line = e.final ? css('--c-final') : css('--c-cand');
    s('line', { x1: l, x2: W - r, y1: H - bt, y2: H - bt, stroke: css('--axis'), 'stroke-width': 1 }, svg);
    [[y1, py(y1)], [y0, py(y0)]].forEach(([v, yy]) => { const t = s('text', { x: l - 6, y: yy + 4, 'font-size': 10.5, 'text-anchor': 'end', fill: ink }, svg); t.textContent = num(v, 3); });
    [xs[0], x1].forEach((v, k) => { const t = s('text', { x: px(v), y: H - 7, 'font-size': 10.5, 'text-anchor': k ? 'end' : 'start', fill: ink }, svg); t.textContent = v.toLocaleString('en-US'); });
    s('path', { d: pts.map((p, k) => `${k ? 'L' : 'M'}${px(p[1]).toFixed(1)},${py(p[2]).toFixed(1)}`).join(''), fill: 'none', stroke: line, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    pts.forEach((p) => s('circle', { cx: px(p[1]), cy: py(p[2]), r: 2.6, fill: line, stroke: css('--surface'), 'stroke-width': 1.2 }, svg));
    return svg;
  }
  function renderExp(e) {
    const kids = [h('header', { class: 'd-head' }, [
      h('p', { class: 'eyebrow', text: `${S.exp.title} · ${expGroup(e)}` }),
      h('h3', { class: 'd-title' }, [expName(e), h('code', { text: e.method })]),
      h('p', { class: 'd-when', text: `${L(D.scales[e.scale])} · ${e.gpus} ${S.exp.gpus}` }),
    ])];
    if (e.note) kids.push(h('p', { class: 'd-note', text: L(e.note) }));
    if (e.hyp) kids.push(section(S.exp.hyp, [h('p', { class: 'hyp', text: e.hyp.charAt(0).toUpperCase() + e.hyp.slice(1) })]));
    const facts = h('dl', { class: 'facts' });
    const fact = (k, v) => { if (v != null && v !== '') facts.append(h('dt', { text: k }), h('dd', {}, v)); };
    if (e.parent) fact(S.exp.parent, (D.exps.find((o) => o.method === e.parent) ? L(D.exps.find((o) => o.method === e.parent).name) : e.parent));
    if (e.lineage) fact(S.exp.lineage, e.lineage.replace(/^Lineage:\s*/, ''));
    fact(S.exp.launched, fmtStamp(e.launch) + (e.auto ? ` (${S.launchedAuto})` : ''));
    const firstStart = e.segs.find((sg) => sg[1] != null);
    fact(S.exp.started, firstStart ? `${fmtStamp(firstStart[1])} · ${S.exp.waited} ${fmtDur(e.wait)}` : S.exp.neverRan);
    fact(S.exp.ended, `${fmtStamp(e.end)}${e.ran ? ` · ${S.exp.ran} ${fmtDur(e.ran)}` : ''}${e.segs.length > 1 ? ` · ${S.exp.segments(e.segs.length)}` : ''}`);
    let result = expResult(e);
    if (e.bpb != null && e.scale === 'M' && e.group !== 'base') result += ` · ${e.bpb < D.winLine ? S.exp.beat : S.exp.notBeat} (${S.exp.line} ${num(D.winLine, 4)})`;
    fact(S.exp.result, result);
    kids.push(facts);
    if (e.evals && e.evals.length > 2) {
      const tbl = h('table', { class: 'evals' }, [
        h('thead', {}, h('tr', {}, [h('th', { text: S.exp.step }), h('th', { class: 'num', text: S.exp.devBpb }), h('th', { text: S.exp.arrived })])),
        h('tbody', {}, e.evals.filter((v) => v[1] > 0).map((v) => h('tr', {}, [h('td', { text: v[1].toLocaleString('en-US') }), h('td', { class: 'num', text: num(v[2], 4) }), h('td', { text: fmtStamp(v[0]) })]))),
      ]);
      kids.push(section(S.exp.evals, [h('div', { class: 'evals-wrap' }, [sparkline(e), h('div', { class: 'md-table' }, tbl)])]));
    }
    const links = h('p', { class: 'd-links' });
    if (e.launchTurn != null && turnById.get(e.launchTurn).scope === 'path') links.append(turnLink(e.launchTurn, '▲ ' + S.exp.toLaunch));
    if (e.seenTurn != null && e.seenTurn !== e.launchTurn) links.append(turnLink(e.seenTurn, '■ ' + S.exp.toResult));
    kids.push(links);
    return kids;
  }
  function renderSearch(ev) {
    const turn = turnById.get(ev.turn), p = turn ? phaseById.get(turn.phase) : null;
    const kids = [h('header', { class: 'd-head' }, [
      h('p', { class: 'eyebrow', text: p ? L({ en: p.long_en, zh: p.long_zh }) : '' }),
      h('h3', { class: 'd-title', text: S.webTitle }),
      h('p', { class: 'd-when' }, [h('b', { text: `${S.day(dayNo(ev.t))} · ${fmtStamp(ev.t)}` }), ev.took ? h('span', { text: ` · ${S.webTook(ev.took)}` }) : null]),
    ])];
    kids.push(section(S.webInput, [h('div', { class: 'bubble query', lang: 'en' }, [h('p', { class: 'bubble-who', lang: ZH ? 'zh-CN' : 'en', text: S.webQuery }), h('p', { class: 'watch-name', text: ev.query })])]));
    const out = h('div', { class: 'bubble agent', lang: 'en' });
    out.append(h('p', { class: 'bubble-who', lang: ZH ? 'zh-CN' : 'en', text: `${S.webHits} · ${S.webLinks(ev.hits.length)}` }));
    out.append(h('ol', { class: 'hits' }, ev.hits.map((hit) => h('li', {}, [
      SAFE_LINK.test(hit.url) ? h('a', { href: hit.url, rel: 'noopener', text: hit.title || hit.url }) : h('span', { class: 'hit-title', text: hit.title || hit.url }),
      h('span', { class: 'meta', text: ' · ' + hostOf(hit.url) }), h('span', { class: 'hit-url', text: hit.url }),
    ]))));
    if (ev.summary) { out.append(h('p', { class: 'bubble-who summary-head', lang: ZH ? 'zh-CN' : 'en', text: S.webSummary })); out.append(markdown(ev.summary)); }
    kids.push(section(S.webOutput, [out]));
    if (ev.then) kids.push(section(S.webThen, [h('div', { class: 'bubble wake', lang: 'en' }, markdown(ev.then))]));
    if (turn) kids.push(h('p', { class: 'd-links' }, [h('span', { class: 'meta', text: S.webInTurn + ': ' }), turnLink(turn.i, turnTitle(turn) || fmtStamp(turn.t0))]));
    return kids;
  }
  function renderDetail(focusEvent) {
    if (!state.sel) { detail.replaceChildren(h('p', { class: 'd-empty', text: S.pick })); return; }
    if (state.sel.type === 'search') { detail.replaceChildren(...renderSearch(events[state.sel.id])); return; }
    detail.replaceChildren(...(state.sel.type === 'turn' ? renderTurn(turnById.get(state.sel.id), focusEvent) : renderExp(expById.get(state.sel.id))));
    if (focusEvent != null) {                     // a key event was clicked: bring its row into view inside the stream
      const target = detail.querySelector('.callout') || detail.querySelector('.row.special');
      const box = detail.querySelector('.stream');
      if (target && box) box.scrollTop = Math.max(0, target.offsetTop - box.offsetTop - 60);
    }
  }

  // ---------- experiments table ----------
  function renderTable() {
    const T = S.table;
    const body = exps.map((e) => h('tr', { 'data-exp': e.id, tabindex: '0', onclick: () => select({ type: 'exp', id: e.id }, { from: 'table' }),
      onkeydown: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select({ type: 'exp', id: e.id }, { from: 'table' }); } } }, [
      h('td', { text: expGroup(e) }),
      h('td', {}, e.final ? h('strong', { text: expName(e) }) : expName(e)),
      h('td', { text: L(D.scales[e.scale]) }),
      h('td', { class: 'nw', text: fmtStamp(e.launch) }),
      h('td', { class: 'num', text: fmtDur(e.wait) }),
      h('td', { class: 'num', text: e.ran ? fmtDur(e.ran) : '–' }),
      h('td', { class: 'num', text: e.bpb != null ? num(e.bpb, 4) : e.result ? `CORE ${num(e.result.core, 2)}` : '–' }),
      h('td', { text: S.exp.status[e.status] }),
    ]));
    tableBox.replaceChildren(
      h('h2', { text: T.title }),
      h('div', { class: 'table-wrap' }, h('table', { class: 'exps' }, [
        h('thead', {}, h('tr', {}, [h('th', { text: T.group }), h('th', { text: T.model }), h('th', { text: T.scale }), h('th', { text: T.launched }), h('th', { class: 'num', text: T.waited }),
          h('th', { class: 'num', text: T.ran }), h('th', { class: 'num', text: T.result }), h('th', { text: T.outcome })])),
        h('tbody', {}, body),
      ])),
    );
  }

  // ---------- selection ----------
  function select(sel, opts) {
    opts = opts || {};
    state.sel = { type: sel.type, id: sel.id };
    const span = state.view.b - state.view.a;
    const [t0, t1] = sel.type === 'turn' ? [turnById.get(sel.id).t0, turnById.get(sel.id).t1] : sel.type === 'search' ? [events[sel.id].t, events[sel.id].t]
      : [expById.get(sel.id).launch, expById.get(sel.id).end];
    if (opts.from !== 'timeline' && (t1 < state.view.a + span * 0.04 || t0 > state.view.b - span * 0.04)) {
      const mid = (t0 + t1) / 2, need = Math.max(span, (t1 - t0) * 1.25);
      setView(mid - need / 2, mid + need / 2, true);
    } else drawSoon();
    renderDetail(sel.event);
    markSelected();
    if ((sel.type === 'turn' || sel.type === 'search') && opts.from !== 'list') {
      const query = sel.type === 'turn' ? `[data-turn="${sel.id}"]` : `[data-search="${sel.id}"]`;
      let li = list.querySelector(query);
      if (!li && state.filter !== 'all') { state.filter = 'all'; renderList(); li = list.querySelector(query); }
      if (li) scrollWithin(list, li);
    }
    if (!opts.silent) {
      try { history.replaceState(null, '', sel.type === 'turn' ? `#turn-${sel.id}` : sel.type === 'search' ? `#search-${sel.id}` : `#run-${sel.id}`); } catch (err) { /* file:// */ }
      const smooth = { behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' };
      const stacked = window.matchMedia('(max-width: 1023px)').matches;
      const top = detail.getBoundingClientRect().top;
      if (opts.from === 'table') figure.scrollIntoView(smooth);
      else if (stacked) detail.scrollIntoView(smooth);
      else if (opts.from !== 'timeline' && (top < 76 || top > window.innerHeight * 0.7)) detail.scrollIntoView(smooth);
    }
  }

  // ---------- start ----------
  renderLegend();
  renderList();
  renderTable();
  draw();
  const fromHash = () => {
    const m = /^#(turn|run|search)-(.+)$/.exec(location.hash);
    if (m && m[1] === 'turn' && turnById.has(+m[2])) return { type: 'turn', id: +m[2] };
    if (m && m[1] === 'search' && events[+m[2]] && events[+m[2]].kind === 'web') return { type: 'search', id: +m[2] };
    if (m && m[1] === 'run' && expById.has(m[2])) return { type: 'exp', id: m[2] };
    return null;
  };
  select(fromHash() || { type: 'turn', id: turns.find((t) => t.scope === 'path').i }, { from: 'init', silent: true });
  window.addEventListener('hashchange', () => { const sel = fromHash(); if (sel) select(sel, { from: 'hash', silent: true }); });
  let lastW = 0;
  new ResizeObserver(() => { const w = svgHost.clientWidth; if (w !== lastW) { lastW = w; drawSoon(); } }).observe(svgHost);
  document.addEventListener('blog:theme', () => { renderLegend(); draw(); if (state.sel && state.sel.type === 'exp') renderDetail(); });
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver((entries) => { if (entries.some((en) => en.isIntersecting)) { io.disconnect(); replay(); } }, { threshold: 0.3 });
    io.observe(svgHost);
  }
})();
