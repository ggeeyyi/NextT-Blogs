/* Page behavior for the blog post: theme toggle, reading progress, the section rail and entrance motion. Every part is
   an enhancement: without this script, in print or with reduced motion the article reads in full. Figures are drawn by
   figures.js, which listens for "blog:theme". */
(function () {
  'use strict';

  const root = document.documentElement;
  const EN = (root.lang || 'zh').toLowerCase().startsWith('en');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => !reduced.matches && 'IntersectionObserver' in window;

  // ---------- theme ----------
  const toggle = document.getElementById('theme-toggle');
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme || (dark.matches ? 'dark' : 'light')) === 'dark';
  const syncToggle = () => { if (toggle) toggle.textContent = isDark() ? (EN ? 'Light' : '浅色') : (EN ? 'Dark' : '深色'); };
  const announce = () => { syncToggle(); document.dispatchEvent(new CustomEvent('blog:theme')); };
  if (toggle) toggle.addEventListener('click', () => { root.dataset.theme = isDark() ? 'light' : 'dark'; announce(); });
  dark.addEventListener('change', announce);
  syncToggle();

  // ---------- reading progress ----------
  const bar = document.querySelector('.progress span');
  const article = document.querySelector('article');
  let ticking = false;
  function progress() {
    ticking = false;
    if (!bar || !article) return;
    const box = article.getBoundingClientRect();
    const total = box.height - window.innerHeight;
    const done = total > 0 ? Math.min(1, Math.max(0, -box.top / total)) : 0;
    bar.style.transform = `scaleX(${done.toFixed(4)})`;
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(progress); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  progress();

  // ---------- section rail: shown once the contents box has scrolled away, with the current section marked ----------
  const rail = document.querySelector('.rail');
  if (rail && 'IntersectionObserver' in window) {
    const links = new Map([...rail.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const toc = document.querySelector('.toc');
    function spy() {
      const line = window.innerHeight * 0.3;
      let current = null;
      for (const section of sections) if (section.getBoundingClientRect().top <= line) current = section.id;
      links.forEach((a, id) => a.classList.toggle('is-current', id === current));
      if (toc) rail.classList.toggle('is-on', toc.getBoundingClientRect().bottom < 0);
    }
    let spying = false;
    const onSpy = () => { if (!spying) { spying = true; requestAnimationFrame(() => { spying = false; spy(); }); } };
    window.addEventListener('scroll', onSpy, { passive: true });
    window.addEventListener('resize', onSpy, { passive: true });
    spy();
  }

  // ---------- entrance motion ----------
  const revealables = document.querySelectorAll('.abstract, .toc, .cards, figure');
  if (motion()) {
    root.classList.add('js-motion');
    revealables.forEach((node) => node.classList.add('reveal'));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach((node) => observer.observe(node));
    // Never leave content hidden if the observer does not fire (for example in a background tab that is then printed).
    window.addEventListener('beforeprint', () => revealables.forEach((node) => node.classList.add('is-in')));
  }
})();
