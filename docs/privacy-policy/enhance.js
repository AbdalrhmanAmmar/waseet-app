(() => {
  const email = 'abdammar2023@gmail.com';
  const printButton = document.getElementById('print-policy');
  if (typeof window.print === 'function') {
    printButton.hidden = false;
    printButton.addEventListener('click', () => window.print());
  }
  const copyButton = document.getElementById('copy-email');
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try {
        await navigator.clipboard.writeText(email);
        status.textContent = 'تم نسخ البريد';
      } catch {
        status.textContent = 'تعذر النسخ. يمكنك تحديد البريد ونسخه يدويًا.';
      }
    });
  }
  const links = Array.from(document.querySelectorAll('.nav-link'));
  const sections = links.map((link) => document.querySelector(link.getAttribute('href')));
  const progress = document.getElementById('reading-progress');
  let scheduled = false;
  function update() {
    scheduled = false;
    const available = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 100}%`;
    let active = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= 180) active = index;
    });
    if (available > 0 && window.scrollY >= available - 3) active = sections.length - 1;
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  document.fonts?.ready.then(schedule);
  update();
})();
