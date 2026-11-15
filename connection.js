'use strict';
(() => {
  const devices = Object.freeze({
    la: {name: 'KodiLA', url: 'http://100.101.134.87:18802/'},
    original: {name: 'Original Kodi', url: 'http://100.120.53.67:18802/'}
  });
  const android = /Android/i.test(navigator.userAgent);
  const panel = document.getElementById('connection-panel');
  if (!panel) return;
  const title = document.getElementById('connection-title');
  const status = document.getElementById('connection-status');
  const controls = document.getElementById('connection-controls');
  const app = document.getElementById('connection-app');
  const cancel = document.getElementById('connection-cancel');
  const key = 'kodi-hub-pending-connection';
  let pending = null;
  let leftPage = false;
  let timer;

  function save(value) {
    try {
      if (value) sessionStorage.setItem(key, JSON.stringify(value));
      else sessionStorage.removeItem(key);
    } catch { /* The current page still works without session storage. */ }
  }
  function fallback(id) {
    const url = new URL('connect.html', document.baseURI);
    url.searchParams.set('device', id);
    return url.href;
  }
  function appLink(id) {
    const unavailable = new URL(fallback(id));
    unavailable.searchParams.set('app_unavailable', '1');
    return 'intent://navigate/main/devices#Intent;scheme=tailscale;package=com.tailscale.ipn;S.browser_fallback_url=' + encodeURIComponent(unavailable.href) + ';end';
  }
  function show(id) {
    if (!Object.hasOwn(devices, id)) return;
    const device = devices[id];
    panel.hidden = false;
    title.textContent = 'Connect to ' + device.name;
    controls.href = device.url;
    controls.textContent = 'Open ' + device.name + ' controls';
    app.hidden = !android;
    if (android) app.href = appLink(id);
    app.dataset.connectDevice = id;
    status.textContent = android
      ? 'In Tailscale, tap Connect if needed. Return to this webpage and your selected controls will open. If Tailscale is already connected, use Open controls below.'
      : 'Open Tailscale on this device and turn it on, then use Open controls below. One Tailscale connection provides access to both boxes.';
    cancel.hidden = true;
  }
  function start(id) {
    if (!Object.hasOwn(devices, id)) return;
    show(id);
    pending = {device: id, started: Date.now(), leftPage: false};
    leftPage = false;
    save(pending);
    cancel.hidden = false;
  }
  function clear() {
    clearTimeout(timer);
    pending = null;
    leftPage = false;
    save(null);
    cancel.hidden = true;
  }
  function returned() {
    if (document.hidden || !pending || !leftPage) return;
    const id = pending.device;
    if (!Object.hasOwn(devices, id) || Date.now() - pending.started > 600000) {
      clear();
      status.textContent = 'Automatic opening expired. Connect Tailscale, then use Open controls.';
      return;
    }
    leftPage = false;
    status.textContent = 'Opening ' + devices[id].name + ' controls. Tailscale must be connected and the box must be online.';
    timer = setTimeout(() => {
      clear();
      window.location.assign(devices[id].url);
    }, 1200);
  }

  for (const link of document.querySelectorAll('[data-connect-device]')) {
    const id = link.dataset.connectDevice;
    if (!Object.hasOwn(devices, id)) continue;
    link.href = android ? appLink(id) : fallback(id);
    link.addEventListener('click', () => start(id));
  }
  app.addEventListener('click', () => start(app.dataset.connectDevice));
  controls.addEventListener('click', clear);
  cancel.addEventListener('click', () => {
    clear();
    status.textContent = 'Automatic opening cancelled. You can open the controls when ready.';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pending) {
      leftPage = true;
      pending.leftPage = true;
      save(pending);
    } else returned();
  });
  window.addEventListener('pageshow', returned);
  const chosen = new URL(window.location.href).searchParams.get('device');
  if (chosen && Object.hasOwn(devices, chosen)) show(chosen);
  if (new URL(window.location.href).searchParams.has('app_unavailable')) {
    clear();
    status.textContent = 'The Tailscale app did not open. Install or open it manually, connect, then use Open controls.';
    return;
  }
  try {
    const stored = JSON.parse(sessionStorage.getItem(key));
    if (stored && Object.hasOwn(devices, stored.device) && Date.now() - stored.started < 600000) {
      pending = stored;
      leftPage = stored.leftPage === true;
      show(stored.device);
      cancel.hidden = false;
      returned();
    } else save(null);
  } catch { save(null); }
})();
