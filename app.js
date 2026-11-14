'use strict';
const toast = document.querySelector('.toast');
let toastTimer;
function message(text) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}
for (const button of document.querySelectorAll('[data-copy]')) {
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      message('Dashboard address copied');
    } catch {
      message('Copy unavailable. Select the address or use Open controls.');
    }
  });
}
const guideForm = document.getElementById('live-tv-search');
guideForm.addEventListener('submit', event => {
  event.preventDefault();
  const hosts = {la:'http://100.101.134.87:18802',original:'http://100.120.53.67:18802'};
  const host = hosts[document.getElementById('live-tv-device').value];
  const query = document.getElementById('live-tv-query').value.trim();
  if (!host || !query) return;
  const url = new URL('/tv-search',host);
  url.searchParams.set('q',query.slice(0,120));
  const link = document.createElement('a');
  link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
  document.body.append(link);link.click();link.remove();
});
