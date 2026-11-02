// Echo, alternative home page: entrances once, and the tour's active row.
// Everything here is progressive: without script, every section shows in full.
(() => {
  const once = document.querySelectorAll('.changed-head, .demo, .steps, .changed .window, .private > *, .get, .tour');
  const show = (el) => el.classList.add('is-in');
  if (!('IntersectionObserver' in window)) { once.forEach(show); }
  else {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    once.forEach((el) => io.observe(el));
    addEventListener('load', () => setTimeout(() => once.forEach((el) => {
      const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el);
    }), 2500));
  }

  // tour: hover, focus, click or scroll a row to the middle to make it active
  const rows = [...document.querySelectorAll('.tour-list li')];
  const shots = [...document.querySelectorAll('.tour-pic .shot')];
  if (!rows.length) return;
  let current = rows[0];
  const activate = (li) => {
    if (li === current) return;
    current = li;
    rows.forEach((r) => {
      const on = r === li;
      r.classList.toggle('is-active', on);
      r.querySelector('button').setAttribute('aria-expanded', String(on));
    });
    shots.forEach((s) => s.classList.toggle('is-active', s.dataset.k === li.dataset.k));
    const d = document.querySelector('.tour-desc'); if (d) d.textContent = li.querySelector('p').textContent;
  };
  rows.forEach((li) => {
    const b = li.querySelector('button');
    b.addEventListener('click', () => activate(li));
    b.addEventListener('focus', () => activate(li));
  });
})();
