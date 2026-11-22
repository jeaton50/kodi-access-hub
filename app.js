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
const searchTargets = {
  la: query => 'http://100.101.134.87:18802/tv-search?q=' + encodeURIComponent(query),
  original: query => 'http://100.120.53.67:18802/tv-search?q=' + encodeURIComponent(query),
  imac: query => 'http://100.117.16.53:8096/web/#/search.html?query=' + encodeURIComponent(query)
};
guideForm.addEventListener('submit', event => {
  event.preventDefault();
  const build = Object.hasOwn(searchTargets, document.getElementById('live-tv-device').value)
    ? searchTargets[document.getElementById('live-tv-device').value]
    : null;
  const query = document.getElementById('live-tv-query').value.trim();
  if (!build || !query) return;
  const link = document.createElement('a');
  link.href = build(query.slice(0, 120));
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.append(link);
  link.click();
  link.remove();
});
