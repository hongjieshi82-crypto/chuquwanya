(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [...document.querySelectorAll('.slide')];

  if (!reduced) {
    addEventListener('pointermove', (event) => {
      const slide = document.querySelector('.slide.is-active');
      if (!slide) return;
      slide.style.setProperty('--mx', `${(event.clientX / innerWidth) * 100}%`);
      slide.style.setProperty('--my', `${(event.clientY / innerHeight) * 100}%`);

      const duck = slide.querySelector('.duck-stage img, .closing-duck img');
      if (duck) {
        const x = (event.clientX / innerWidth - 0.5) * 10;
        const y = (event.clientY / innerHeight - 0.5) * 7;
        duck.style.translate = `${x}px ${y}px`;
      }
    }, { passive: true });
  }

  const announce = () => {
    const active = document.querySelector('.slide.is-active');
    if (!active) return;
    active.querySelectorAll('.metric-grid b').forEach((node) => {
      const target = Number(node.textContent);
      if (!Number.isFinite(target) || reduced) return;
      const started = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - started) / 850);
        node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const observer = new MutationObserver(announce);
  slides.forEach((slide) => observer.observe(slide, { attributes: true, attributeFilter: ['class'] }));
  announce();
})();
