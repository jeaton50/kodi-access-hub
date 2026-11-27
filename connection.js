'use strict';
(() => {
  const devices = Object.freeze({
    la: {name: 'KodiLA', url: 'http://100.101.134.87:18802/', enhanced: 'http://100.101.134.87:8080/addons/webinterface.jmediabox/'},
    original: {name: 'Original Kodi', url: 'http://100.120.53.67:18802/', enhanced: 'http://100.120.53.67:8080/addons/webinterface.jmediabox/'}
  });
  const views = Object.freeze({original: 'controls', enhanced: 'Enhanced menu'});
  const viewKey = 'kodi-hub-menu-view';
  const android = /Android/i.test(navigator.userAgent);
  const panel = document.getElementById('connection-panel');
  if (!panel) return;
  const title = document.getElementById('connection-title');
  const status = document.getElementById('connection-status');
  const controls = document.getElementById('connection-controls');
  const app = document.getElementById('connection-app');
  const cancel = document.getElementById('connection-cancel');
  const choices = [...document.querySelectorAll('input[name="menu-view"]')];
  const preview = document.getElementById('enhanced-preview');
  let shown = null;
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
  function currentView() {
    const checked = choices.find(c => c.checked);
    return checked && Object.hasOwn(views, checked.value) ? checked.value : 'original';
  }
  function setView(value) {
    if (!Object.hasOwn(views, value)) value = 'original';
    for (const c of choices) c.checked = c.value === value;
  }
  function target(id, view) {
    const device = devices[id];
    return view === 'enhanced' ? device.enhanced : device.url;
  }
  function label(id, view) {
    return view === 'enhanced' ? devices[id].name + ' Enhanced menu' : devices[id].name + ' controls';
  }
  function updateControls() {
    if (!shown) return;
    const view = currentView();
    controls.href = target(shown, view);
    controls.textContent = 'Open ' + label(shown, view);
    if (preview) preview.href = 'enhanced/?demo=1&device=' + encodeURIComponent(shown);
  }
  function fallback(id) {
    const url = new URL('connect.html', document.baseURI);
    url.searchParams.set('device', id);
    if (currentView() === 'enhanced') url.searchParams.set('view', 'enhanced');
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
    shown = id;
    updateControls();
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
    pending = {device: id, view: currentView(), started: Date.now(), leftPage: false};
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
    const view = Object.hasOwn(views, pending.view) ? pending.view : 'original';
    status.textContent = 'Opening ' + label(id, view) + '. Tailscale must be connected and the box must be online.';
    timer = setTimeout(() => {
      clear();
      window.location.assign(target(id, view));
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
  for (const c of choices) {
    c.addEventListener('change', () => {
      try { localStorage.setItem(viewKey, currentView()); } catch { /* optional */ }
      if (pending) { pending.view = currentView(); save(pending); }
      if (android && shown) app.href = appLink(shown);
      updateControls();
    });
  }
  const requestedView = new URL(window.location.href).searchParams.get('view');
  let savedView = null;
  try { savedView = localStorage.getItem(viewKey); } catch { /* optional */ }
  setView(requestedView || savedView || 'original');
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
      if (Object.hasOwn(views, stored.view)) setView(stored.view);
      show(stored.device);
      cancel.hidden = false;
      returned();
    } else save(null);
  } catch { save(null); }
})();
