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
