/* Figures for the AttnRes-Canon discovery-trace post, drawn as inline SVG and HTML from window.BLOG_DATA (see data.js).

   - Every figure is drawn at the pixel width of its container, so text keeps its size on any screen; narrow containers
     get a compact layout. A ResizeObserver redraws on width changes.
   - Motion plays once, when a figure scrolls into view, and ends in the complete static figure. With reduced motion,
     without IntersectionObserver or in print, the complete figure is drawn at once.
   - Hover only emphasizes or repeats what is drawn (or what the neighbouring table lists). Nothing is revealed by it.
   - One script serves both pages; the language comes from <html lang>, and every label has a zh and an en form. */
(function () {
  'use strict';

  const D = window.BLOG_DATA;
  const NS = 'http://www.w3.org/2000/svg';
  const LANG = (document.documentElement.lang || 'zh').toLowerCase().startsWith('en') ? 'en' : 'zh';
  const tr = (v) => (v && typeof v === 'object' && !Array.isArray(v) && 'zh' in v ? v[LANG] : v);
  const LINE = D.noise.line;        // preregistered winner line: Block AttnRes at update 2,000 minus max(2 delta, 0.001)
  const DELTA = D.noise.delta;      // gap between two identical runs at update 2,000
  const LAST = 46875;
  const DECAY_START = 16406;        // 46,875 x (1 - 0.65)
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOK = () => !REDUCED.matches && 'IntersectionObserver' in window;

  // ---------- strings ----------
  const T = {
    zh: {
      replay: '重播动画',
      shortAria: '两种截短训练的办法',
      shortTitles: ['完整训练：46,875 步', '压缩调度：512 步', '前缀：前 2,000 步'],
      shortNotes: ['学习率先保持不变，之后线性下降', '整条调度原样挤进 512 步，很早就开始下降', '学习率一直不变，和完整训练的开头一样'],
      shortScore: (v) => `与最终名次的相关 ${v}`, shortPrefix: '前缀取这一段', shortUnit: '步', shortLr: '学习率',
      lineageAria: '搜索路径图',
      lineageHead: [['Baseline', 'Arena 已有方法'], ['第一轮', '5 个单点改动和 1 个对照'], ['第二轮候选池', '10 个候选，跑了 6 个'], ['第三轮', '只跑 1 个']],
      anchorSub: (v) => `2,000 步 dev BPB ${v}`, finalSub: (d) => `Δ ${d} ✓ 最终模型`,
      beatsSub: (d) => `Δ ${d} ✓`, noSub: (d) => `Δ ${d}`,
      lineagePath: '通向最终模型的路径', lineageWin: '✓ 越过胜出线', lineageDelta: 'Δ：2,000 步时相对 Block AttnRes 的 dev BPB 差值',
      flowAria: '搜索的 workflow',
      flowSteps: [['Baseline 与噪声', ['两个 baseline 各训练', '2,000 步；再把 Dense', 'Baseline 重复一次，', '测得噪声 δ ≈ 0.0004']], ['提出候选', ['每轮最多 6 个', '相对父模型只改一处', '写下假设', 'FLOPs ±1%']],
        ['512 步筛选', ['比 Dense Baseline', '差 0.030 以上', '则取消']], ['2,000 步排名', ['比最好的 baseline', '低 0.001 以上', '算胜出']], ['完整训练', ['最好的候选移植后', '训练 46,875 步', '按 CORE 排名']]],
      flowLoop: '搜索循环 · 最多 3 轮',
      flowLoopNote: ['下一轮：组合或扩展上一轮的改动', '合计不超过 600 GPU 小时 · 连续两轮无胜出者则停止'],
      flowScale: '训练长度（按比例）', flowPhases: ['学习率不变', '学习率逐渐下降'], flowEnd: '46,875 步',
      flowTicks: ['512 步 · 筛选 · 约 1%', '2,000 步 · 排名 · 约 4%'],
      flowNote: ['放大：前 2,000 步', '搜索只看得到最前面的这一小段，', '这时学习率还没有开始下降。'],
      slopeAria: '11 个方法的短程排名与最终排名',
      slopeHead: [['短程排名', '压缩调度，512 步'], ['最终排名', '完整训练后']],
      slopeLegend: ['Loop 类：4 个全部下降', 'Linear attention 类：4 个全部上升', 'Baseline 与 residual'],
      slopeTip: (a, b) => `第 ${a} → 第 ${b}`, slopeShort: '512 步 dev BPB',
      backAria: '前缀长度与排名相关性', backY: '与最终排名的 Spearman 相关', backX: '正式调度的前 N 步（对数刻度）',
      bar: '事先定的标准 0.85', prefix: (s) => `前 ${s} 步`, compressed: '压缩调度，512 步', full: '完整',
      spearman: 'Spearman', pairAcc: '配对准确率',
      roundAria: ['第一轮候选相对 Block AttnRes 的 dev BPB 差值', '第二轮候选相对 Block AttnRes 的 dev BPB 差值'],
      winnerLine: '胜出线', zeroRef: (name) => `${name}（基准，差值为 0）`, updates: '训练步数', stepAt: (s) => `第 ${s} 步`,
      noiseBand: '两次相同训练之间的差异（±0.0004）',
      marginalAria: '各项改动的边际效果随训练步数的变化',
      marginalPanels: ['加入 Full AttnRes', '加入 Canon-A/C', '加入 Gate'], onBase: (b) => `加在 ${b} 上`,
      basisAria: '相对 Canon-A/C 父模型的 dev BPB 差值',
      basisNames: { attnres_full_canon: '+ Full AttnRes', attnres_canon_abcd: '+ Canon-B/D', attnres_full_canon_abcd: '+ 两者（AttnRes-Canon）' },
      decided: '第三轮在这里决定',
      mechLeft: '深度方向：读取哪些层', layers: ['Emb', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
      sublayerInput: '子层 ℓ 的输入', groups: ['组 1 之和', '组 2 之和', '部分和'],
      blockCaption: '只能读 4 个来源：\nembedding、两组之和、部分和', fullCaption: '每一层都是\n独立来源',
      mechRight: '序列方向：四处 Canon',
      attnChain: ['注意力子层', [['深度读取', 'depth', 52], ['Canon-A', 'canon', 54], ['q/k/v', '', 40], ['Canon-B ×3', 'canon', 70], ['注意力', '', 44]]],
      mlpChain: ['MLP 子层', [['深度读取', 'depth', 52], ['Canon-C', 'canon', 54], ['up-proj', '', 48], ['Canon-D', 'canon', 54], ['ReLU²', '', 42], ['down-proj', '', 60]]],
      canonInset: 'Canon 层：宽度为 4 的因果卷积', rowIn: '输入', rowOut: '输出',
      canonNotes: ['每个输出只混合当前和前 3 个位置，看不到后面。'],
      mechLegend: ['深度方向（Full AttnRes）', '序列方向（Canon 层）'],
      contextAria: '已发布结果的 CORE 与验证 BPB',
      scatterTitle: (n) => `${n} 个已发布结果`, scatterSub: '越靠右上越好', scatterX: '验证 BPB（向右更低）', scatterY: 'CORE', better: '两项都更好',
      others: '其他已发布结果',
      formalAria: '完整训练中相对 Block AttnRes 的验证 BPB 与 CORE 差值',
      lr: '学习率', lrFlat: '学习率不变', lrDecay: '线性下降到 5%',
      formalA: '(a) 验证 BPB 差值', formalB: '(b) CORE 差值', formalBShort: '(b) CORE 差值',
      decay: '学习率衰减阶段', markStep: (s) => `${s} 步`, markEnd: '终点',
      formalLegend: ['AttnRes-Canon − Block AttnRes', 'mHC − Block AttnRes'],
    },
    en: {
      replay: 'Replay animation',
      shortAria: 'Two ways to cut training short',
      shortTitles: ['Full training: 46,875 updates', 'Compressed: 512 updates', 'Prefix: first 2,000 updates'],
      shortNotes: ['constant first, then a linear decline', 'the whole schedule squeezed in; it declines early', 'constant, as at the start of a full run'],
      shortScore: (v) => `rank correlation ${v}`, shortPrefix: 'the prefix is this part', shortUnit: 'updates', shortLr: 'learning rate',
      lineageAria: 'Search path',
      lineageHead: [['Baselines', 'existing Arena methods'], ['Round 1', '5 single changes, 1 control'], ['Round-2 pool', '10 candidates, 6 run'], ['Round 3', 'a single run']],
      anchorSub: (v) => `dev BPB ${v} at 2,000`, finalSub: (d) => `Δ ${d} ✓ final model`,
      beatsSub: (d) => `Δ ${d} ✓`, noSub: (d) => `Δ ${d}`,
      lineagePath: 'Path to the final model', lineageWin: '✓ beats the winning line', lineageDelta: 'Δ: dev BPB minus Block AttnRes at update 2,000',
      flowAria: 'The search workflow',
      flowSteps: [['Baselines', ['2 baselines train', '2,000 updates; one', 'is repeated: noise', 'δ ≈ 0.0004']], ['Candidates', ['up to 6 per round;', 'one change each,', 'a hypothesis,', 'FLOPs ±1%']],
        ['Screen · 512', ['cancel if more', 'than 0.030 behind', 'the Dense Baseline']], ['Rank · 2,000', ['win: more than', '0.001 below the', 'best baseline']], ['Full training', ['best candidate', 'ported, trained', '46,875 updates,', 'ranked by CORE']]],
      flowLoop: 'Search loop · at most 3 rounds',
      flowLoopNote: ['next round: combine or extend the changes of the last one', 'at most 600 GPU-hours in total · stop after two rounds without a winner'],
      flowScale: 'Training length (to scale)', flowPhases: ['constant learning rate', 'learning-rate decay'], flowEnd: '46,875 updates',
      flowTicks: ['update 512 · screen · about 1%', 'update 2,000 · rank · about 4%'],
      flowNote: ['Zoom: the first 2,000 updates', 'The search sees only this first stretch,', 'before the learning rate begins to decay.'],
      slopeAria: 'Short-run and final ranks of 11 methods',
      slopeHead: [['Short-run rank', '512 updates, compressed'], ['Final rank', 'after full training']],
      slopeLegend: ['Looped: all 4 drop', 'Linear attention: all 4 rise', 'Baseline and residual'],
      slopeTip: (a, b) => `rank ${a} → ${b}`, slopeShort: 'Dev BPB at update 512',
      backAria: 'Rank correlation by prefix length', backY: 'Spearman correlation with the final ranking', backX: 'First N updates of the formal schedule (log scale)',
      bar: 'bar set in advance: 0.85', prefix: (s) => `first ${s}`, compressed: 'compressed, 512 updates', full: 'full',
      spearman: 'Spearman', pairAcc: 'Pair accuracy',
      roundAria: ['Dev BPB of the round-1 candidates minus Block AttnRes', 'Dev BPB of the round-2 candidates minus Block AttnRes'],
      winnerLine: 'winning line', zeroRef: (name) => `${name} (the reference, at 0)`, updates: 'Update', stepAt: (s) => `update ${s}`,
      noiseBand: 'Difference between two identical runs (±0.0004)',
      marginalAria: 'Marginal effect of each change by update',
      marginalPanels: ['Adding Full AttnRes', 'Adding Canon-A/C', 'Adding Gate'], onBase: (b) => `on ${b}`,
      basisAria: 'Dev BPB relative to the Canon-A/C parent',
      basisNames: { attnres_full_canon: '+ Full AttnRes', attnres_canon_abcd: '+ Canon-B/D', attnres_full_canon_abcd: '+ both (AttnRes-Canon)' },
      decided: 'round 3 decided here',
      mechLeft: 'Depth: which layers are read', layers: ['Emb', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8'],
      sublayerInput: 'sublayer input', groups: ['group 1', 'group 2', 'partial'],
      blockCaption: 'Reads only 4 sources:\nembedding, two group\nsums, one partial sum', fullCaption: 'Every layer is\nits own source',
      mechRight: 'Sequence: four Canon positions',
      attnChain: ['Attention sublayer', [['depth read', 'depth', 62], ['Canon-A', 'canon', 54], ['q/k/v', '', 40], ['Canon-B ×3', 'canon', 70], ['attention', '', 58]]],
      mlpChain: ['MLP sublayer', [['depth read', 'depth', 60], ['Canon-C', 'canon', 52], ['up-proj', '', 48], ['Canon-D', 'canon', 52], ['ReLU²', '', 40], ['down-proj', '', 60]]],
      canonInset: 'Canon layer: width-4 causal convolution', rowIn: 'in', rowOut: 'out',
      canonNotes: ['Each output mixes its own input and the three before it,', 'never a later one.'],
      mechLegend: ['Depth (Full AttnRes)', 'Sequence (Canon layers)'],
      contextAria: 'CORE and validation BPB of the published results',
      scatterTitle: (n) => `${n} published results`, scatterSub: 'up and to the right is better', scatterX: 'Validation BPB (lower to the right)', scatterY: 'CORE', better: 'better on both',
      others: 'Other published results',
      formalAria: 'Validation BPB and CORE relative to Block AttnRes over the formal runs',
      lr: 'LR', lrFlat: 'constant learning rate', lrDecay: 'linear decay to 5%',
      formalA: '(a) Validation BPB gap', formalB: '(b) CORE gap', formalBShort: '(b) CORE gap',
      decay: 'Learning-rate decay', markStep: (s) => `update ${s}`, markEnd: 'end',
      formalLegend: ['AttnRes-Canon − Block AttnRes', 'mHC − Block AttnRes'],
    },
  }[LANG];

  // Readable names, shared by every figure. Method names are not translated: the Chinese page uses the same ones.
  const NAME = {
    dense_full: 'Dense Baseline', attnres: 'Block AttnRes', attnres_full: 'Full AttnRes', attnres_canon: 'Canon-A/C',
    attnres_gate: 'Gate', attnres_deep: 'Deep-narrow', attnres_ve_all: { zh: '每层 value embedding', en: 'VE in every layer' },
    dense_full_gate: 'Dense + Gate', attnres_full_canon: 'Full + Canon-A/C', attnres_canon_abcd: 'Canon-A–D',
    attnres_full_gate: 'Full + Gate', attnres_gate_canon: 'Gate + Canon-A/C', attnres_full_gate_canon: 'Full + Gate + Canon-A/C',
    attnres_gate_elem: 'Element-wise Gate', attnres_deep_gate: 'Deep-narrow + Gate', attnres_deep_canon: 'Deep-narrow + Canon-A/C',
    attnres_moe: 'MoE (8 experts)', attnres_moe16: 'MoE (16 experts)', attnres_full_canon_abcd: 'AttnRes-Canon',
    residual_standard: 'Standard residual',
    deeploop: 'DeepLoop', fixed_recursive: 'Fixed Recursive', ut_act: 'UT-ACT', huginn: 'Huginn',
    gdn: 'GDN', kda: 'KDA', retnet: 'RetNet', elu_qknorm: 'ELU-Norm', mhc: 'mHC',
  };
  const nameOf = (m) => tr(NAME[m]) || m;

  // ---------- helpers ----------
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  function s(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const key in attrs || {}) if (attrs[key] !== undefined) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function st(parent, x, y, str, attrs) {   // text; a "\n" starts a new line 14px lower
    const node = s('text', Object.assign({ x, y }, attrs || {}), parent);
    const lines = String(str).split('\n');
    if (lines.length === 1) node.textContent = str;
    else lines.forEach((line, i) => { const span = s('tspan', { x, dy: i ? 14 : 0 }, node); span.textContent = line; });
    return node;
  }
  function h(tag, attrs, children) {
    const node = document.createElement(tag);
    for (const key in attrs || {}) {
      if (key === 'text') node.textContent = attrs[key];
      else if (key === 'class') node.className = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    for (const child of children || []) if (child) node.appendChild(child);
    return node;
  }
  const signed = (v, digits = 4) => (v < 0 ? '−' : v > 0 ? '+' : '') + Math.abs(v).toFixed(digits);
  const linear = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const n = (v) => v.toLocaleString('en-US');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function svgRoot(W, H, label) { return s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label }); }
  // Shrinks a label until it fits; the svg must already be in the document.
  function fit(node, max) {
    let size = parseFloat(node.getAttribute('font-size'));
    while (size > 9 && node.getComputedTextLength() > max) { size -= 0.5; node.setAttribute('font-size', size); }
  }
  // Legend below a figure. Each item: [label, color, kind, key]; kind 'rect', 'dot' or 'band' draws a swatch instead of a line.
  function legend(items) {
    return h('div', { class: 'legend' }, items.map(([label, color, kind, key]) => {
      if (kind === 'note') return h('span', { class: 'legend-item', text: label });
      const mark = h('span', { class: `legend-key ${kind && kind !== 'dash' ? kind : ''}` });
      if (kind === 'rect' || kind === 'dot' || kind === 'band') mark.style.background = color;
      else { mark.style.borderColor = color; if (kind === 'dash') mark.style.borderTopStyle = 'dashed'; }
      const item = h('span', { class: 'legend-item' }, [mark, h('span', { text: label })]);
      if (key) item.dataset.key = key;
      return item;
    }));
  }
  // The part of a polyline left of a cut, as a path; pts are {px, py} sorted by px.
  function pathUpTo(pts, cut) {
    let d = '';
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (p.px <= cut + 1e-6) { d += `${i ? 'L' : 'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`; continue; }
      if (i) {
        const q = pts[i - 1], t = (cut - q.px) / (p.px - q.px);
        if (t > 0) d += `L${cut.toFixed(1)},${(q.py + t * (p.py - q.py)).toFixed(1)}`;
      }
      break;
    }
    return d || `M${pts[0].px.toFixed(1)},${pts[0].py.toFixed(1)}`;
  }
  const fullPath = (pts) => pathUpTo(pts, Infinity);

  // ---------- motion ----------
  // One timeline per animated unit. Registration sets the start state at once; play() runs it. When not enabled every
  // call is a no-op, which leaves the figure in its final state.
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const EASING = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
  class Timeline {
    constructor(enabled) { this.enabled = enabled; this.tweens = []; this.web = []; this.started = false; this.raf = 0; }
    tween(delay, duration, fn, ease) {
      if (!this.enabled) return;
      fn(0);
      this.tweens.push({ delay, duration, fn, ease: ease || easeOut, done: false });
    }
    web_(node, frames, delay, duration) {
      if (!this.enabled || !node || !node.animate) return;
      const animation = node.animate(frames, { duration, delay, easing: EASING, fill: 'both' });
      animation.pause();
      animation.onfinish = () => animation.cancel();   // hand the node back to its own styles
      this.web.push(animation);
    }
    fade(nodes, delay = 0, duration = 420, dy = 0) {
      for (const node of [].concat(nodes)) {
        this.web_(node, dy ? [{ opacity: 0, transform: `translateY(${dy}px)` }, { opacity: 1, transform: 'translateY(0)' }]
          : [{ opacity: 0 }, { opacity: 1 }], delay, duration);
      }
    }
    pop(nodes, delay = 0, duration = 380) {
      for (const node of [].concat(nodes)) {
        if (!node) continue;
        node.style.transformBox = 'fill-box';
        node.style.transformOrigin = 'center';
        this.web_(node, [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)' }], delay, duration);
      }
    }
    draw(paths, delay = 0, duration = 600) {   // solid strokes only
      for (const path of [].concat(paths)) {
        if (!this.enabled || !path) continue;
        path.setAttribute('pathLength', 1);
        this.web_(path, [{ strokeDasharray: '1 1.2', strokeDashoffset: 1.02 }, { strokeDasharray: '1 1.2', strokeDashoffset: 0 }], delay, duration);
      }
    }
    play() {
      if (!this.enabled || this.started) return;
      this.started = true;
      this.web.forEach((a) => a.play());
      if (!this.tweens.length) return;
      const start = performance.now();
      const frame = (now) => {
        let running = false;
        for (const tw of this.tweens) {
          if (tw.done) continue;
          const t = (now - start - tw.delay) / tw.duration;
          if (t < 0) { running = true; continue; }
          if (t >= 1) { tw.fn(1); tw.done = true; } else { tw.fn(tw.ease(t)); running = true; }
        }
        this.raf = running ? requestAnimationFrame(frame) : 0;
      };
      this.raf = requestAnimationFrame(frame);
    }
    cancel() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.web.forEach((a) => a.cancel());
      this.tweens = []; this.web = [];
    }
  }

  // ---------- hover: tooltip and emphasis ----------
  const tip = h('div', { class: 'tip', role: 'status', 'aria-hidden': 'true' });
  document.body.appendChild(tip);
  function showTip(event, title, rows) {
    tip.replaceChildren();
    if (title) tip.appendChild(h('div', { class: 'tip-title', text: title }));
    for (const row of rows) {
      const key = h('span', { class: 'tip-key' });
      key.style.borderColor = row.color || 'transparent';
      tip.appendChild(h('div', { class: 'tip-row' }, [row.color ? key : null, h('span', { text: row.label }), h('b', { text: row.value })]));
    }
    tip.classList.add('is-on');
    moveTip(event);
  }
  function moveTip(event) {
    if (tip.childNodes.length) tip.classList.add('is-on');   // a scroll may have hidden it
    const box = tip.getBoundingClientRect();
    let x = event.clientX + 14, y = event.clientY + 16;
    if (x + box.width > window.innerWidth - 8) x = event.clientX - box.width - 14;
    if (y + box.height > window.innerHeight - 8) y = event.clientY - box.height - 12;
    tip.style.left = `${Math.max(8, x)}px`;
    tip.style.top = `${Math.max(8, y)}px`;
  }
  const hideTip = () => tip.classList.remove('is-on');
  window.addEventListener('scroll', hideTip, { passive: true });
  function setFocus(svg, keys, selector) {
    const set = new Set([].concat(keys));
    svg.classList.add('has-focus');
    svg.querySelectorAll(selector || '.series').forEach((node) => node.classList.toggle('is-focus', set.has(node.dataset.key)));
  }
  function clearFocus(svg) {
    svg.classList.remove('has-focus');
    svg.querySelectorAll('.is-focus').forEach((node) => node.classList.remove('is-focus'));
  }
  // Emphasis (and an optional readout) while the pointer is over one mark.
  function hoverMark(svg, node, key, describe) {
    node.addEventListener('pointerenter', (event) => {
      if (key) setFocus(svg, key);
      if (describe) { const d = describe(); showTip(event, d.title, d.rows); }
    });
    node.addEventListener('pointermove', (event) => { if (describe) moveTip(event); });
    node.addEventListener('pointerleave', () => { if (key) clearFocus(svg); hideTip(); });
  }
  // A crosshair over a plot that snaps to the nearest sampled x. describe(xValue) -> { title, rows: [{color, label, value, py, key}] }.
  function crosshair(svg, area, xs, xScale, describe, viewW) {
    const layer = s('g', { 'pointer-events': 'none', opacity: 0 }, svg);
    const rule = s('line', { y1: area.top, y2: area.bottom, stroke: css('--text-muted'), 'stroke-width': 1 }, layer);
    const dots = s('g', {}, layer);
    const hit = s('rect', { class: 'hit', x: area.left, y: area.top, width: area.right - area.left, height: area.bottom - area.top, fill: 'transparent' }, svg);
    const locate = (event) => {
      const box = svg.getBoundingClientRect(), scale = viewW / box.width;
      const px = (event.clientX - box.left) * scale, py = (event.clientY - box.top) * scale;
      let best = xs[0];
      for (const v of xs) if (Math.abs(xScale(v) - px) < Math.abs(xScale(best) - px)) best = v;
      return { value: best, py };
    };
    let shown = null;
    const update = (event) => {
      const { value, py } = locate(event);
      const d = describe(value);
      if (shown !== value) {
        shown = value;
        const x = xScale(value);
        rule.setAttribute('x1', x); rule.setAttribute('x2', x);
        dots.replaceChildren();
        for (const row of d.rows) {
          if (row.py === undefined) continue;
          s('circle', { cx: x, cy: row.py, r: 4, fill: row.color, stroke: css('--surface'), 'stroke-width': 2 }, dots);
        }
        showTip(event, d.title, d.rows);
      } else moveTip(event);
      layer.setAttribute('opacity', 1);
      // Emphasize the series nearest to the pointer, if one is close.
      let near = null, gap = 16;
      for (const row of d.rows) if (row.key && row.py !== undefined && Math.abs(row.py - py) < gap) { gap = Math.abs(row.py - py); near = row.key; }
      if (near) setFocus(svg, near); else clearFocus(svg);
    };
    hit.addEventListener('pointerenter', update);
    hit.addEventListener('pointermove', update);
    hit.addEventListener('pointerleave', () => { shown = null; layer.setAttribute('opacity', 0); clearFocus(svg); hideTip(); });
    return hit;
  }

  // ---------- data ----------
  const devAt = (method, step) => { const p = D.search[method].dev.find(([k]) => k === step); return p ? p[1] : undefined; };
  const ANCHOR = devAt('attnres', 2000);
  const final = (method) => devAt(method, 2000);
  const STEPS = [512, 768, 1024, 1280, 1536, 1792, 2000];

  // Fixed entity colors, shared by every figure: color follows the candidate, never its rank.
  const SLOT = {
    attnres_full_canon_abcd: 1, attnres_canon_abcd: 2, attnres_full_canon: 3, attnres_gate_canon: 4,
    attnres_gate: 5, attnres_full: 6, attnres_canon: 7, attnres_full_gate: 8,
  };
  const colorOf = (m) => (m === 'attnres' ? css('--neutral-mark') : css(SLOT[m] ? `--series-${SLOT[m]}` : '--series-other'));

  // ---------- figure: search map ----------
  const CATALOG = {
    dense_full: { col: 0, row: 5, role: 'anchor' },
    attnres: { col: 0, row: 2, role: 'anchor' },
    attnres_full: { col: 1, row: 0 },
    attnres_canon: { col: 1, row: 1 },
    attnres_gate: { col: 1, row: 2 },
    attnres_deep: { col: 1, row: 3 },
    attnres_ve_all: { col: 1, row: 4 },
    dense_full_gate: { col: 1, row: 5, why: { zh: '未运行：Gate 优势已消失', en: 'not run: Gate lead faded' } },
    attnres_full_canon: { col: 2, row: 0 },
    attnres_canon_abcd: { col: 2, row: 1 },
    attnres_full_gate: { col: 2, row: 2 },
    attnres_gate_canon: { col: 2, row: 3 },
    attnres_full_gate_canon: { col: 2, row: 4, why: { zh: '未运行：一次改了两处', en: 'not run: two changes at once' } },
    attnres_gate_elem: { col: 2, row: 5, why: { zh: '未运行：要挤掉一层', en: 'not run: costs a layer' } },
    attnres_deep_gate: { col: 2, row: 6, why: { zh: '未运行：deep-narrow 已落后', en: 'not run: deep-narrow trailed' } },
    attnres_deep_canon: { col: 2, row: 7, why: { zh: '未运行：deep-narrow 已落后', en: 'not run: deep-narrow trailed' } },
    attnres_moe: { col: 2, row: 8 },
    attnres_moe16: { col: 2, row: 9 },
    attnres_full_canon_abcd: { col: 3, row: 0.5, role: 'final' },
    'r3:attnres_full_gate_canon': { col: 3, row: 2.5, name: 'attnres_full_gate_canon', why: { zh: '未运行：Gate 效果接近零', en: 'not run: Gate effect ≈ 0' } },
  };
  const EDGES = [
    ['attnres', 'attnres_full', 1], ['attnres', 'attnres_canon', 1], ['attnres', 'attnres_gate'], ['attnres', 'attnres_deep'],
    ['attnres', 'attnres_ve_all'], ['dense_full', 'dense_full_gate'],
    ['attnres_full', 'attnres_full_canon', 2], ['attnres_canon', 'attnres_full_canon', 2], ['attnres_canon', 'attnres_canon_abcd', 2],
    ['attnres_full', 'attnres_full_gate'], ['attnres_gate', 'attnres_full_gate'], ['attnres_gate', 'attnres_gate_canon'],
    ['attnres_canon', 'attnres_gate_canon'], ['attnres_full', 'attnres_full_gate_canon'], ['attnres_gate', 'attnres_full_gate_canon'],
    ['attnres_canon', 'attnres_full_gate_canon'], ['attnres_gate', 'attnres_gate_elem'], ['attnres_deep', 'attnres_deep_gate'],
    ['attnres_gate', 'attnres_deep_gate'], ['attnres_deep', 'attnres_deep_canon'], ['attnres_canon', 'attnres_deep_canon'],
    ['attnres_canon_abcd', 'attnres_full_canon_abcd', 3], ['attnres_full_canon', 'attnres_full_canon_abcd', 3],
    ['attnres_full_canon', 'r3:attnres_full_gate_canon'],
  ];   // the third entry marks an edge on the path to the final model, numbered by the round it leads into
  const ON_PATH = new Set(EDGES.filter((e) => e[2]).flatMap((e) => [e[0], e[1]]));
  function related(id) {   // a candidate with everything it builds on and everything built on it
    const walk = (start, from, to) => {
      const seen = new Set([start]), queue = [start];
      while (queue.length) { const cur = queue.pop(); for (const e of EDGES) if (e[from] === cur && !seen.has(e[to])) { seen.add(e[to]); queue.push(e[to]); } }
      return seen;
    };
    return { up: walk(id, 1, 0), down: walk(id, 0, 1) };
  }

  // One candidate box: name on the first line, result or reason on the second.
  function nodeBox(svg, id, x, y, NW, NH, mark) {
    const c = CATALOG[id], method = c.name || id;
    const skipped = Boolean(c.why), beats = !skipped && c.role !== 'anchor' && final(method) < LINE;
    const group = s('g', { class: 'node', 'data-key': id }, svg);
    const box = s('rect', { x, y, width: NW, height: NH, rx: 8 }, group);
    let fill = css('--surface'), stroke = css('--axis'), ink = css('--text-primary'), sub;
    if (c.role === 'anchor') { fill = css('--wash'); sub = T.anchorSub(final(method).toFixed(4)); }
    else if (c.role === 'final') { fill = css('--series-1'); stroke = css('--series-1'); ink = css('--on-fill'); sub = T.finalSub(signed(final(method) - ANCHOR)); }
    else if (skipped) { box.setAttribute('stroke-dasharray', '4 3'); fill = 'transparent'; ink = css('--text-muted'); sub = tr(c.why); }
    else {
      const d = final(method) - ANCHOR;
      sub = beats ? T.beatsSub(signed(d)) : T.noSub(signed(d));
      if (beats) stroke = css('--text-primary');
    }
    box.setAttribute('fill', fill);
    box.setAttribute('stroke', stroke);
    box.setAttribute('stroke-width', beats ? 1.6 : 1);
    if (mark && ON_PATH.has(id) && c.role !== 'final') s('rect', { x: x + 1.5, y: y + 7, width: 3.5, height: NH - 14, rx: 1.75, fill: css('--series-1') }, group);
    const title = st(group, x + 11, y + NH / 2 - 3, nameOf(method), { 'font-size': 12.5, fill: ink, 'font-weight': c.role === 'final' || beats ? 650 : 500 });
    const note = st(group, x + 11, y + NH / 2 + 12, sub, { 'font-size': 11, fill: c.role === 'final' ? css('--on-fill') : css('--text-secondary') });
    fit(title, NW - 18); fit(note, NW - 18);
    return group;
  }

  function drawLineage(host, ctx) {
    if (ctx.W < 640) return drawLineageGrid(host, ctx);
    const W = ctx.W, GAPX = Math.round(clamp(W * 0.045, 26, 44)), NW = Math.floor((W - 3 * GAPX) / 4), NH = 40, Y0 = 58, GAP = 47;
    const H = Y0 + 9 * GAP + NH + 4;
    const COLX = [0, 1, 2, 3].map((i) => i * (NW + GAPX));
    const svg = svgRoot(W, H, T.lineageAria);
    host.appendChild(svg);
    const A = ctx.timeline(svg, 'lineage');
    const STEP = 360, TRACE = 4 * STEP + 120;
    T.lineageHead.forEach(([title, sub], i) => {
      const head = s('g', {}, svg);
      st(head, COLX[i], 16, title, { 'font-size': 14, 'font-weight': 600, fill: css('--text-primary') });
      st(head, COLX[i], 34, sub, { 'font-size': 11.5, fill: css('--text-muted') });
      A.fade(head, i * STEP, 400);
    });
    const pos = (id) => { const c = CATALOG[id]; return { x: COLX[c.col], y: Y0 + c.row * GAP }; };
    const edgeLayer = s('g', {}, svg);
    const draw = (hot) => {
      for (const [a, b, stage] of EDGES) {
        if (Boolean(stage) !== hot) continue;
        const p = pos(a), q = pos(b);
        const x0 = p.x + NW, y0 = p.y + NH / 2, x1 = q.x, y1 = q.y + NH / 2, mx = (x0 + x1) / 2;
        const path = s('path', {
          class: 'edge', 'data-a': a, 'data-b': b, d: `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`, fill: 'none',
          stroke: hot ? css('--series-1') : css('--axis'), 'stroke-width': hot ? 2.2 : 1,
        }, edgeLayer);
        if (hot) A.draw(path, TRACE + (stage - 1) * 420, 480);
        else A.draw(path, CATALOG[a].col * STEP + 180, 420);
      }
    };
    draw(false);
    draw(true);
    const order = {};
    for (const id of Object.keys(CATALOG)) {
      const p = pos(id), c = CATALOG[id];
      const node = nodeBox(svg, id, p.x, p.y, NW, NH, false);
      order[c.col] = (order[c.col] || 0) + 1;
      if (c.role === 'final') A.pop(node, TRACE + 3 * 420 - 120, 460);
      else A.fade(node, c.col * STEP + order[c.col] * 35, 420, 6);
      node.addEventListener('pointerenter', () => {
        const { up, down } = related(id);
        svg.classList.add('has-focus');
        svg.querySelectorAll('.node').forEach((el) => el.classList.toggle('is-focus', up.has(el.dataset.key) || down.has(el.dataset.key)));
        svg.querySelectorAll('.edge').forEach((el) => el.classList.toggle('is-focus',
          (up.has(el.dataset.a) && up.has(el.dataset.b)) || (down.has(el.dataset.a) && down.has(el.dataset.b))));
      });
      node.addEventListener('pointerleave', () => clearFocus(svg));
    }
    host.appendChild(legend([[T.lineagePath, css('--series-1')], [T.lineageWin, '', 'note'], [T.lineageDelta, '', 'note']]));
  }

  // Narrow screens: the rounds stack from top to bottom, two boxes per row; a blue bar marks the path to the final model.
  function drawLineageGrid(host, ctx) {
    const W = ctx.W, NW = Math.floor((W - 8) / 2), NH = 40, COLX = [0, NW + 8], ROWH = 47, HEADH = 44;
    const items = [];
    let y = 0;
    for (let col = 0; col < 4; col++) {
      const ids = Object.keys(CATALOG).filter((id) => CATALOG[id].col === col).sort((a, b) => CATALOG[a].row - CATALOG[b].row);
      items.push({ head: col, y });
      y += HEADH;
      ids.forEach((id, i) => items.push({ id, x: COLX[i % 2], y: y + Math.floor(i / 2) * ROWH }));
      y += Math.ceil(ids.length / 2) * ROWH + 8;
    }
    const svg = svgRoot(W, y, T.lineageAria);
    host.appendChild(svg);
    const A = ctx.timeline(svg, 'lineage');
    items.forEach((it, i) => {
      if (it.id) { A.fade(nodeBox(svg, it.id, it.x, it.y, NW, NH, true), 80 + i * 45, 380, 6); return; }
      const [title, sub] = T.lineageHead[it.head];
      const head = s('g', {}, svg);
      st(head, 0, it.y + 18, title, { 'font-size': 14, 'font-weight': 600, fill: css('--text-primary') });
      st(head, 0, it.y + 35, sub, { 'font-size': 11.5, fill: css('--text-muted') });
      A.fade(head, 80 + i * 45, 380);
    });
    host.appendChild(legend([[T.lineagePath, css('--series-1'), 'rect'], [T.lineageWin, '', 'note'], [T.lineageDelta, '', 'note']]));
  }

  // ---------- figure: the search workflow (schematic) ----------
  function drawWorkflow(host, ctx) {
    const W = ctx.W, small = W < 640;
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    const blue = css('--loop'), hero = css('--series-1'), onFill = css('--on-fill'), axis = css('--axis'), wash = css('--wash');
    const wrap = h('div', { class: 'flowing is-paused' });
    host.appendChild(wrap);
    const steps = T.flowSteps, notes = T.flowLoopNote, LINE = 15, PADT = 30;
    const tall = steps.map(([, lines]) => PADT + lines.length * LINE + 12);
    const GAP = small ? 16 : Math.round(clamp(W * 0.024, 14, 22));
    const CW = small ? W - 40 : Math.floor((W - 4 * GAP) / 5), CH = Math.max(...tall), TOP = small ? 2 : 30;
    // Card boxes: one row on wide containers, one column on narrow ones. Cards 2-4 sit inside the search-loop band.
    const boxes = [];
    let band, bottom;
    if (small) {
      const HEAD = 24 + notes.length * 14 + 6;
      let y = TOP;
      steps.forEach((_, i) => {
        if (i === 1) { band = { x: 0, y: y - 4, w: W, h: 0 }; y += HEAD; }
        boxes.push({ x: 8, y, w: CW, h: tall[i] });
        y += tall[i] + GAP;
        if (i === 3) { band.h = y - GAP + 10 - band.y; y += 8; }
      });
      bottom = y - GAP;
    } else {
      steps.forEach((_, i) => boxes.push({ x: i * (CW + GAP), y: TOP, w: CW, h: CH }));
      bottom = TOP + CH + 26 + notes.length * LINE + 8;
      band = { x: boxes[1].x - 9, y: TOP - 24, w: boxes[3].x + CW + 18 - boxes[1].x, h: bottom - 2 - (TOP - 24) };
    }
    // The scale strip below: the full schedule, then a zoom on its first 2,000 updates.
    const SY = bottom + (small ? 16 : 12), FY = SY + 44, BH = 12, ZY = FY + BH + 30;
    const ZW = small ? Math.round(W * 0.72) : Math.round(Math.min(430, W * 0.5));
    const H = small ? ZY + BH + 36 + 12 + T.flowNote.length * 14 + 4 : ZY + BH + 40;
    const svg = svgRoot(W, H, T.flowAria);
    wrap.appendChild(svg);
    const A = ctx.timeline(svg, 'workflow');
    const defs = s('defs', {}, svg);
    for (const [name, color] of [['ink', sub], ['blue', blue]]) {
      const marker = s('marker', { id: `wf-${name}`, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      s('path', { d: 'M0,0 L8,4 L0,8 z', fill: color }, marker);
    }
    const loop = s('g', {}, svg);
    s('rect', { x: band.x, y: band.y, width: band.w, height: band.h, rx: 12, fill: blue, 'fill-opacity': 0.07 }, loop);
    st(loop, band.x + 12, band.y + 16, T.flowLoop, { 'font-size': 11.5, 'font-weight': 650, fill: ink });
    notes.forEach((line, k) => {
      const text = small ? st(loop, band.x + 12, band.y + 33 + k * 14, line, { 'font-size': 11, fill: sub })
        : st(loop, band.x + band.w / 2, TOP + CH + 36 + k * LINE, line, { 'font-size': 11, 'text-anchor': 'middle', fill: sub });
      fit(text, band.w - 24);
    });
    A.fade(loop, 0, 500);
    boxes.forEach((b, i) => {
      const [title, lines] = steps[i], final = i === 4, inside = i >= 1 && i <= 3;
      const card = s('g', {}, svg);
      s('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 10, fill: final ? hero : surface, stroke: final ? hero : inside ? blue : axis, 'stroke-width': inside ? 1.5 : 1 }, card);
      s('circle', { cx: b.x + 18, cy: b.y + 18, r: 9, fill: final ? onFill : inside ? blue : muted }, card);
      st(card, b.x + 18, b.y + 22, i + 1, { 'font-size': 11, 'font-weight': 700, 'text-anchor': 'middle', fill: final ? hero : onFill });
      fit(st(card, b.x + 33, b.y + 22.5, title, { 'font-size': 12.5, 'font-weight': 650, fill: final ? onFill : ink }), b.w - 40);
      lines.forEach((line, k) => fit(st(card, b.x + 12, b.y + PADT + 14 + k * LINE, line, { 'font-size': 11, fill: final ? onFill : sub }), b.w - 20));
      A.fade(card, 150 + i * 200, 420, 6);
      if (i === 4) return;
      const next = boxes[i + 1];
      // On narrow layouts the first arrow stops at the loop band, whose heading sits between the two cards.
      const d = small ? `M${b.x + b.w / 2},${b.y + b.h + 2} V${(i === 0 ? band.y : next.y) - 4}` : `M${b.x + b.w + 2},${b.y + b.h / 2} H${next.x - 4}`;
      A.fade(s('path', { d, fill: 'none', stroke: sub, 'stroke-width': 1.5, 'marker-end': 'url(#wf-ink)' }, svg), 320 + i * 200, 300);
    });
    // The way back from ranking to the next round's candidates; dashes travel along it while the figure is in view.
    const from = boxes[3], to = boxes[1], R = 8;
    const back = small
      ? `M${from.x + from.w},${from.y + from.h / 2} H${W - 12 - R} Q${W - 12},${from.y + from.h / 2} ${W - 12},${from.y + from.h / 2 - R} V${to.y + to.h / 2 + R} Q${W - 12},${to.y + to.h / 2} ${W - 12 - R},${to.y + to.h / 2} H${to.x + to.w + 5}`
      : `M${from.x + from.w / 2},${from.y + from.h} V${from.y + from.h + 16 - R} Q${from.x + from.w / 2},${from.y + from.h + 16} ${from.x + from.w / 2 - R},${from.y + from.h + 16} H${to.x + to.w / 2 + R} Q${to.x + to.w / 2},${to.y + to.h + 16} ${to.x + to.w / 2},${to.y + to.h + 16 - R} V${to.y + to.h + 5}`;
    const way = s('g', {}, svg);
    s('path', { d: back, fill: 'none', stroke: blue, 'stroke-width': 1.5, opacity: 0.4 }, way);
    s('path', { class: 'flow', d: back, fill: 'none', stroke: blue, 'stroke-width': 2, 'stroke-linecap': 'round', 'marker-end': 'url(#wf-blue)' }, way);
    A.fade(way, 1150, 450);
    // Scale strip.
    const fx = linear(0, LAST, 0, W), zx = linear(0, 2000, 0, ZW);
    const scale = s('g', {}, svg);
    st(scale, 0, SY + 12, T.flowScale, { 'font-size': 12, 'font-weight': 650, fill: ink });
    st(scale, fx(DECAY_START / 2), FY - 7, T.flowPhases[0], { 'font-size': 11, 'text-anchor': 'middle', fill: sub });
    st(scale, fx((DECAY_START + LAST) / 2), FY - 7, T.flowPhases[1], { 'font-size': 11, 'text-anchor': 'middle', fill: sub });
    s('rect', { x: 0, y: FY, width: W, height: BH, rx: 3, fill: wash }, scale);
    s('rect', { x: fx(DECAY_START), y: FY, width: W - fx(DECAY_START), height: BH, fill: axis, opacity: 0.6 }, scale);
    s('rect', { x: 0, y: FY, width: fx(2000), height: BH, fill: blue }, scale);
    st(scale, W, FY - 7, T.flowEnd, { 'font-size': 11, 'text-anchor': 'end', fill: muted });
    A.fade(scale, 1450, 450);
    const zoom = s('g', {}, svg);
    s('path', { d: `M0,${FY + BH} L${fx(2000)},${FY + BH} L${ZW},${ZY} L0,${ZY} Z`, fill: blue, 'fill-opacity': 0.1 }, zoom);
    s('rect', { x: 0, y: ZY, width: ZW, height: BH, rx: 3, fill: blue, 'fill-opacity': 0.3 }, zoom);
    s('rect', { x: 0, y: ZY, width: zx(512), height: BH, rx: 3, fill: blue }, zoom);
    const first = st(zoom, zx(512), ZY + BH + 18, T.flowTicks[0], { 'font-size': 11, 'text-anchor': 'middle', fill: ink });
    const second = st(zoom, ZW, ZY + BH + 18, T.flowTicks[1], { 'font-size': 11, 'text-anchor': 'end', fill: ink });
    const half = first.getComputedTextLength() / 2;
    if (zx(512) - half < 0) { first.setAttribute('text-anchor', 'start'); first.setAttribute('x', Math.max(0, zx(512) - 24)); }
    const lower = small || Math.max(zx(512) + half, half * 2) + 12 > ZW - second.getComputedTextLength();
    if (lower) second.setAttribute('y', ZY + BH + 33);
    for (const step of [512, 2000]) s('line', { x1: zx(step), y1: ZY - 3, x2: zx(step), y2: ZY + BH + (lower && step === 2000 ? 20 : 5), stroke: ink, 'stroke-width': 1.2 }, zoom);
    T.flowNote.forEach((line, k) => {
      const text = small ? st(zoom, 0, ZY + BH + 54 + k * 14, line, { 'font-size': 11, fill: k ? sub : ink, 'font-weight': k ? 400 : 600 })
        : st(zoom, ZW + 20, ZY - 6 + k * LINE, line, { 'font-size': 11, fill: k ? sub : ink, 'font-weight': k ? 400 : 600 });
      fit(text, small ? W : W - ZW - 22);
    });
    A.fade(zoom, 1800, 500);
    ctx.loop(wrap, (on) => wrap.classList.toggle('is-paused', !on), () => {});
  }

  // ---------- figure: two ways to cut training short (schematic) ----------
  // Three small panels with the same learning-rate axis: the full schedule, the same shape squeezed into 512 updates,
  // and the first 2,000 updates of the full schedule. The two short forms carry the rank correlation they reached.
  function drawShorten(host, ctx) {
    const row = ctx.W >= 600, GAP = 24;
    const PW = row ? Math.floor((ctx.W - 2 * GAP) / 3) : ctx.W;
    const wrap = h('div', { class: 'panels' });
    if (row) { wrap.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'; wrap.style.columnGap = `${GAP}px`; }
    host.appendChild(wrap);
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    const prefixScore = D.proxy.backtest.find((r) => r[0] === 2000)[1];
    const PANELS = [
      { key: 'full', end: '46,875', color: css('--neutral-mark'), soft: css('--wash'), decay: true },
      { key: 'compressed', end: '512', color: css('--emph'), soft: css('--emph-soft'), decay: true, score: D.proxy.spearman, ok: false },
      { key: 'prefix', end: '2,000', color: css('--chart-line'), soft: css('--lr-fill'), decay: false, score: prefixScore, ok: true },
    ];
    PANELS.forEach((p, i) => {
      const H = 176, ML = 8, MR = 8, MT = 24, MB = 48;
      const area = { left: ML, right: PW - MR, top: MT, bottom: H - MB };
      const box = h('div', { class: 'panel' }, [h('div', { class: 'fig-title', text: T.shortTitles[i] })]);
      wrap.appendChild(box);
      const svg = svgRoot(PW, H, T.shortTitles[i]);
      box.appendChild(svg);
      const A = ctx.timeline(svg, `shorten-${p.key}`);
      const x = linear(0, 1, area.left, area.right), y = linear(0, 1, area.bottom, area.top + 8);
      st(svg, area.left, 12, T.shortLr, { 'font-size': 11.5, fill: muted });
      s('line', { x1: area.left, y1: y(1), x2: area.right, y2: y(1), stroke: css('--grid') }, svg);
      s('line', { x1: area.left, y1: area.bottom, x2: area.right, y2: area.bottom, stroke: css('--axis') }, svg);
      const frac = DECAY_START / LAST;
      const pts = (p.decay ? [[0, 1], [frac, 1], [1, 0.05]] : [[0, 1], [1, 1]]).map(([u, v]) => ({ px: x(u), py: y(v) }));
      const fill = s('path', { fill: p.soft }, svg);
      const line = s('path', { fill: 'none', stroke: p.color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
      const shape = (cut) => { const d = pathUpTo(pts, cut); line.setAttribute('d', d); fill.setAttribute('d', `${d} V${area.bottom} H${area.left} Z`); };
      shape(Infinity);
      A.tween(200 + i * 700, 900, (t) => shape(area.left + t * (area.right - area.left)), (t) => t);
      st(svg, area.left, area.bottom + 16, '0', { 'font-size': 11.5, fill: muted });
      st(svg, area.right, area.bottom + 16, `${p.end} ${T.shortUnit}`, { 'font-size': 11.5, 'text-anchor': 'end', fill: muted });
      fit(st(svg, area.left, area.bottom + 36, T.shortNotes[i], { 'font-size': 12, fill: sub }), PW - area.left - 3);
      const extras = [];
      if (p.key === 'full') {   // where the prefix sits in the full schedule
        const end = Math.max(x(2000 / LAST), area.left + 7), mark = s('g', {}, svg);
        s('rect', { x: area.left, y: y(1) - 3, width: end - area.left, height: area.bottom - y(1) + 3, fill: css('--chart-line'), 'fill-opacity': 0.85 }, mark);
        s('path', { d: `M${end + 3},${y(0.52)} h10`, stroke: muted, 'stroke-width': 1, fill: 'none' }, mark);
        st(mark, end + 16, y(0.52) + 4, T.shortPrefix, { 'font-size': 11.5, fill: sub });
        extras.push(mark);
      } else {
        const chip = s('g', {}, svg), label = T.shortScore(p.score.toFixed(2));
        const text = st(chip, 0, 0, label, { 'font-size': 12.5, 'font-weight': 650, fill: ink });
        const w = text.getComputedTextLength() + 38, cx = p.decay ? area.left + 6 : (area.left + area.right - w) / 2, cy = y(p.decay ? 0.19 : 0.5);
        const pill = s('rect', { x: cx, y: cy - 13, width: w, height: 26, rx: 13, fill: surface, stroke: p.color, 'stroke-width': 1.2 }, chip);
        chip.insertBefore(pill, text);
        s('circle', { cx: cx + 14, cy, r: 7, fill: p.color }, chip);
        s('path', { d: p.ok ? `M${cx + 10.6},${cy + 0.2} l2.4,2.4 l4.2,-4.6` : `M${cx + 11},${cy - 3} l6,6 M${cx + 17},${cy - 3} l-6,6`, fill: 'none', stroke: css('--on-fill'), 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, chip);
        text.setAttribute('x', cx + 27); text.setAttribute('y', cy + 4.5);
        extras.push(chip);
      }
      A.fade(extras, 1000 + i * 700, 450);
    });
  }

  // ---------- figure: short-run rank against final rank ----------
  function drawSlope(host, ctx) {
    const W = ctx.W, small = W < 560, rows = D.proxy.methods;
    const ROW = small ? 28 : 31, TOP = 56, H = TOP + (rows.length - 1) * ROW + 22;
    const lx = small ? 122 : 196, rx = small ? W - 62 : W - 214;
    const svg = svgRoot(W, H, T.slopeAria);
    host.appendChild(svg);
    const A = ctx.timeline(svg, 'slope');
    const y = (rank) => TOP + (rank - 1) * ROW;
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    const COLOR = { base: css('--fam-base'), loop: css('--fam-loop'), linear: css('--fam-linear') };
    // Column heads sit over the rank numbers; on narrow layouts the right one is flush with the right edge.
    [[lx + 6, 'end', T.slopeHead[0]], small ? [W, 'end', T.slopeHead[1]] : [rx - 6, 'start', T.slopeHead[1]]].forEach(([x, anchor, [title, note]]) => {
      const room = anchor === 'start' ? W - x : x === W ? W - lx - 16 : x;
      fit(st(svg, x, 14, title, { 'font-size': 12.5, 'font-weight': 650, fill: ink, 'text-anchor': anchor }), room);
      fit(st(svg, x, 30, note, { 'font-size': 11, fill: muted, 'text-anchor': anchor }), room);
    });
    for (let rank = 1; rank <= rows.length; rank++) s('line', { x1: lx, y1: y(rank), x2: rx, y2: y(rank), stroke: css('--grid') }, svg);
    const DELAY = { base: 150, loop: 550, linear: 950 };
    const seen = { base: 0, loop: 0, linear: 0 };
    for (const family of ['base', 'loop', 'linear']) {
      for (const row of rows.filter((r) => r.family === family)) {
        const color = COLOR[family], y0 = y(row.shortRank), y1 = y(row.finalRank), move = row.shortRank - row.finalRank;
        const delay = DELAY[family] + (seen[family]++) * 70;
        const group = s('g', { class: 'series', 'data-key': row.id }, svg);
        const line = s('path', { d: `M${lx},${y0} L${rx},${y1}`, fill: 'none', stroke: color, 'stroke-width': family === 'base' ? 1.8 : 2.2, 'stroke-linecap': 'butt' }, group);
        const left = s('g', {}, group), right = s('g', {}, group);
        s('circle', { cx: lx, cy: y0, r: 4.5, fill: color, stroke: surface, 'stroke-width': 2 }, left);
        st(left, lx - 12, y0 + 4, row.shortRank, { 'font-size': 12, 'text-anchor': 'end', fill: ink, 'font-weight': 600 });
        fit(st(left, lx - 34, y0 + 4, nameOf(row.id), { 'font-size': small ? 11.5 : 12.5, 'text-anchor': 'end', fill: sub }), lx - 36);
        s('circle', { cx: rx, cy: y1, r: 4.5, fill: color, stroke: surface, 'stroke-width': 2 }, right);
        st(right, rx + 12, y1 + 4, row.finalRank, { 'font-size': 12, fill: ink, 'font-weight': 600 });
        const change = move === 0 ? '—' : move > 0 ? `↑${move}` : `↓${-move}`;
        if (small) st(right, W - 2, y1 + 4, change, { 'font-size': 12, 'text-anchor': 'end', fill: move ? sub : muted });
        else {
          st(right, rx + 34, y1 + 4, nameOf(row.id), { 'font-size': 12.5, fill: sub });
          st(right, W - 2, y1 + 4, change, { 'font-size': 12.5, 'text-anchor': 'end', fill: move ? ink : muted, 'font-weight': move ? 600 : 400 });
        }
        const hit = s('path', { class: 'hit', d: `M${small ? 0 : lx - 150},${y0} L${lx},${y0} L${rx},${y1} L${W},${y1}`, fill: 'none', stroke: 'transparent', 'stroke-width': 16 }, group);
        hoverMark(svg, hit, row.id, () => ({ title: `${nameOf(row.id)} · ${T.slopeTip(row.shortRank, row.finalRank)}`, rows: [{ label: T.slopeShort, value: row.short.toFixed(4) }] }));
        A.fade(left, delay - 150, 320);
        A.draw(line, delay, 720);
        A.fade(right, delay + 560, 360);
      }
    }
    host.appendChild(legend([[T.slopeLegend[0], COLOR.loop], [T.slopeLegend[1], COLOR.linear], [T.slopeLegend[2], COLOR.base]]));
  }

  // ---------- figure: how long a prefix has to be before its ranking can be trusted ----------
  function drawBacktest(host, ctx) {
    const W = ctx.W, small = W < 560, H = small ? 262 : 300;
    const ML = 44, MR = small ? 14 : 26, MT = 26, MB = 46;
    const area = { left: ML, right: W - MR, top: MT, bottom: H - MB };
    const rows = D.proxy.backtest;
    const svg = svgRoot(W, H, T.backAria);
    host.appendChild(svg);
    const A = ctx.timeline(svg, 'backtest');
    const lx = (v) => Math.log(v), xs = linear(lx(250), lx(LAST), area.left, area.right), x = (v) => xs(lx(v));
    const y = linear(0.3, 1.0, area.bottom, area.top);
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface'), blue = css('--chart-line'), red = css('--emph');
    st(svg, 0, 12, T.backY, { 'font-size': 11.5, fill: sub });
    for (const v of [0.4, 0.6, 0.8, 1.0]) {
      s('line', { x1: area.left, y1: y(v), x2: area.right, y2: y(v), stroke: css('--grid') }, svg);
      st(svg, area.left - 8, y(v) + 4, v.toFixed(1), { 'font-size': 12, 'text-anchor': 'end', fill: muted });
    }
    const ticks = [[250, '250'], [500, '500'], [1000, '1K'], [2000, '2K'], [4000, '4K'], [8000, '8K'], [16500, '16.5K'], [LAST, '46,875']];
    ticks.forEach(([v, label], i) => {
      s('line', { x1: x(v), y1: area.bottom, x2: x(v), y2: area.bottom + 4, stroke: css('--axis') }, svg);
      if (small && i % 2 === 1 && i !== ticks.length - 1) return;
      st(svg, x(v), area.bottom + 18, label, { 'font-size': 12, 'text-anchor': i === ticks.length - 1 ? 'end' : 'middle', fill: muted });
    });
    s('line', { x1: area.left, y1: area.bottom, x2: area.right, y2: area.bottom, stroke: css('--axis') }, svg);
    st(svg, (area.left + area.right) / 2, H - 6, T.backX, { 'font-size': 12, 'text-anchor': 'middle', fill: muted });
    // The bar the proxy had to clear.
    const bar = s('g', {}, svg);
    s('line', { x1: area.left, y1: y(0.85), x2: area.right, y2: y(0.85), stroke: sub, 'stroke-width': 1.2, 'stroke-dasharray': '5 3' }, bar);
    st(bar, area.right - 2, y(0.85) + 15, T.bar, { 'font-size': 12, 'text-anchor': 'end', fill: sub });
    A.fade(bar, 0, 400);
    const pts = rows.map(([step, sp]) => ({ step, v: sp, px: x(step), py: y(sp) }));
    const line = s('path', { d: fullPath(pts), fill: 'none', stroke: blue, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
    const dots = pts.map((p) => s('circle', { cx: p.px, cy: p.py, r: 3.6, fill: blue, stroke: surface, 'stroke-width': 2 }, svg));
    A.tween(250, 1500, (t) => {
      const cut = area.left + t * (area.right - area.left);
      line.setAttribute('d', pathUpTo(pts, cut));
      dots.forEach((dot, i) => dot.setAttribute('opacity', pts[i].px <= cut + 0.5 ? 1 : 0));
    }, (t) => t);
    const label = (step, dx, dy, anchor) => {
      const p = pts.find((q) => q.step === step);
      return st(svg, p.px + dx, p.py + dy, `${T.prefix(n(step))}  ${p.v.toFixed(2)}`, { 'font-size': 11.5, fill: ink, 'text-anchor': anchor || 'start', 'font-weight': 600 });
    };
    A.fade([label(500, 9, 17), label(2000, 9, 17)], 1750, 400);
    // The compressed 512-update schedule, measured in the proxy check.
    const cx = x(512), cy = y(D.proxy.spearman);
    const mark = s('g', {}, svg);
    s('path', { d: `M${cx},${cy - 7} L${cx + 7},${cy} L${cx},${cy + 7} L${cx - 7},${cy} Z`, fill: red, stroke: surface, 'stroke-width': 2 }, mark);
    st(mark, cx + 13, cy + 4, `${T.compressed}  ${D.proxy.spearman.toFixed(2)}`, { 'font-size': 11.5, fill: ink, 'font-weight': 600 });
    A.pop(mark, 1950, 420);
    crosshair(svg, area, rows.map((r) => r[0]), x, (step) => {
      const r = rows.find((q) => q[0] === step);
      return { title: step === LAST ? T.full : T.prefix(n(step)), rows: [{ color: blue, label: T.spearman, value: r[1].toFixed(2), py: y(r[1]) }, { label: T.pairAcc, value: r[2].toFixed(2) }] };
    }, W);
    const hit = s('circle', { class: 'hit', cx, cy, r: 13, fill: 'transparent' }, svg);
    hoverMark(svg, hit, null, () => ({ title: T.compressed, rows: [{ color: red, label: T.spearman, value: D.proxy.spearman.toFixed(2) }, { label: T.pairAcc, value: `${D.proxy.pairAccuracy.toFixed(2)} (${D.proxy.pairs - D.proxy.wrongPairs}/${D.proxy.pairs})` }] }));
  }

  // ---------- curve panels ----------
  // One panel of differences by update. Wide panels label each series at its right end; narrow panels are plot-only and
  // list the series in a legend below. Stages draw one after another; a playhead follows the sweep.
  function curvePanel(host, ctx, opts) {
    const { title, series, value, label, lo, hi, winner, marks, key, zeroLabel } = opts;
    const stages = opts.stages || [series];
    const W = opts.W || ctx.W, wide = W >= 640, compact = opts.compact;
    const H = compact ? 214 : wide ? 286 : 240;
    const ML = compact ? 46 : 52, MR = compact ? 12 : wide ? 212 : 14, MT = 12, MB = compact ? 30 : 36;
    const area = { left: ML, right: W - MR, top: MT, bottom: H - MB };
    const box = h('div', { class: 'panel' });
    if (title) box.appendChild(h('div', { class: 'fig-title', text: title }));
    host.appendChild(box);
    const svg = svgRoot(W, H, title || opts.aria);
    box.appendChild(svg);
    const A = ctx.timeline(svg, key);
    const x = linear(512, 2000, area.left, area.right), y = linear(lo, hi, area.bottom, area.top);
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    // The band two identical runs fall into, then the grid.
    s('rect', { x: area.left, y: y(DELTA), width: area.right - area.left, height: y(-DELTA) - y(DELTA), fill: css('--wash') }, svg);
    for (let v = lo; v <= hi + 1e-9; v += 0.001) {
      const yy = y(v), zero = Math.abs(v) < 1e-9, labelled = Math.round(v * 1000) % 2 === 0;
      if (zero && zeroLabel) {
        s('line', { x1: area.left, y1: yy, x2: area.right, y2: yy, stroke: css('--neutral-mark'), 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, svg);
      } else s('line', { x1: area.left, y1: yy, x2: area.right, y2: yy, stroke: zero ? css('--axis') : css('--grid') }, svg);
      if (labelled || zero || compact) st(svg, area.left - 8, yy + 4, zero ? '0' : signed(v, 3), { 'font-size': 12, 'text-anchor': 'end', fill: zero ? ink : muted, 'font-weight': zero ? 650 : 400 });
    }
    const ticks = compact || !wide ? [512, 1024, 1536, 2000] : STEPS;   // fewer labels where they would collide
    for (const step of ticks) st(svg, x(step), area.bottom + 17, n(step), { 'font-size': 12, 'text-anchor': step === 2000 && !wide ? 'end' : 'middle', fill: muted });
    if (!compact) st(svg, area.right, area.bottom + 32, T.updates, { 'font-size': 12, 'text-anchor': 'end', fill: muted });
    for (const mark of marks || []) {
      const g = s('g', {}, svg);
      s('line', { x1: x(mark.step), y1: area.top, x2: x(mark.step), y2: area.bottom, stroke: sub, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, g);
      st(g, x(mark.step) - 6, area.top + 11, mark.text, { 'font-size': 12, 'text-anchor': 'end', fill: sub });
      A.fade(g, mark.delay || 0, 400);
    }
    const ends = [];
    if (winner) {
      const wy = y(LINE - ANCHOR);
      s('line', { x1: x(1792), y1: wy, x2: x(2000), y2: wy, stroke: sub, 'stroke-width': 1.2, 'stroke-dasharray': '5 3' }, svg);
      ends.push({ y: wy, d: LINE - ANCHOR, color: sub, text: `${T.winnerLine}  ${signed(LINE - ANCHOR)}`, muted: true, kind: 'dash' });
    }
    // Series, first-listed on top.
    const drawn = {};
    for (const m of [...series].reverse()) {
      const pts = STEPS.map((step) => ({ step, d: value(m, step), px: x(step), py: y(value(m, step)) }));
      const color = (opts.color || colorOf)(m), minor = !SLOT[m] && m !== 'attnres';
      const group = s('g', { class: 'series', 'data-key': m }, svg);
      const path = s('path', { d: fullPath(pts), fill: 'none', stroke: color, 'stroke-width': minor ? 1.6 : 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, group);
      if (m === 'attnres') path.setAttribute('stroke-dasharray', '6 4');   // the reference model, dashed as on the observatory
      const last = pts[pts.length - 1];
      const dot = s('circle', { cx: last.px, cy: last.py, r: 4, fill: color, stroke: surface, 'stroke-width': 2 }, group);
      drawn[m] = { pts, path, dot, color };
      ends.push({ key: m, y: last.py, d: last.d, color, text: `${label(m)}  ${signed(last.d)}`, kind: m === 'attnres' ? 'dash' : '' });
    }
    // Sweep: each stage draws its series left to right, with a playhead that names the update it has reached.
    const head = s('g', { opacity: 0, 'pointer-events': 'none' }, svg);
    const rule = s('line', { y1: area.top, y2: area.bottom, stroke: muted, 'stroke-width': 1 }, head);
    const tag = st(head, 0, area.top - 2, '', { 'font-size': 12, fill: sub, 'text-anchor': 'middle' });
    const SWEEP = opts.sweep || 1900, PAUSE = 350;
    const stageEnd = {};
    stages.forEach((members, i) => {
      const delay = 200 + i * (SWEEP + PAUSE);
      members.forEach((m) => { stageEnd[m] = delay + SWEEP; });
      A.tween(delay, SWEEP, (t) => {
        const cut = area.left + t * (area.right - area.left);
        for (const m of members) { drawn[m].path.setAttribute('d', pathUpTo(drawn[m].pts, cut)); drawn[m].dot.setAttribute('opacity', t >= 1 ? 1 : 0); }
        const step = Math.round((512 + t * (2000 - 512)) / 8) * 8;
        rule.setAttribute('x1', cut); rule.setAttribute('x2', cut);
        tag.setAttribute('x', clamp(cut, area.left + 30, area.right - 30));
        tag.textContent = T.stepAt(n(Math.min(2000, step)));
        head.setAttribute('opacity', t > 0 && t < 1 ? 1 : 0);
      }, (t) => t);
    });
    ends.sort((a, b) => a.y - b.y);
    if (wide && !compact) {
      const GAPY = 16;
      ends.forEach((e, i) => { e.ly = i ? Math.max(e.y, ends[i - 1].ly + GAPY) : Math.max(e.y, area.top + 4); });
      for (let i = ends.length - 1; i >= 0; i--) ends[i].ly = Math.min(ends[i].ly, i === ends.length - 1 ? area.bottom : ends[i + 1].ly - GAPY);
      const lx = area.right + 24;
      for (const e of ends) {
        const g = s('g', { class: 'series', 'data-key': e.key || '' }, svg);
        s('path', { d: `M${x(2000) + 7},${e.y} L${lx - 12},${e.y} L${lx - 4},${e.ly}`, fill: 'none', stroke: e.color, 'stroke-width': 1 }, g);
        const text = st(g, lx, e.ly + 4, e.text, { 'font-size': 11.5, fill: e.muted ? sub : ink });
        fit(text, W - lx - 2);
        if (e.key) hoverMark(svg, g, e.key);
        A.fade(g, e.key ? stageEnd[e.key] - 100 : 200, 420);
      }
    }
    crosshair(svg, area, STEPS, x, (step) => ({
      title: T.stepAt(n(step)),
      rows: series.map((m) => ({ key: m, color: drawn[m].color, label: label(m), value: signed(value(m, step)), py: y(value(m, step)), v: value(m, step) })).sort((a, b) => a.v - b.v),
    }), W);
    if (!wide && !compact) box.appendChild(legend([...ends].sort((a, b) => a.d - b.d).map((e) => [e.text, e.color, e.kind || '', e.key])));
    return ends;
  }
  const range = (values) => [Math.floor((Math.min(...values) - 0.0004) / 0.001) * 0.001, Math.ceil((Math.max(...values) + 0.0004) / 0.001) * 0.001];
  const noiseLegend = () => [T.noiseBand, css('--wash'), 'band'];

  // One figure per round. Both use the same vertical range, so the two figures can be compared.
  const ROUNDS = [
    ['attnres_gate', 'attnres_full', 'attnres_canon', 'attnres_ve_all', 'attnres_deep'],
    ['attnres_canon_abcd', 'attnres_full_canon', 'attnres_full_gate', 'attnres_gate_canon', 'attnres_moe16', 'attnres_moe'],
  ];
  const drawRound = (index) => (host, ctx) => {
    const value = (m, step) => devAt(m, step) - devAt('attnres', step);
    const [lo, hi] = range(ROUNDS.flat().flatMap((m) => STEPS.map((step) => value(m, step))).concat([0, LINE - ANCHOR]));
    curvePanel(host, ctx, { key: `round${index + 1}`, aria: T.roundAria[index], series: ROUNDS[index], value, label: nameOf, lo, hi, winner: true, zeroLabel: true });
    host.appendChild(legend([[T.zeroRef('Block AttnRes'), css('--neutral-mark'), 'dash'], noiseLegend()]));
  };

  // The effect of adding one change to three different bases, by update: one small panel per change.
  function drawMarginal(host, ctx) {
    const PANELS = [
      { key: 'full', pairs: [['attnres', 'attnres_full'], ['attnres_canon', 'attnres_full_canon'], ['attnres_gate', 'attnres_full_gate']] },
      { key: 'canon', pairs: [['attnres', 'attnres_canon'], ['attnres_full', 'attnres_full_canon'], ['attnres_gate', 'attnres_gate_canon']] },
      { key: 'gate', pairs: [['attnres', 'attnres_gate'], ['attnres_full', 'attnres_full_gate'], ['attnres_canon', 'attnres_gate_canon']] },
    ];
    const three = ctx.W >= 640, GAP = 20;
    const PW = three ? Math.floor((ctx.W - 2 * GAP) / 3) : ctx.W;
    const wrap = h('div', { class: 'panels' });
    if (three) { wrap.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))'; wrap.style.columnGap = `${GAP}px`; }
    host.appendChild(wrap);
    const all = PANELS.flatMap((p) => p.pairs.flatMap(([base, with_]) => STEPS.map((step) => devAt(with_, step) - devAt(base, step))));
    const [lo, hi] = range(all.concat([0]));
    PANELS.forEach((p, i) => {
      const target = Object.fromEntries(p.pairs);
      curvePanel(wrap, ctx, {
        key: `marginal-${p.key}`, W: PW, compact: true, title: T.marginalPanels[i], sweep: 1700,
        series: p.pairs.map(([base]) => base), value: (base, step) => devAt(target[base], step) - devAt(base, step),
        label: (base) => T.onBase(nameOf(base)), lo, hi, winner: false,
      });
    });
    const bases = ['attnres', 'attnres_full', 'attnres_canon', 'attnres_gate'];
    host.appendChild(legend(bases.map((b) => [T.onBase(nameOf(b)), colorOf(b), b === 'attnres' ? 'dash' : '']).concat([noiseLegend()])));
  }

  function drawBasis(host, ctx) {
    const series = ['attnres_full_canon_abcd', 'attnres_full_canon', 'attnres_canon_abcd'];
    const value = (m, step) => devAt(m, step) - devAt('attnres_canon', step);
    const [lo, hi] = range(series.flatMap((m) => STEPS.map((step) => value(m, step))).concat([0]));
    curvePanel(host, ctx, {
      key: 'basis', aria: T.basisAria, series, value, label: (m) => T.basisNames[m], lo, hi, winner: false, sweep: 1500, zeroLabel: true,
      stages: [['attnres_full_canon', 'attnres_canon_abcd'], ['attnres_full_canon_abcd']],
      marks: [{ step: 1536, text: T.decided, delay: 200 + 1500 * ((1536 - 512) / (2000 - 512)) }],
    });
    host.appendChild(legend([[T.zeroRef('Canon-A/C'), css('--neutral-mark'), 'dash'], noiseLegend()]));
  }

  // ---------- figure: mechanism (two schematic panels, side by side on wide containers and stacked on narrow ones) ----------
  // Each panel is designed 336 wide: two of them fit the text column at about full size, and one fits a phone.
  function drawMechanism(host, ctx) {
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted');
    const depth = css('--series-6'), canon = css('--series-7');
    const stacked = ctx.W < 640, MW = 336;
    const wrap = h('div', { class: 'mech flowing' });
    if (stacked) wrap.style.display = 'block';
    host.appendChild(wrap);
    const panelSvg = (cls, H, label, tag, colors) => {
      const box = h('div', { class: cls }, [h('div', { class: 'fig-title', text: label })]);
      if (stacked && cls === 'mech-b') Object.assign(box.style, { borderLeft: '0', paddingLeft: '0', marginLeft: '0', borderTop: `1px solid ${css('--grid')}`, marginTop: '12px', paddingTop: '14px' });
      const svg = svgRoot(MW, H, label);
      svg.style.maxWidth = stacked ? '400px' : '372px';   // keep the schematic near its drawn size
      svg.style.margin = '0 auto';
      const defs = s('defs', {}, svg);
      for (const [name, color] of colors) {
        const marker = s('marker', { id: `arr-${name}-${tag}`, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 6.5, markerHeight: 6.5, orient: 'auto-start-reverse' }, defs);
        s('path', { d: 'M0,0 L8,4 L0,8 z', fill: color }, marker);
      }
      box.appendChild(svg);
      wrap.appendChild(box);
      return svg;
    };

    // Left panel: depth reads. Dashes travel along each read toward the softmax mix.
    const left = panelSvg('mech-a', 366, T.mechLeft, 'a', [['ink', sub], ['depth', depth]]);
    const ly = (i) => 296 - i * 27, BW = 44, BH = 20;
    const stack = (x0, mx, title, caption, full) => {
      const my = 102, R = 21, target = { x: mx - 40, y: 28, w: 80, h: 24 }, mid = (x0 + target.x + target.w) / 2;
      st(left, mid, 14, title, { 'font-size': 12.5, 'font-weight': 650, 'text-anchor': 'middle', fill: ink });
      s('rect', { x: target.x, y: target.y, width: target.w, height: target.h, rx: 5, fill: css('--wash'), stroke: css('--axis') }, left);
      fit(st(left, mx, target.y + 16, T.sublayerInput, { 'font-size': 11.5, 'text-anchor': 'middle', fill: ink }), target.w - 6);
      s('line', { x1: mx, y1: my - R, x2: mx, y2: target.y + target.h + 3, stroke: sub, 'stroke-width': 1.5, 'marker-end': 'url(#arr-ink-a)' }, left);
      T.layers.forEach((name, i) => {
        s('rect', { x: x0, y: ly(i) - BH / 2, width: BW, height: BH, rx: 4, fill: css('--wash'), stroke: css('--axis') }, left);
        st(left, x0 + BW / 2, ly(i) + 4, name, { 'font-size': 11, 'text-anchor': 'middle', fill: sub });
      });
      const into = (x, yy, color, marker) => {
        const d = `M${x},${yy} C${x + (mx - x) * 0.55},${yy} ${mx - 28},${my + 36} ${mx - 13},${my + 17}`;
        s('path', { d, fill: 'none', stroke: color, 'stroke-width': 1.4, opacity: 0.4, 'marker-end': `url(#arr-${marker}-a)` }, left);
        s('path', { class: 'flow', d, fill: 'none', stroke: color, 'stroke-width': 1.9, 'stroke-linecap': 'round' }, left);
      };
      if (full) T.layers.forEach((_, i) => into(x0 + BW + 2, ly(i), depth, 'depth'));
      else {
        into(x0 + BW + 2, ly(0), sub, 'ink');
        [[1, 3, T.groups[0]], [4, 6, T.groups[1]], [7, 8, T.groups[2]]].forEach(([a, b, label]) => {
          const top = ly(b) - BH / 2, bottom = ly(a) + BH / 2, x = x0 + BW + 4;
          s('path', { d: `M${x},${top} h5 V${bottom} h-5`, fill: 'none', stroke: sub, 'stroke-width': 1.2 }, left);
          into(x + 6, (top + bottom) / 2, sub, 'ink');
          fit(st(left, x0 - 5, (top + bottom) / 2 + 4, label, { 'font-size': 10.5, 'text-anchor': 'end', fill: muted }), x0 - 6);
        });
      }
      s('circle', { cx: mx, cy: my, r: R, fill: css('--surface'), stroke: full ? depth : sub, 'stroke-width': 1.5 }, left);
      st(left, mx, my + 3.5, 'softmax', { 'font-size': 9.5, 'text-anchor': 'middle', fill: sub });
      st(left, mid, 354 - (caption.split('\n').length - 1) * 14, caption, { 'font-size': 11, 'text-anchor': 'middle', fill: sub });
    };
    stack(46, 152, 'Block AttnRes', T.blockCaption, false);
    stack(210, 296, 'Full AttnRes', T.fullCaption, true);

    // Right panel: Canon positions, and one Canon layer as a window that slides along the sequence.
    const right = panelSvg('mech-b', 366, T.mechRight, 'b', [['ink', sub], ['canon', canon]]);
    const chain = (yy, title, items) => {
      st(right, 0, yy - 23, title, { 'font-size': 12, 'font-weight': 600, fill: sub });
      const GAP = 10, total = items.reduce((sum, item) => sum + item[2], 0) + GAP * (items.length - 1);
      const k = Math.min(1, (MW - 2) / total);   // narrow every box a little if the chain would not fit
      let x = 0;
      items.forEach(([label, kind, width], i) => {
        const w = width * k, color = kind === 'canon' ? canon : kind === 'depth' ? depth : css('--axis');
        s('rect', { x: x + 0.8, y: yy - 13, width: w, height: 26, rx: 5, fill: kind ? css('--surface') : css('--wash'), stroke: color, 'stroke-width': kind ? 1.6 : 1 }, right);
        if (kind) s('rect', { x: x + 0.8, y: yy - 13, width: w, height: 26, rx: 5, fill: color, opacity: 0.12 }, right);
        fit(st(right, x + 0.8 + w / 2, yy + 4, label, { 'font-size': 11, 'text-anchor': 'middle', fill: ink, 'font-weight': kind === 'canon' ? 600 : 400 }), w - 5);
        if (i < items.length - 1) s('line', { x1: x + w + 2, y1: yy, x2: x + w + GAP * k - 1, y2: yy, stroke: sub, 'stroke-width': 1.2, 'marker-end': 'url(#arr-ink-b)' }, right);
        x += w + GAP * k;
      });
    };
    chain(38, T.attnChain[0], T.attnChain[1]);
    chain(104, T.mlpChain[0], T.mlpChain[1]);
    fit(st(right, 0, 156, T.canonInset, { 'font-size': 12, 'font-weight': 600, fill: sub }), MW - 2);
    const TW = 36, TG = 7, X = (i) => 34 + i * (TW + TG), SUBSCRIPT = '₁₂₃₄₅₆₇';
    st(right, 0, 192, T.rowIn, { 'font-size': 11, fill: muted });
    st(right, 0, 266, T.rowOut, { 'font-size': 11, fill: muted });
    for (let i = 0; i < 7; i++) {
      s('rect', { x: X(i), y: 175, width: TW, height: 24, rx: 4, fill: css('--wash'), stroke: css('--axis') }, right);
      st(right, X(i) + TW / 2, 191, `x${SUBSCRIPT[i]}`, { 'font-size': 11.5, 'text-anchor': 'middle', fill: sub });
      s('rect', { x: X(i), y: 249, width: TW, height: 24, rx: 4, fill: css('--wash'), stroke: css('--axis') }, right);
      st(right, X(i) + TW / 2, 265, `y${SUBSCRIPT[i]}`, { 'font-size': 11.5, 'text-anchor': 'middle', fill: sub });
    }
    // The window covers four inputs and feeds the output under its right end.
    const win = s('g', { 'pointer-events': 'none' }, right);
    s('rect', { x: X(0) - 3.5, y: 171, width: 4 * TW + 3 * TG + 7, height: 32, rx: 7, fill: canon, 'fill-opacity': 0.1, stroke: canon, 'stroke-width': 1.8 }, win);
    for (let k = 0; k < 4; k++) s('line', { x1: X(k) + TW / 2, y1: 205, x2: X(3) + TW / 2 + (k - 3) * 3, y2: 244, stroke: canon, 'stroke-width': 1.5, 'marker-end': 'url(#arr-canon-b)' }, win);
    s('rect', { x: X(3) - 3, y: 246, width: TW + 6, height: 30, rx: 6, fill: canon, 'fill-opacity': 0.14, stroke: canon, 'stroke-width': 1.8 }, win);
    T.canonNotes.forEach((line, i) => fit(st(right, 0, 304 + i * 16, line, { 'font-size': 11, fill: sub }), MW - 2));
    const STEP = TW + TG, LASTX = 3 * STEP;
    let slide = null;
    if (motionOK() && win.animate) {
      const at = (dx, opacity = 1) => ({ transform: `translateX(${dx}px)`, opacity });
      slide = win.animate([
        { ...at(0), offset: 0 }, { ...at(0), offset: 0.145 }, { ...at(STEP), offset: 0.226 }, { ...at(STEP), offset: 0.371 },
        { ...at(2 * STEP), offset: 0.452 }, { ...at(2 * STEP), offset: 0.597 }, { ...at(LASTX), offset: 0.677 }, { ...at(LASTX), offset: 0.871 },
        { ...at(LASTX, 0), offset: 0.919 }, { ...at(0, 0), offset: 0.92 }, { ...at(0), offset: 1 },
      ], { duration: 6200, iterations: Infinity, easing: 'ease-in-out' });
      slide.pause();
    } else win.setAttribute('transform', `translate(${LASTX},0)`);
    wrap.classList.add('is-paused');
    ctx.loop(wrap, (on) => { wrap.classList.toggle('is-paused', !on); if (slide) { if (on) slide.play(); else slide.pause(); } }, () => { if (slide) slide.cancel(); });
    host.appendChild(legend([[T.mechLegend[0], depth, 'rect'], [T.mechLegend[1], canon, 'rect']]));
  }

  // ---------- figure: the result among the published runs ----------
  function drawContext(host, ctx) {
    const two = ctx.W >= 640, WA = ctx.W;   // one panel at the full width of the card
    const wrap = h('div', { class: 'panels' });
    host.appendChild(wrap);
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    const blue = css('--series-1'), gray = css('--series-other'), dark = css('--neutral-mark');

    // (a) CORE against validation BPB; the BPB axis runs right to left so that better is up and to the right.
    {
      const W = WA, H = two ? 360 : 320, ML = 40, MR = 12, MT = 14, MB = 44, ROOM = two ? 120 : 96;
      const area = { left: ML, right: W - MR, top: MT, bottom: H - MB };
      const box = h('div', { class: 'panel' }, [h('div', { class: 'fig-title', text: T.scatterTitle(D.published.length) }), h('div', { class: 'fig-sub', text: T.scatterSub })]);
      wrap.appendChild(box);
      const svg = svgRoot(W, H, T.contextAria);
      box.appendChild(svg);
      const A = ctx.timeline(svg, 'scatter');
      const x = linear(0.72, 0.658, area.left + 6, area.right - ROOM), y = linear(22, 38, area.bottom, area.top);
      for (const v of [24, 28, 32, 36]) {
        s('line', { x1: area.left, y1: y(v), x2: area.right, y2: y(v), stroke: css('--grid') }, svg);
        st(svg, area.left - 8, y(v) + 4, v, { 'font-size': 12, 'text-anchor': 'end', fill: muted });
      }
      s('line', { x1: area.left, y1: area.bottom, x2: area.right, y2: area.bottom, stroke: css('--axis') }, svg);
      for (const v of [0.72, 0.71, 0.70, 0.69, 0.68, 0.67, 0.66]) {
        s('line', { x1: x(v), y1: area.bottom, x2: x(v), y2: area.bottom + 4, stroke: css('--axis') }, svg);
        if (W < 420 && Math.round(v * 100) % 2 === 1) continue;
        st(svg, x(v), area.bottom + 18, v.toFixed(2), { 'font-size': 12, 'text-anchor': 'middle', fill: muted });
      }
      st(svg, (area.left + area.right - ROOM) / 2, H - 6, T.scatterX, { 'font-size': 12, 'text-anchor': 'middle', fill: muted });
      st(svg, area.left + 4, area.top + 9, T.scatterY, { 'font-size': 12, fill: muted });
      const dense = D.published.find((r) => r.id === 'dense_full');
      if (dense) {
        const guide = s('g', {}, svg);
        s('line', { x1: area.left, y1: y(dense.core), x2: area.right, y2: y(dense.core), stroke: css('--axis'), 'stroke-width': 1.2, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }, guide);
        s('line', { x1: x(dense.bpb), y1: area.top, x2: x(dense.bpb), y2: area.bottom, stroke: css('--axis'), 'stroke-width': 1.2, 'stroke-dasharray': '1 5', 'stroke-linecap': 'round' }, guide);
        st(guide, area.right - 2, area.top + 10, `${T.better} ↗`, { class: 'note', 'font-size': 13, 'text-anchor': 'end', fill: css('--emph') });
        A.fade(guide, 0, 500);
      }
      // Labels: [dx, dy] from the dot; the lower-BPB side of the cloud is empty, so labels sit to the right.
      const LABEL = { attnres_full_canon_abcd: [11, 4], mhc: [11, 9], attnres: [10, 6], dense_full: [15, 22] };
      const rank = (r) => (r.id === 'attnres_full_canon_abcd' ? 2 : LABEL[r.id] ? 1 : 0);
      const rows = [...D.published].sort((a, b) => rank(a) - rank(b) || b.bpb - a.bpb);
      rows.forEach((r, i) => {
        const main = r.id === 'attnres_full_canon_abcd', named = Boolean(LABEL[r.id]);
        const cx = x(r.bpb), cy = y(r.core);
        const g = s('g', { class: 'series', 'data-key': r.id }, svg);
        if (main) s('circle', { cx, cy, r: 11, fill: css('--emph'), 'fill-opacity': 0.16, stroke: css('--emph'), 'stroke-width': 1.2 }, g);
        const dot = s('circle', { cx, cy, r: main ? 6.5 : named ? 4.6 : 4, fill: main ? blue : named ? dark : gray, stroke: surface, 'stroke-width': main ? 2 : 1.5 }, g);
        if (named) {
          const [dx, dy] = LABEL[r.id];
          if (r.id === 'dense_full') s('line', { x1: cx + 4, y1: cy + 4, x2: cx + dx - 2, y2: cy + dy - 6, stroke: muted, 'stroke-width': 1 }, g);
          const text = st(g, cx + dx, cy + dy, nameOf(r.id), { 'font-size': main ? 12.5 : 11.5, fill: main ? ink : sub, 'font-weight': main ? 700 : 500,
            stroke: surface, 'stroke-width': 3, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
          fit(text, W - (cx + dx) - 2);
        }
        const hit = s('circle', { class: 'hit', cx, cy, r: 11, fill: 'transparent' }, g);
        hoverMark(svg, hit, r.id, () => ({ title: NAME[r.id] ? nameOf(r.id) : r.name, rows: [{ label: T.scatterY, value: r.core.toFixed(2) }, { label: LANG === 'en' ? 'Validation BPB' : '验证 BPB', value: r.bpb.toFixed(4) }] }));
        if (main) A.pop(g, 1250, 520); else A.fade(g, named ? 900 : 120 + i * 22, 380);
      });
      box.appendChild(legend([['AttnRes-Canon', blue, 'dot'], [T.others, gray, 'dot']]));
    }

  }

  // ---------- figure: formal training, relative to Block AttnRes ----------
  function drawFormal(host, ctx) {
    const ref = Object.fromEntries(D.formal.attnres.val), mhc = Object.fromEntries(D.formal.mhc.val);
    const pts0 = D.formal.attnres_full_canon_abcd.val.filter(([step]) => step > 0 && ref[step] !== undefined)
      .map(([step, v]) => ({ step, d: v - ref[step], dm: mhc[step] !== undefined ? mhc[step] - ref[step] : undefined }));
    const coreRef = Object.fromEntries(D.formal.attnres.core), coreMhc = Object.fromEntries(D.formal.mhc.core);
    const core = D.formal.attnres_full_canon_abcd.core.map(([step, v]) => ({ step, d: v - coreRef[step], dm: coreMhc[step] - coreRef[step] }));
    const W = ctx.W, small = W < 560;
    const ML = small ? 48 : 58, MR = small ? 14 : 70;
    const LR = { top: 18, bottom: 44 }, PA = { top: 78, bottom: small ? 286 : 314 }, PB = { top: PA.bottom + 46, bottom: PA.bottom + (small ? 150 : 162) };
    const H = PB.bottom + 40;
    const svg = svgRoot(W, H, T.formalAria);
    host.appendChild(svg);
    const A = ctx.timeline(svg, 'formal');
    const x = linear(0, LAST, ML, W - MR);
    const ya = linear(-0.008, 0.001, PA.bottom, PA.top), yb = linear(-0.5, 2.5, PB.bottom, PB.top);
    const ink = css('--text-primary'), sub = css('--text-secondary'), muted = css('--text-muted'), surface = css('--surface');
    const blue = css('--series-1'), gray = css('--ref-mark');
    const clip = s('clipPath', { id: 'formal-plot' }, s('defs', {}, svg));   // early mHC values lie above the range
    s('rect', { x: ML, y: PA.top, width: W - MR - ML, height: PA.bottom - PA.top }, clip);
    // The decay phase shades all three bands.
    s('rect', { x: x(DECAY_START), y: LR.top, width: x(LAST) - x(DECAY_START), height: PB.bottom - LR.top, fill: css('--wash'), opacity: 0.6 }, svg);
    // Learning-rate strip: constant, then a linear decay.
    const lrY = linear(0, 1, LR.bottom, LR.top + 4);
    const lrPts = [{ px: x(0), py: lrY(1) }, { px: x(DECAY_START), py: lrY(1) }, { px: x(LAST), py: lrY(0.05) }];
    const lrArea = s('path', { fill: css('--lr-fill') }, svg);
    const lrLine = s('path', { d: fullPath(lrPts), fill: 'none', stroke: css('--lr-line'), 'stroke-width': 1.5 }, svg);
    const areaOf = (d) => `${d} V${LR.bottom} H${x(0)} Z`;
    lrArea.setAttribute('d', areaOf(fullPath(lrPts)));
    st(svg, ML - 8, LR.bottom - 8, T.lr, { 'font-size': 12, 'text-anchor': 'end', fill: muted });
    st(svg, x(DECAY_START / 2), LR.top - 5, T.lrFlat, { 'font-size': 12, 'text-anchor': 'middle', fill: sub });
    st(svg, x((DECAY_START + LAST) / 2), LR.top - 5, T.lrDecay, { 'font-size': 12, 'text-anchor': 'middle', fill: sub });
    // (a) validation BPB gap.
    st(svg, ML, PA.top - 10, T.formalA, { 'font-size': 12.5, 'font-weight': 650, fill: ink });
    for (let v = -0.008; v <= 0.001 + 1e-9; v += 0.002) {
      s('line', { x1: ML, y1: ya(v), x2: W - MR, y2: ya(v), stroke: css('--grid') }, svg);
      st(svg, ML - 8, ya(v) + 4, Math.abs(v) < 1e-9 ? '0' : signed(v, 3), { 'font-size': 12, 'text-anchor': 'end', fill: muted });
    }
    s('line', { x1: ML, y1: ya(0), x2: W - MR, y2: ya(0), stroke: css('--axis') }, svg);
    st(svg, W - MR - 4, ya(0) - 6, 'Block AttnRes', { 'font-size': 12, fill: sub, 'text-anchor': 'end' });
    const main = pts0.map((p) => ({ step: p.step, px: x(p.step), py: ya(p.d) }));
    const other = pts0.filter((p) => p.dm !== undefined).map((p) => ({ step: p.step, px: x(p.step), py: ya(p.dm) }));
    const wash = s('path', { fill: css('--chart-line'), opacity: 0.1, 'clip-path': 'url(#formal-plot)' }, svg);
    const otherLine = s('path', { d: fullPath(other), fill: 'none', stroke: gray, 'stroke-width': 1.5, 'stroke-linejoin': 'round', 'clip-path': 'url(#formal-plot)' }, svg);
    const mainLine = s('path', { d: fullPath(main), fill: 'none', stroke: blue, 'stroke-width': 2, 'stroke-linejoin': 'round', 'clip-path': 'url(#formal-plot)' }, svg);
    const washOf = (d, cut) => `${d} L${Math.min(cut, main[main.length - 1].px).toFixed(1)},${ya(0)} L${main[0].px.toFixed(1)},${ya(0)} Z`;
    wash.setAttribute('d', washOf(fullPath(main), Infinity));
    const notes = [];
    const endM = pts0.filter((p) => p.dm !== undefined).pop();
    notes.push(st(svg, x(endM.step) - 4, ya(endM.dm) - 7, `mHC ${signed(endM.dm)}`, { 'font-size': 12, fill: sub, 'text-anchor': 'end' }));
    const mark = (step, text, lx, lv, anchor) => {   // label at (lx updates, lv BPB), with a leader to the point
      const p = pts0.find((q) => q.step === step), g = s('g', {}, svg);
      s('line', { x1: x(p.step), y1: ya(p.d), x2: x(lx), y2: ya(lv) + 4, stroke: muted, 'stroke-width': 1 }, g);
      s('circle', { cx: x(p.step), cy: ya(p.d), r: 4, fill: blue, stroke: surface, 'stroke-width': 2 }, g);
      st(g, x(lx) + (anchor === 'end' ? -7 : 7), ya(lv), `${text} ${signed(p.d)}`, { 'font-size': 11.5, fill: ink, 'text-anchor': anchor || 'start', 'font-weight': 600 });
      notes.push(g);
    };
    mark(2000, T.markStep('2,000'), small ? 5600 : 4500, small ? -0.0011 : -0.0012);
    mark(16000, T.markStep('16,000'), 12500, -0.0076);
    mark(LAST, T.markEnd, 44500, small ? -0.0052 : -0.0042, 'end');
    // (b) CORE difference at the six evaluations.
    st(svg, ML, PB.top - 12, small ? T.formalBShort : T.formalB, { 'font-size': 12.5, 'font-weight': 650, fill: ink });
    for (const v of [0, 1, 2]) {
      s('line', { x1: ML, y1: yb(v), x2: W - MR, y2: yb(v), stroke: v ? css('--grid') : css('--axis') }, svg);
      st(svg, ML - 8, yb(v) + 4, v ? `+${v}` : '0', { 'font-size': 12, 'text-anchor': 'end', fill: muted });
    }
    const coreMain = core.map((p) => ({ step: p.step, px: x(p.step), py: yb(p.d), v: p.d }));
    const coreOther = core.map((p) => ({ step: p.step, px: x(p.step), py: yb(p.dm), v: p.dm }));
    const coreOtherLine = s('path', { d: fullPath(coreOther), fill: 'none', stroke: gray, 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, svg);
    const coreMainLine = s('path', { d: fullPath(coreMain), fill: 'none', stroke: blue, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    const coreDots = [];
    for (const [pts, color] of [[coreOther, gray], [coreMain, blue]]) for (const p of pts) coreDots.push({ p, node: s('circle', { cx: p.px, cy: p.py, r: 4, fill: color, stroke: surface, 'stroke-width': 2 }, svg) });
    const lastMain = coreMain[coreMain.length - 1], lastOther = coreOther[coreOther.length - 1], dip = coreMain[4];
    if (small) notes.push(st(svg, lastMain.px - 8, lastMain.py - 3, signed(lastMain.v, 1), { 'font-size': 11.5, 'text-anchor': 'end', fill: ink, 'font-weight': 600 }));
    else {
      notes.push(st(svg, lastMain.px + 9, lastMain.py + 4, signed(lastMain.v, 1), { 'font-size': 11.5, fill: ink, 'font-weight': 600 }));
      notes.push(st(svg, lastOther.px + 9, lastOther.py + 4, `mHC ${signed(lastOther.v, 1)}`, { 'font-size': 12, fill: sub }));
    }
    notes.push(st(svg, dip.px, dip.py + 16, signed(dip.v, 2), { 'font-size': 11.5, 'text-anchor': 'middle', fill: ink, 'font-weight': 600 }));
    // Shared x axis.
    for (const step of small ? [0, 10000, 20000, 30000, LAST] : [0, 10000, 20000, 30000, 40000, LAST]) {
      const last = step === LAST;
      st(svg, x(step), PB.bottom + 18, last ? '46,875' : step ? `${step / 1000}K` : '0', { 'font-size': 12, 'text-anchor': last ? 'end' : 'middle', fill: muted });
    }
    st(svg, (ML + W - MR) / 2, H - 5, T.updates, { 'font-size': 12, 'text-anchor': 'middle', fill: muted });
    // Sweep all three bands together.
    A.tween(200, 2400, (t) => {
      const cut = ML + t * (W - MR - ML);
      const d = pathUpTo(main, cut);
      mainLine.setAttribute('d', d);
      wash.setAttribute('d', washOf(d, cut));
      otherLine.setAttribute('d', pathUpTo(other, cut));
      const lr = pathUpTo(lrPts, cut);
      lrLine.setAttribute('d', lr);
      lrArea.setAttribute('d', `${lr} V${LR.bottom} H${x(0)} Z`);
      coreMainLine.setAttribute('d', pathUpTo(coreMain, cut));
      coreOtherLine.setAttribute('d', pathUpTo(coreOther, cut));
      coreDots.forEach(({ p, node }) => node.setAttribute('opacity', p.px <= cut + 0.5 ? 1 : 0));
    }, (t) => t);
    A.fade(notes, 2500, 450);
    const steps = pts0.map((p) => p.step);
    crosshair(svg, { left: ML, right: W - MR, top: PA.top, bottom: PB.bottom }, steps, x, (step) => {
      const p = pts0.find((q) => q.step === step);
      const rows = [{ color: blue, label: T.formalLegend[0], value: signed(p.d), py: ya(clamp(p.d, -0.008, 0.001)) }];
      if (p.dm !== undefined) rows.push({ color: gray, label: T.formalLegend[1], value: signed(p.dm), py: p.dm <= 0.001 ? ya(p.dm) : undefined });
      const event = core.find((c) => Math.abs(c.step - step) <= 125);
      if (event) rows.push({ color: blue, label: `CORE · AttnRes-Canon`, value: signed(event.d, 2), py: yb(event.d) }, { color: gray, label: 'CORE · mHC', value: signed(event.dm, 2), py: yb(event.dm) });
      return { title: T.stepAt(n(step)), rows };
    }, W);
    host.appendChild(legend([[T.formalLegend[0], blue], [T.formalLegend[1], gray]]));
  }

  // ---------- render ----------
  const FIGURES = {
    shorten: drawShorten, workflow: drawWorkflow, lineage: drawLineage, slope: drawSlope, backtest: drawBacktest, round1: drawRound(0), round2: drawRound(1),
    marginal: drawMarginal, basis: drawBasis, mechanism: drawMechanism, context: drawContext, formal: drawFormal,
  };
  const NO_REPLAY = new Set(['mechanism']);    // it loops while in view, so there is nothing to replay
  const state = new WeakMap();                 // host -> { played: Set, units: [], loops: [], width }
  const watcher = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const unit = entry.target.__unit;
      if (!unit) continue;
      if (unit.loop) { unit.loop(entry.isIntersecting); continue; }
      if (entry.isIntersecting) { unit.played.add(unit.key); unit.timeline.play(); watcher.unobserve(entry.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }) : null;

  function innerWidth(host) {
    const style = getComputedStyle(host);
    const width = host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return width > 80 ? Math.floor(width) : 820;
  }

  function render(host, mode) {   // mode: 'first' (animate once, when seen), 'static' or 'replay'
    const st8 = state.get(host) || { played: new Set(), units: [], loops: [] };
    st8.units.forEach((u) => { u.timeline.cancel(); if (watcher) watcher.unobserve(u.el); });
    st8.loops.forEach((l) => { l.stop(); if (watcher) watcher.unobserve(l.el); });
    st8.units = []; st8.loops = [];
    host.replaceChildren();
    const name = host.dataset.figure, animated = motionOK();
    const ctx = {
      W: innerWidth(host),
      timeline(el, key) {
        const enabled = animated && (mode === 'replay' || (mode === 'first' && !st8.played.has(key)));
        const timeline = new Timeline(enabled);
        if (enabled) st8.units.push({ el, key, timeline });
        return timeline;
      },
      loop(el, toggle, stop) { st8.loops.push({ el, toggle, stop }); },
    };
    st8.width = ctx.W;
    FIGURES[name](host, ctx);
    if (animated && !NO_REPLAY.has(name)) {
      const button = h('button', { class: 'fig-replay', type: 'button', title: T.replay, 'aria-label': T.replay });
      const icon = s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' }, button);
      s('path', { d: 'M13.2 8a5.2 5.2 0 1 1-1.6-3.75', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round' }, icon);
      s('path', { d: 'M13.6 1.9v3.2h-3.2', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, icon);
      button.addEventListener('click', () => render(host, 'replay'));
      // The button shares the last row of the card with the figure's legend, so it never covers the plot.
      const foot = h('div', { class: 'fig-foot' }), last = host.lastElementChild;
      if (last && last.classList.contains('legend')) foot.appendChild(last);
      foot.appendChild(button);
      host.appendChild(foot);
    }
    for (const unit of st8.units) {
      if (mode === 'replay' || !watcher) { st8.played.add(unit.key); unit.timeline.play(); continue; }
      unit.el.__unit = { key: unit.key, timeline: unit.timeline, played: st8.played };
      watcher.observe(unit.el);
    }
    for (const loop of st8.loops) {
      if (!watcher) { loop.toggle(true); continue; }
      loop.el.__unit = { loop: loop.toggle };
      watcher.observe(loop.el);
    }
    state.set(host, st8);
  }

  const hosts = [...document.querySelectorAll('[data-figure]')];
  hosts.forEach((host) => render(host, 'first'));
  // Colors are read from CSS when a figure is drawn, so a theme change redraws; so does a change of width.
  const redraw = () => hosts.forEach((host) => render(host, 'first'));
  document.addEventListener('blog:theme', redraw);
  REDUCED.addEventListener('change', redraw);
  if ('ResizeObserver' in window) {
    let pending = 0;
    const resized = new ResizeObserver(() => {
      clearTimeout(pending);
      pending = setTimeout(() => hosts.forEach((host) => { const st8 = state.get(host); if (st8 && Math.abs(innerWidth(host) - st8.width) > 2) render(host, 'first'); }), 140);
    });
    hosts.forEach((host) => resized.observe(host));
  }
  window.addEventListener('beforeprint', () => hosts.forEach((host) => render(host, 'static')));
})();
