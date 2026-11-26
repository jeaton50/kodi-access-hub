'use strict';
/*
 * JMediaBox Enhanced Menu: a web copy of the jmediabox Kodi home screen.
 * It talks to Kodi's JSON-RPC API on the same origin (served by Kodi as the
 * webinterface.jmediabox add-on), so there is no CORS or mixed-content issue.
 * Opened from GitHub Pages (https), it runs as a preview with sample data,
 * because browsers block https pages from calling a plain-http Kodi.
 */
(() => {
  const JC = 'plugin://plugin.video.jellycon/?';
  const FIELDS = 'DateCreated%252CEpisodeCount%252CSeasonCount%252CPath%252CGenres%252CStudios%252CEtag%252CTaglines%252CSortName%252CRecursiveItemCount%252CChildCount%252CProductionYear%252CMediaStreams%252COverview';
  const widget = type => JC + 'mode=WIDGET_CONTENT&type=' + type;
  const genre = (types, g, sort, media) => JC + 'url=/Users/%7Buserid%7D/Items%3FIncludeItemTypes%3D' + types +
    '%26Recursive%3DTrue' + (g ? '%26Genres%3D' + g : '') + '%26SortBy%3D' + sort +
    '%26Limit%3D25%26Fields%3D' + FIELDS + '%26ImageTypeLimit%3D1%26format%3Djson&mode=GET_CONTENT&media_type=' + media;

  // Same rows, in the same order, as the TV home screen (gen_home.py ROWS).
  const ROWS = [
    {id: 9101, title: 'Continue watching movies', path: widget('inprogress_movies'), style: 'poster'},
    {id: 9102, title: 'Keep watching shows', path: widget('inprogress_episodes'), style: 'episode'},
    {id: 9103, title: 'Next up', path: widget('nextup_episodes'), style: 'episode'},
    {id: 9110, title: 'On now: your recent channels', pvr: true, style: 'channel'},
    {id: 9104, title: 'Recently added movies', path: widget('recent_movies'), style: 'poster'},
    {id: 9105, title: 'Recently added episodes', path: widget('recent_episodes'), style: 'episode'},
    {id: 9106, title: 'Recently added TV shows', path: widget('recent_tvshows'), style: 'poster'},
    {id: 9111, title: 'Comedy movies', path: genre('Movie', 'Comedy', 'Random', 'movies'), style: 'poster'},
    {id: 9112, title: 'Horror movies', path: genre('Movie', 'Horror', 'Random', 'movies'), style: 'poster'},
    {id: 9113, title: 'Thrillers', path: genre('Movie', 'Thriller', 'Random', 'movies'), style: 'poster'},
    {id: 9114, title: 'Animated shows', path: genre('Series', 'Animation', 'SortName', 'tvshows'), style: 'poster'},
    {id: 9115, title: 'Recently watched', path: JC + 'url=/Users/%7Buserid%7D/Items%3FIncludeItemTypes%3DMovie%252CEpisode%26Recursive%3DTrue%26Filters%3DIsPlayed%26SortBy%3DDatePlayed%26SortOrder%3DDescending%26Limit%3D25%26Fields%3D' + FIELDS + '%26ImageTypeLimit%3D1%26format%3Djson&mode=GET_CONTENT&media_type=movies', style: 'poster'},
    {id: 9107, title: 'Streaming services', path: 'plugin://plugin.video.jmediabox/?page=streaming', style: 'wide'},
    {id: 9108, title: 'Live TV', path: 'plugin://plugin.video.jmediabox/?page=live-tv', style: 'wide'},
    {id: 9109, title: 'Random picks', path: widget('random_movies'), style: 'poster'}
  ];
  // Library search through Jellyfin's SearchTerm, listed by JellyCon like the rows above.
  const searchPath = (type, q) => JC + 'url=/Users/%7Buserid%7D/Items%3FSearchTerm%3D' +
    encodeURIComponent(encodeURIComponent(q)) + '%26IncludeItemTypes%3D' + type + '%26Recursive%3DTrue%26Limit%3D25%26Fields%3D' +
    FIELDS + '%26ImageTypeLimit%3D1%26format%3Djson&mode=GET_CONTENT&media_type=' +
    {Movie: 'movies', Series: 'tvshows', Episode: 'episodes'}[type];
  const LIBRARY = {
    movies: JC + 'url=/Users/%7Buserid%7D/Items%3FIncludeItemTypes%3DMovie%26CollapseBoxSetItems%3DTrue%26GroupItemsIntoCollections%3DTrue%26Recursive%3DTrue%26IsMissing%3DFalse%26SortBy%3DSortName%26Fields%3D' + FIELDS + '%26ImageTypeLimit%3D1%26ParentId%3Df137a2dd21bbc1b99aa5c0f6bf02a805%26format%3Djson&mode=GET_CONTENT&media_type=movies',
    shows: JC + 'url=/Users/%7Buserid%7D/Items%3FFields%3D' + FIELDS + '%26ImageTypeLimit%3D1%26IsMissing%3DFalse%26IncludeItemTypes%3DSeries%26Recursive%3DTrue%26SortBy%3DSortName%26ParentId%3D767bffe4f11c93ef34b805451a696a4e%26format%3Djson&mode=GET_CONTENT&media_type=tvshows',
    streaming: 'plugin://plugin.video.jmediabox/?page=streaming'
  };
  const CARDS = [
    {id: 'movies', label: 'Movies', sub: 'Your films', go: '#browse/movies'},
    {id: 'shows', label: 'TV Shows', sub: 'Series, episodes', go: '#browse/shows'},
    {id: 'channels', label: 'TV Channels', sub: 'Live TV, guide', go: '#channels'},
    {id: 'streaming', label: 'Streaming', sub: 'Your services', go: '#browse/streaming'},
    {id: 'favorites', label: 'Favorites', sub: 'Your picks', go: '#favorites'},
    {id: 'search', label: 'Search', sub: 'Library + streams', go: '#search'},
    {id: 'remote', label: 'Remote', sub: 'Control the TV', go: '#remote'},
    {id: 'power', label: 'Power', sub: 'Shut down safely', go: '#power'}
  ];
  const FILE_PROPS = ['title', 'art', 'thumbnail', 'fanart', 'file', 'plot', 'year', 'genre', 'runtime', 'rating',
    'showtitle', 'season', 'episode', 'resume', 'playcount'];
  const CHANNEL_PROPS = ['thumbnail', 'channelnumber', 'broadcastnow', 'broadcastnext', 'lastplayed', 'hidden', 'locked'];
  const KODI_PORT = '8080';
  const DEVICES = {la: '100.101.134.87', original: '100.120.53.67'};

  const params = new URLSearchParams(location.search);
  const remoteBase = (params.get('kodi') || '').replace(/\/+$/, '');
  const live = !params.has('demo') && (remoteBase !== '' || location.protocol === 'http:');
  const endpoint = (remoteBase || '') + '/jsonrpc';
  const $ = id => document.getElementById(id);
  const view = $('view');
  const tvStyle = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const autofocus = node => { if (tvStyle && node) node.focus({preventScroll: true}); };
  let rpcId = 0;
  let channelsCache = null;
  let navToken = 0;

  // ---------- Kodi JSON-RPC ----------
  async function rpc(method, args) {
    if (!live) return window.DemoKodi.call(method, args || {});
    const res = await fetch(endpoint, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include',
      body: JSON.stringify({jsonrpc: '2.0', id: ++rpcId, method, params: args || {}})
    });
    if (res.status === 401) throw new Error('Kodi asked for its web server login. Reload the page and sign in.');
    if (!res.ok) throw new Error('Kodi answered ' + res.status);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Kodi error');
    return data.result;
  }
  function image(url) {
    if (!url) return '';
    if (!live) return url;
    if (url.startsWith('image://')) return (remoteBase || '') + '/image/' + encodeURIComponent(url);
    if (/^(https?:\/\/|data:)/.test(url)) return url;
    return (remoteBase || '') + '/image/' + encodeURIComponent('image://' + encodeURIComponent(url) + '/');
  }
  const art = (item, ...keys) => {
    for (const k of keys) {
      const v = k === 'thumbnail' ? item.thumbnail : k === 'fanart' ? (item.fanart || (item.art || {}).fanart) : (item.art || {})[k];
      if (v) return image(v);
    }
    return '';
  };
  // ---------- Speed: Kodi runs each JellyCon list as a Python add-on call (~1s each on the Pi).
  // Fired all at once, 15 rows take ~17s and finish together; two at a time, top rows show in ~1s.
  const MAX_PARALLEL = 2;
  const waiting = [];
  let running = 0;
  function queued(fn) {
    return new Promise((resolve, reject) => {
      waiting.push({fn, resolve, reject});
      pump();
    });
  }
  function pump() {
    while (running < MAX_PARALLEL && waiting.length) {
      const job = waiting.shift();
      running++;
      job.fn().then(job.resolve, job.reject).finally(() => { running--; pump(); });
    }
  }
  // Last answer per list, kept in this browser so a return visit paints at once; it is refreshed right after.
  const CACHE_PREFIX = 'jmb-list:' + location.host + ':';
  function cacheGet(path) {
    try { const v = JSON.parse(localStorage.getItem(CACHE_PREFIX + path)); return v && Array.isArray(v.items) ? v.items : null; } catch { return null; }
  }
  function cachePut(path, items) {
    try { localStorage.setItem(CACHE_PREFIX + path, JSON.stringify({at: Date.now(), items})); } catch { /* storage full or blocked */ }
  }
  async function directory(path, limit) {
    const args = {directory: path, media: 'video', properties: FILE_PROPS};
    if (limit) args.limits = {start: 0, end: limit};
    const r = await rpc('Files.GetDirectory', args);
    return (r && r.files) || [];
  }
  async function channels(force) {
    if (channelsCache && !force && Date.now() - channelsCache.at < 60000) return channelsCache.list;
    const r = await rpc('PVR.GetChannels', {channelgroupid: 'alltv', properties: CHANNEL_PROPS});
    const list = ((r && r.channels) || []).filter(c => !c.hidden && !c.locked);
    channelsCache = {at: Date.now(), list};
    return list;
  }

  // ---------- Small helpers ----------
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  let toastTimer;
  function toast(text, error) {
    const t = $('toast');
    clearTimeout(toastTimer);
    t.textContent = text;
    t.classList.toggle('error', !!error);
    t.classList.add('visible');
    toastTimer = setTimeout(() => t.classList.remove('visible'), 3400);
  }
  const pad = n => String(n).padStart(2, '0');
  const minutes = s => s ? Math.round(s / 60) + ' min' : '';
  // JellyCon puts the episode count in "episode" on shows and seasons, so trust the type first.
  const isEpisode = it => it.type === 'episode' || (it.type !== 'tvshow' && it.type !== 'season' && it.type !== 'movie' && it.episode > 0 && !!it.showtitle);
  const isLauncher = it => it.type === 'unknown' && !it.__channel && !it.__fav;

  // ---------- Favorites: Kodi's own favourites, shared with the TV's Favorites card and row ----------
  // Favourites.AddFavourite toggles on Kodi 21: the same path again removes it.
  let favCache = null;
  let pvrClients = null;
  async function favorites(force) {
    if (favCache && !force) return favCache;
    const r = await rpc('Favourites.GetFavourites', {properties: ['path', 'window', 'windowparameter', 'thumbnail']});
    favCache = (r && r.favourites) || [];
    return favCache;
  }
  async function channelPath(ch) {
    // Same form Kodi logs when it tunes a channel: pvr://channels/tv/<group>@-1/<clientid>@<addon>_<uniqueid>.pvr
    if (!pvrClients) {
      const r = await rpc('PVR.GetClients');
      pvrClients = Object.fromEntries(((r && r.clients) || []).map(c => [c.clientid, c.addonid]));
    }
    const d = await rpc('PVR.GetChannelDetails', {channelid: ch.channelid, properties: ['clientid', 'uniqueid']});
    const det = (d && d.channeldetails) || {};
    const addon = pvrClients[det.clientid];
    if (!addon || det.uniqueid == null) throw new Error('This channel cannot be saved as a favorite');
    return 'pvr://channels/tv/All%20channels@-1/' + det.clientid + '@' + addon + '_' + det.uniqueid + '.pvr';
  }
  const rawArt = (it, ...keys) => { for (const k of keys) { const v = k === 'thumbnail' ? it.thumbnail : (it.art || {})[k]; if (v) return v; } return ''; };
  async function favSpec(it) {
    if (it.__fav) return it.__spec;
    if (it.__channel) return {title: it.label, type: 'media', path: await channelPath(it), thumbnail: it.thumbnail || ''};
    let title = line1(it);
    if (isEpisode(it)) title = it.showtitle + ' S' + pad(it.season) + 'E' + pad(it.episode) + ' - ' + (it.title || it.label);
    else if (it.type === 'movie' && it.year) title += ' (' + it.year + ')';
    const thumbnail = rawArt(it, 'poster', 'tvshow.poster', 'thumb', 'thumbnail', 'icon');
    if (it.filetype === 'directory') return {title, type: 'window', window: 'videos', windowparameter: it.file, thumbnail};
    return {title, type: 'media', path: it.file, thumbnail};
  }
  const favKey = f => f.type === 'window' ? 'w:' + f.windowparameter : 'p:' + (f.path || '');
  async function isFavorite(it) {
    if (it.__fav) return true;
    const spec = await favSpec(it);
    return (await favorites()).some(f => favKey(f) === favKey(spec));
  }
  async function toggleFavorite(it, button) {
    try {
      button.disabled = true;
      button.textContent = 'Saving…';
      const spec = await favSpec(it);
      const before = (await favorites(true)).some(f => favKey(f) === favKey(spec));
      const params = {title: spec.title, type: spec.type};
      for (const k of ['path', 'window', 'windowparameter', 'thumbnail']) if (spec[k]) params[k] = spec[k];
      await rpc('Favourites.AddFavourite', params);
      const after = (await favorites(true)).some(f => favKey(f) === favKey(spec));
      setStar(button, after);
      toast(after === before ? 'Favorites unchanged' : after ? 'Added to favorites: ' + spec.title : 'Removed from favorites: ' + spec.title);
      if (location.hash === '#favorites' && !after) { closeSheet(); route(); }
    } catch (e) {
      toast('Could not change favorites: ' + e.message, true);
      isFavorite(it).then(on => setStar(button, !!on)).catch(() => setStar(button, false));
    } finally { button.disabled = false; }
  }
  function setStar(button, on) {
    button.textContent = on ? '★ In favorites' : '☆ Add to favorites';
    button.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function favItem(f) {
    return {__fav: true, __spec: f, label: f.title, title: f.title, type: 'unknown', filetype: f.type === 'window' ? 'directory' : 'file',
      file: f.path || f.windowparameter || '',
      // Skin icons such as DefaultTVShows.png don't load over the web, so show the title instead.
      art: {thumb: /^Default[\w.]*\.png$/.test(f.thumbnail || '') ? '' : (f.thumbnail || '')}};
  }
  async function openFavorite(it) {
    const f = it.__spec;
    try {
      if (f.type === 'media') await rpc('Player.Open', {item: {file: f.path}});
      else if (f.type === 'window') await rpc('GUI.ActivateWindow', {window: f.window || 'videos', parameters: f.windowparameter ? [f.windowparameter, 'return'] : []});
      else {
        // Scripts and add-on shortcuts can only be started from Kodi's own Favorites list.
        await rpc('GUI.ActivateWindow', {window: 'favouritesbrowser'}).catch(() => rpc('GUI.ActivateWindow', {window: 'favourites'}));
        toast('Opened Favorites on the TV. Pick "' + f.title + '" there.');
        closeSheet();
        return;
      }
      toast((f.type === 'media' ? 'Playing on the TV: ' : 'Opened on the TV: ') + f.title);
      closeSheet();
      if (f.type === 'media') setTimeout(pollNow, 1500);
    } catch (e) { toast('Could not open it on the TV: ' + e.message, true); }
  }
  function line1(it) { return it.showtitle && isEpisode(it) ? it.showtitle : (it.title || it.label || ''); }
  function line2(it) {
    if (isEpisode(it)) return ['S' + (it.season >= 0 ? it.season : '') + 'E' + it.episode, it.title || it.label].filter(Boolean).join('  •  ');
    return [it.year || '', minutes(it.runtime)].filter(Boolean).join('  •  ');
  }
  function meta(it) {
    const g = Array.isArray(it.genre) ? it.genre.join(', ') : it.genre;
    return [it.year || '', g, minutes(it.runtime), it.rating ? '★ ' + Number(it.rating).toFixed(1) : ''].filter(Boolean).join('  •  ');
  }
  function setHero(title, sub, plot, backdrop) {
    $('hero-title').textContent = title || '';
    $('hero-meta').textContent = sub || '';
    $('hero-plot').textContent = plot || '';
    $('backdrop').style.backgroundImage = backdrop ? 'url("' + backdrop.replace(/"/g, '%22') + '")' : '';
  }
  function heroItem(it) {
    if (it.__channel) {
      const now = it.broadcastnow || {};
      return setHero(it.label, now.title ? 'Now: ' + now.title : 'Live TV', now.plot || '', '');
    }
    setHero(line1(it), isEpisode(it) ? line2(it) : meta(it), it.plot || '', art(it, 'fanart', 'tvshow.fanart'));
  }
  const homeHero = () => setHero('Home', 'Pick a section, or scroll down through your rows', '', '');

  // ---------- Tiles ----------
  function tile(it, style, onOpen) {
    const b = el('button', 'tile ' + style);
    b.type = 'button';
    const a = el('div', 'art');
    let pic = '';
    if (style === 'poster') pic = art(it, 'poster', 'tvshow.poster', 'thumb', 'thumbnail');
    else if (style === 'episode') pic = art(it, 'thumb', 'thumbnail', 'tvshow.fanart', 'fanart');
    else if (style === 'wide') pic = art(it, 'thumb', 'icon', 'thumbnail', 'poster');
    if (style === 'channel') {
      const logo = art(it, 'thumbnail');
      if (logo) { const i = el('img', 'logo'); i.alt = ''; i.loading = 'lazy'; i.src = logo; a.append(i); }
      a.append(el('div', 'chname', it.label));
      const now = it.broadcastnow;
      if (now && now.progresspercentage > 0) { const p = el('div', 'prog'); p.style.width = now.progresspercentage + '%'; a.append(p); }
    } else if (pic) {
      a.style.backgroundImage = 'url("' + pic.replace(/"/g, '%22') + '")';
    } else {
      a.append(el('div', 'fallback', it.label || it.title || ''));
    }
    if (style === 'episode' && isEpisode(it)) a.append(el('div', 'badge', 'Season ' + it.season + '  •  Episode ' + it.episode));
    if (it.resume && it.resume.total > 0 && it.resume.position > 0) {
      const r = el('div', 'resume'); r.style.width = Math.min(100, 100 * it.resume.position / it.resume.total) + '%'; a.append(r);
    }
    b.append(a);
    if (style === 'channel') {
      const now = it.broadcastnow, next = it.broadcastnext;
      b.append(el('div', 't1', now && now.title ? 'Now: ' + now.title : (it.channelnumber ? 'Channel ' + it.channelnumber : 'Live')));
      b.append(el('div', 't2', next && next.title ? 'Next: ' + next.title : ''));
    } else if (style === 'wide') {
      b.append(el('div', 't1', it.label || it.title));
    } else {
      b.append(el('div', 't1', line1(it)));
      b.append(el('div', 't2', line2(it)));
    }
    b.setAttribute('aria-label', [style === 'channel' ? it.label : line1(it), b.querySelector('.t2') ? b.querySelector('.t2').textContent : ''].filter(Boolean).join(', '));
    b.addEventListener('focus', () => heroItem(it));
    b.addEventListener('mouseenter', () => heroItem(it));
    b.addEventListener('click', () => onOpen(it, style));
    return b;
  }

  // ---------- Actions ----------
  async function play(it) {
    try {
      if (it.__channel) await rpc('Player.Open', {item: {channelid: it.channelid}});
      else await rpc('Player.Open', {item: {file: it.file}});
      toast('Playing on the TV: ' + (it.__channel ? it.label : line1(it)));
      closeSheet();
      setTimeout(pollNow, 1500);
    } catch (e) { toast('Could not start playback: ' + e.message, true); }
  }
  async function findStreams(it) {
    const show = isEpisode(it) ? (it.showtitle || '') : '';
    const args = ['jacktook', show ? '' : (it.title || it.label || ''), String(it.year || ''), show,
      show ? String(it.season) : '', show ? String(it.episode) : ''];
    try {
      await rpc('Addons.ExecuteAddon', {addonid: 'script.jmediabox.tools', params: args});
      toast('Stream search opened on the TV. Pick a source there or with Remote.');
      closeSheet();
    } catch (e) { toast('Could not open Jacktook: ' + e.message, true); }
  }
  async function jacktookQuery(q) {
    try {
      await rpc('GUI.ActivateWindow', {window: 'videos', parameters: [
        'plugin://plugin.video.jacktook/?action=search_direct&mode=direct&query=' + encodeURIComponent(q), 'return']});
      toast('Searching Jacktook on the TV for "' + q + '"');
    } catch (e) { toast('Could not open Jacktook: ' + e.message, true); }
  }
  async function openOnTv(it) {
    // Same as selecting the tile on the TV: folders open there, jmediabox launchers run their action.
    try {
      await rpc('GUI.ActivateWindow', {window: 'videos', parameters: [it.file, 'return']});
      toast('Opened on the TV: ' + (it.label || it.title));
      closeSheet();
    } catch (e) { toast('Could not open it on the TV: ' + e.message, true); }
  }
  function openItem(it, style) {
    if (it.__channel || it.__fav || isLauncher(it)) return showSheet(it, style);
    // Seasons and plain folders open as a page, like on the TV; shows get a detail card first.
    if (it.filetype === 'directory' && !isEpisode(it) && it.type !== 'movie' && (it.type !== 'tvshow' || !it.plot)) {
      return go('#dir/' + encodePath(it.file, it.label || it.title));
    }
    showSheet(it, style);
  }
  const encodePath = (path, title) => encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({p: path, t: title || ''})))));
  function decodePath(s) {
    try { return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(s))))); } catch { return null; }
  }

  // ---------- Detail sheet ----------
  let lastFocus = null;
  function showSheet(it, style) {
    lastFocus = document.activeElement;
    const sheet = $('sheet');
    const artBox = $('sheet-art');
    const wide = style === 'episode' || style === 'channel' || style === 'wide';
    artBox.className = 'sheet-art' + (wide ? ' wide' : '');
    const pic = it.__channel ? art(it, 'thumbnail') : wide ? art(it, 'thumb', 'thumbnail', 'fanart') : art(it, 'poster', 'tvshow.poster', 'thumb', 'thumbnail');
    artBox.style.backgroundImage = pic ? 'url("' + pic.replace(/"/g, '%22') + '")' : '';
    artBox.style.backgroundSize = it.__channel ? 'contain' : 'cover';
    const actions = $('sheet-actions');
    actions.replaceChildren();
    const add = (label, fn, secondary) => {
      const b = el('button', 'action' + (secondary ? ' secondary' : ''), label);
      b.type = 'button';
      b.addEventListener('click', fn);
      actions.append(b);
      return b;
    };
    if (it.__fav) {
      $('sheet-title').textContent = it.title;
      $('sheet-meta').textContent = it.__spec.type === 'media' ? 'Favorite  •  plays on the TV' : 'Favorite  •  opens on the TV';
      $('sheet-plot').textContent = '';
      artBox.style.backgroundSize = 'contain';
      add(it.__spec.type === 'media' ? 'Play on TV' : 'Open on TV', () => openFavorite(it));
    } else if (isLauncher(it)) {
      $('sheet-title').textContent = it.label || it.title;
      $('sheet-meta').textContent = it.filetype === 'directory' ? 'Service' : 'Opens on the TV';
      $('sheet-plot').textContent = it.plot || '';
      artBox.style.backgroundSize = 'contain';
      add('Open on TV', () => openOnTv(it));
      if (it.filetype === 'directory' && /^plugin:\/\/plugin\.video\.jmediabox\//.test(it.file)) {
        add('Browse here', () => { closeSheet(); go('#dir/' + encodePath(it.file, it.label)); }, true);
      }
    } else if (it.__channel) {
      const now = it.broadcastnow || {}, next = it.broadcastnext || {};
      $('sheet-title').textContent = it.label;
      $('sheet-meta').textContent = [now.title ? 'Now: ' + now.title : '', next.title ? 'Next: ' + next.title : ''].filter(Boolean).join('   ');
      $('sheet-plot').textContent = now.plot || '';
      add('Watch on TV', () => play(it));
    } else {
      $('sheet-title').textContent = line1(it);
      $('sheet-meta').textContent = isEpisode(it) ? line2(it) + (it.runtime ? '  •  ' + minutes(it.runtime) : '') : meta(it);
      $('sheet-plot').textContent = it.plot || '';
      const folder = it.filetype === 'directory' && !isEpisode(it) && it.type !== 'movie';
      if (folder) add(it.type === 'tvshow' || it.type === 'season' ? 'Open seasons' : 'Open', () => { closeSheet(); go('#dir/' + encodePath(it.file, line1(it))); });
      else {
        const resumable = it.resume && it.resume.position > 0;
        add(resumable ? 'Resume on TV' : 'Play on TV', () => play(it));
      }
      if (it.type !== 'unknown' || it.year || isEpisode(it)) add('Find streams', () => findStreams(it), true);
    }
    if (!isLauncher(it)) {
      const star = add('☆ Add to favorites', () => toggleFavorite(it, star), true);
      setStar(star, !!it.__fav);
      if (!it.__fav) isFavorite(it).then(on => { if (on != null && star.isConnected) setStar(star, on); }).catch(() => {});
    }
    add('Close', closeSheet, true);
    sheet.hidden = false;
    actions.firstChild.focus();
  }
  function closeSheet() {
    if ($('sheet').hidden) return;
    $('sheet').hidden = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  // ---------- Views ----------
  function rowSection(title, style) {
    const s = el('section', 'row');
    const head = el('div', 'row-head');
    head.append(el('h2', null, title));
    const count = el('span', 'count');
    head.append(count);
    const strip = el('div', 'strip loading');
    strip.dataset.nav = 'row';
    s.append(head, strip);
    return {s, strip, count, head, style};
  }
  function fill(r, items, onOpen) {
    r.strip.classList.remove('loading');
    r.strip.replaceChildren(...items.map(it => tile(it, r.style, onOpen)));
    r.count.textContent = items.length ? items.length + (items.length === 1 ? ' item' : ' items') : '';
  }

  async function renderHome(token) {
    homeHero();
    const cards = el('nav', 'cards');
    cards.dataset.nav = 'row';
    cards.setAttribute('aria-label', 'Sections');
    for (const c of CARDS) {
      const b = el('button', 'card');
      b.type = 'button';
      b.dataset.card = c.id;
      b.append(el('strong', null, c.label), el('span', null, c.sub));
      b.addEventListener('click', () => go(c.go));
      const hero = () => setHero(c.label, c.sub, '', '');
      b.addEventListener('focus', hero);
      b.addEventListener('mouseenter', hero);
      cards.append(b);
    }
    cards.addEventListener('mouseleave', () => { if (!cards.contains(document.activeElement)) homeHero(); });
    view.replaceChildren(cards);
    const hidden = hiddenRows();
    const favRow = rowSection('Your favorites', 'wide');
    view.append(favRow.s);
    favorites(true).then(list => {
      if (token !== navToken) return;
      if (!list.length) { favRow.s.remove(); return; }
      fill(favRow, list.map(favItem), openItem);
    }).catch(() => { if (token === navToken) favRow.s.remove(); });
    for (const row of ROWS) {
      if (hidden.has(row.id)) continue;
      const r = rowSection(row.title, row.style);
      view.append(r.s);
      const key = row.pvr ? 'pvr-recent' : row.path;
      const cached = cacheGet(key);
      let shown = '';
      if (cached && cached.length) { fill(r, cached, openItem); shown = JSON.stringify(cached); }
      const refresh = () => queued(() => token === navToken ? (row.pvr ? recentChannels() : directory(row.path, 25)) : Promise.resolve(null))
        .then(items => {
          if (!items || token !== navToken) return;
          cachePut(key, items);
          if (!items.length) { r.s.remove(); return; }
          // Don't swap tiles under the user's focus, or when nothing changed.
          if (JSON.stringify(items) === shown || r.strip.contains(document.activeElement)) return;
          fill(r, items, openItem);
        }).catch(() => { if (token === navToken && !shown) r.s.remove(); });
      // Rows load top-down as they come near the screen.
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
          if (entries.some(e => e.isIntersecting)) { io.disconnect(); refresh(); }
        }, {rootMargin: '900px 0px'});
        io.observe(r.s);
      } else refresh();
    }
    autofocus(cards.firstChild);
  }
  async function recentChannels() {
    // Only the first channels: the full list with guide data can be thousands of entries (megabytes).
    const r = await rpc('PVR.GetChannels', {channelgroupid: 'alltv', properties: CHANNEL_PROPS, limits: {start: 0, end: 60}});
    const list = ((r && r.channels) || []).filter(c => !c.hidden && !c.locked).map(c => Object.assign({__channel: true}, c));
    list.sort((a, b) => String(b.lastplayed || '').localeCompare(String(a.lastplayed || '')));
    return list.slice(0, 25);
  }
  function hiddenRows() {
    try { return new Set(JSON.parse(localStorage.getItem('jmb-hidden-rows') || '[]')); } catch { return new Set(); }
  }

  function pageHead(title, withFilter) {
    const head = el('div', 'page-head');
    const back = el('button', 'back', '‹ Home');
    back.type = 'button';
    back.addEventListener('click', () => history.length > 1 ? history.back() : go('#home'));
    head.append(back);
    let filter = null;
    if (withFilter) {
      filter = el('input', 'filter');
      filter.type = 'search';
      filter.placeholder = 'Filter ' + title.toLowerCase();
      filter.setAttribute('aria-label', 'Filter ' + title);
      head.append(filter);
    }
    return {head, filter};
  }
  async function renderGrid(title, path, token) {
    setHero(title, 'Loading…', '', '');
    const {head, filter} = pageHead(title, true);
    const grid = el('div', 'grid');
    grid.dataset.nav = 'grid';
    view.replaceChildren(head, grid);
    autofocus(head.querySelector('.back'));
    let items;
    const cached = cacheGet(path);
    if (cached) {
      grid.classList.add(guessStyle(cached));
      grid.replaceChildren(...cached.map(it => tile(it, guessStyle(cached), openItem)));
      setHero(title, cached.length + ' items  •  refreshing…', '', '');
    }
    try { items = await queued(() => directory(path)); cachePut(path, items); grid.className = 'grid'; } catch (e) {
      if (token === navToken && cached) { setHero(title, cached.length + ' items (saved copy)', '', ''); return; }
      if (token === navToken) { setHero(title, 'Could not load: ' + e.message, '', ''); }
      return;
    }
    if (token !== navToken) return;
    const style = guessStyle(items);
    grid.classList.add(style);
    const tiles = items.map(it => ({it, node: tile(it, style, openItem)}));
    grid.replaceChildren(...tiles.map(t => t.node));
    setHero(title, items.length + (items.length === 1 ? ' item' : ' items'), '', '');
    if (!items.length) grid.append(el('p', 'empty', 'Nothing here yet.'));
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      for (const t of tiles) t.node.hidden = q !== '' && !(line1(t.it) + ' ' + (t.it.label || '')).toLowerCase().includes(q);
    });
    if (filter.value) filter.dispatchEvent(new Event('input'));
  }
  function guessStyle(items) {
    const sample = items.slice(0, 10);
    if (sample.some(isEpisode)) return 'episode';
    if (sample.length && sample.every(isLauncher)) return 'wide';
    return 'poster';
  }

  async function renderChannels(token) {
    setHero('TV Channels', 'Loading the guide…', '', '');
    const {head, filter} = pageHead('Channels', true);
    const grid = el('div', 'grid channel');
    grid.dataset.nav = 'grid';
    view.replaceChildren(head, grid);
    autofocus(head.querySelector('.back'));
    let list;
    try { list = await channels(true); } catch (e) {
      if (token === navToken) setHero('TV Channels', 'Could not load channels: ' + e.message, '', '');
      return;
    }
    if (token !== navToken) return;
    const items = list.map(c => Object.assign({__channel: true, __text: [c.label, (c.broadcastnow || {}).title, (c.broadcastnext || {}).title].join(' ').toLowerCase()}, c));
    setHero('TV Channels', items.length + ' channels  •  select one to watch on the TV', '', '');
    // Render in pages: a box can carry thousands of channels.
    const PAGE = 120;
    let matches = items;
    let shown = 0;
    const more = el('button', 'action secondary', 'Show more channels');
    more.type = 'button';
    const renderMore = () => {
      const next = matches.slice(shown, shown + PAGE);
      grid.append(...next.map(it => tile(it, 'channel', openItem)));
      shown += next.length;
      more.hidden = shown >= matches.length;
      more.textContent = 'Show more channels (' + (matches.length - shown) + ' left)';
    };
    more.addEventListener('click', renderMore);
    view.append(more);
    renderMore();
    let filterTimer;
    filter.addEventListener('input', () => {
      clearTimeout(filterTimer);
      filterTimer = setTimeout(() => {
        const q = filter.value.trim().toLowerCase();
        matches = q ? items.filter(it => it.__text.includes(q)) : items;
        shown = 0;
        grid.replaceChildren();
        if (!matches.length) grid.append(el('p', 'empty', 'No channels match.'));
        renderMore();
      }, 200);
    });
  }

  async function renderSearch(query, token) {
    setHero('Search', 'Movies, shows and episodes in your library, live TV, and streams', '', '');
    const {head} = pageHead('Search', false);
    const form = el('form', 'search-box');
    form.setAttribute('role', 'search');
    const input = el('input');
    input.type = 'search';
    input.placeholder = 'Search movies, shows and streams';
    input.setAttribute('aria-label', 'Search');
    input.value = query;
    const submit = el('button', null, 'Search');
    submit.type = 'submit';
    const streams = el('button', 'action secondary', 'Find streams in Jacktook');
    streams.type = 'button';
    form.append(input, submit, streams);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = input.value.trim().slice(0, 120);
      if (q) go('#search/' + encodeURIComponent(q), true);
    });
    streams.addEventListener('click', () => { const q = input.value.trim(); if (q) jacktookQuery(q); else input.focus(); });
    view.replaceChildren(head, form);
    if (!query) { if (tvStyle) input.focus(); return; }
    setHero('Search: ' + query, 'Searching…', '', '');
    const groups = [
      {title: 'Movies in your library', type: 'Movie', style: 'poster'},
      {title: 'TV shows in your library', type: 'Series', style: 'poster'},
      {title: 'Episodes in your library', type: 'Episode', style: 'episode'}
    ];
    let total = 0;
    const jobs = groups.map(g => {
      const r = rowSection(g.title, g.style);
      view.append(r.s);
      return directory(searchPath(g.type, query))
        .then(items => {
          if (token !== navToken) return;
          total += items.length;
          if (!items.length) { r.strip.classList.remove('loading'); r.strip.replaceChildren(el('p', 'empty', 'No matches.')); return; }
          fill(r, items, openItem);
        })
        .catch(() => { if (token === navToken) { r.strip.classList.remove('loading'); r.strip.replaceChildren(el('p', 'empty', 'Search unavailable.')); } });
    });
    const tv = rowSection('On TV now', 'channel');
    view.append(tv.s);
    jobs.push(channels().then(list => {
      if (token !== navToken) return;
      const q = query.toLowerCase();
      const hits = list.filter(c => [c.label, (c.broadcastnow || {}).title, (c.broadcastnext || {}).title].join(' ').toLowerCase().includes(q))
        .slice(0, 40).map(c => Object.assign({__channel: true}, c));
      total += hits.length;
      if (!hits.length) { tv.s.remove(); return; }
      fill(tv, hits, openItem);
    }).catch(() => tv.s.remove()));
    await Promise.all(jobs);
    if (token === navToken) setHero('Search: ' + query, total ? total + ' results' : 'Nothing in your library. Try Find streams.', '', '');
  }

  function renderRemote() {
    setHero('Remote', 'Steers the TV like the remote does. Arrow keys work here too.', '', '');
    const {head} = pageHead('Remote', false);
    const wrap = el('div', 'remote');
    const padBox = el('div', 'pad');
    const cell = (label, method, cls, aria) => {
      const b = el('button', cls || '', label);
      b.type = 'button';
      if (aria) b.setAttribute('aria-label', aria);
      b.addEventListener('click', () => rpc(method.m, method.p).catch(e => toast(e.message, true)));
      return b;
    };
    padBox.append(
      cell('ⓘ', {m: 'Input.Info'}, '', 'Info'), cell('▲', {m: 'Input.Up'}, '', 'Up'), cell('☰', {m: 'Input.ContextMenu'}, '', 'Menu'),
      cell('◀', {m: 'Input.Left'}, '', 'Left'), cell('OK', {m: 'Input.Select'}, 'ok'), cell('▶', {m: 'Input.Right'}, '', 'Right'),
      cell('↩', {m: 'Input.Back'}, '', 'Back'), cell('▼', {m: 'Input.Down'}, '', 'Down'), cell('⌂', {m: 'Input.Home'}, '', 'Home'));
    const keys = el('div', 'keys');
    keys.append(
      cell('Play / Pause', {m: 'Input.ExecuteAction', p: {action: 'playpause'}}),
      cell('Stop', {m: 'Input.ExecuteAction', p: {action: 'stop'}}),
      cell('Player menu', {m: 'Input.ShowOSD'}),
      cell('Volume −', {m: 'Application.SetVolume', p: {volume: 'decrement'}}),
      cell('Mute', {m: 'Application.SetMute', p: {mute: 'toggle'}}),
      cell('Volume +', {m: 'Application.SetVolume', p: {volume: 'increment'}}),
      cell('Subtitles', {m: 'Input.ExecuteAction', p: {action: 'nextsubtitle'}}),
      cell('Audio track', {m: 'Input.ExecuteAction', p: {action: 'audionextlanguage'}}),
      cell('TV guide', {m: 'GUI.ActivateWindow', p: {window: 'tvguide'}}),
      cell('Kodi settings', {m: 'GUI.ActivateWindow', p: {window: 'settings'}}),
      cell('Home rows…', {m: 'Addons.ExecuteAddon', p: {addonid: 'script.jmediabox.tools', params: ['rows']}}),
      cell('TV home', {m: 'GUI.ActivateWindow', p: {window: 'home'}}));
    wrap.append(padBox, keys);
    view.replaceChildren(head, wrap);
    autofocus(padBox.querySelector('.ok'));
  }

  async function renderFavorites(token) {
    setHero('Favorites', 'Loading…', '', '');
    const {head, filter} = pageHead('Favorites', true);
    const grid = el('div', 'grid wide');
    grid.dataset.nav = 'grid';
    view.replaceChildren(head, grid);
    autofocus(head.querySelector('.back'));
    let list;
    try { list = await favorites(true); } catch (e) {
      if (token === navToken) setHero('Favorites', 'Could not load favorites: ' + e.message, '', '');
      return;
    }
    if (token !== navToken) return;
    const tiles = list.map(favItem).map(it => ({it, node: tile(it, 'wide', openItem)}));
    grid.replaceChildren(...tiles.map(t => t.node));
    setHero('Favorites', list.length ? list.length + ' favorites  •  the same list as the TV' : 'No favorites yet', '', '');
    if (!list.length) grid.append(el('p', 'empty', 'Open any movie, show, episode or channel and choose ☆ Add to favorites.'));
    filter.addEventListener('input', () => {
      const q = filter.value.trim().toLowerCase();
      for (const t of tiles) t.node.hidden = q !== '' && !t.it.title.toLowerCase().includes(q);
    });
  }

  function renderPower() {
    setHero('Power', 'These act on the Kodi box itself.', '', '');
    const {head} = pageHead('Power', false);
    const keys = el('div', 'keys');
    keys.style.maxWidth = '520px';
    const ask = (label, method, warn) => {
      const b = el('button', 'danger', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        if (!window.confirm(warn)) return;
        rpc(method).then(() => toast(label + ' sent to the Kodi box')).catch(e => toast(e.message, true));
      });
      return b;
    };
    keys.append(
      ask('Restart Kodi box', 'System.Reboot', 'Restart the Kodi box now? Playback stops and the menu is back in about a minute.'),
      ask('Shut down', 'System.Shutdown', 'Shut down the Kodi box? You will need to press its power button to turn it back on.'));
    const note = el('p', 'empty', 'Shutting down takes the box offline until someone presses its power button.');
    view.replaceChildren(head, keys, note);
    autofocus(head.querySelector('.back'));
  }

  // ---------- Router ----------
  function go(hash, replace) {
    if (location.hash === hash) return route();
    if (replace) { history.replaceState(null, '', hash); route(); } else location.hash = hash;
  }
  function route() {
    const token = ++navToken;
    closeSheet();
    const h = location.hash.replace(/^#/, '');
    const [name, ...rest] = h.split('/');
    const arg = rest.join('/');
    window.scrollTo(0, 0);
    if (name === 'browse' && Object.hasOwn(LIBRARY, arg)) {
      const titles = {movies: 'Movies', shows: 'TV Shows', streaming: 'Streaming'};
      return renderGrid(titles[arg], LIBRARY[arg], token);
    }
    if (name === 'dir') {
      const d = decodePath(arg);
      if (d && typeof d.p === 'string' && /^(plugin|pvr|videodb):\/\//.test(d.p)) return renderGrid(d.t || 'Browse', d.p, token);
    }
    if (name === 'channels') return renderChannels(token);
    if (name === 'search') return renderSearch(decodeURIComponent(arg || ''), token);
    if (name === 'remote') return renderRemote();
    if (name === 'power') return renderPower();
    if (name === 'favorites') return renderFavorites(token);
    return renderHome(token);
  }

  // ---------- TV-style keyboard navigation ----------
  function focusables(container) {
    return [...container.querySelectorAll(':scope > button:not([hidden]), :scope > a')];
  }
  function moveVertical(dir) {
    const cur = document.activeElement;
    const groups = [...view.querySelectorAll('[data-nav="row"]')].filter(g => focusables(g).length);
    const inRow = cur && cur.parentElement && cur.parentElement.dataset.nav === 'row' ? cur.parentElement : null;
    if (!inRow) return false;
    const i = groups.indexOf(inRow);
    const target = groups[i + dir];
    if (!target) { if (dir < 0) window.scrollTo({top: 0, behavior: 'smooth'}); return true; }
    const x = cur.getBoundingClientRect().left;
    let best = null, bestD = Infinity;
    for (const n of focusables(target)) {
      const d = Math.abs(n.getBoundingClientRect().left - x);
      if (d < bestD) { best = n; bestD = d; }
    }
    if (best) { best.focus({preventScroll: true}); best.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'smooth'}); }
    return true;
  }
  function moveGrid(cur, key) {
    const items = focusables(cur.parentElement);
    const i = items.indexOf(cur);
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const n = items[i + (key === 'ArrowLeft' ? -1 : 1)];
      if (n) { n.focus({preventScroll: true}); n.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'smooth'}); }
      return true;
    }
    if (cur.parentElement.dataset.nav !== 'grid') return false;
    const r = cur.getBoundingClientRect();
    const dir = key === 'ArrowDown' ? 1 : -1;
    let best = null, bestD = Infinity;
    for (const n of items) {
      const nr = n.getBoundingClientRect();
      if (dir > 0 ? nr.top <= r.top + 5 : nr.top >= r.top - 5) continue;
      const d = Math.abs(nr.top - r.top) * 4 + Math.abs(nr.left - r.left);
      if (d < bestD) { best = n; bestD = d; }
    }
    if (best) { best.focus({preventScroll: true}); best.scrollIntoView({block: 'center', behavior: 'smooth'}); }
    else if (dir < 0) { const b = view.querySelector('.back'); if (b) b.focus(); }
    return true;
  }
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape') {
      if (!$('sheet').hidden) { closeSheet(); e.preventDefault(); return; }
      if (location.hash && location.hash !== '#home') { history.back(); e.preventDefault(); }
      return;
    }
    if (!/^Arrow/.test(e.key) || !$('sheet').hidden) return;
    const cur = document.activeElement;
    if (cur && cur.tagName === 'INPUT') return;
    if (location.hash === '#remote') {
      // On the Remote page the arrow keys steer the TV, like the remote's d-pad.
      rpc('Input.' + e.key.slice(5)).catch(err => toast(err.message, true));
      e.preventDefault();
      return;
    }
    if (!cur) return;
    const parentNav = cur.parentElement && cur.parentElement.dataset.nav;
    if (!parentNav) return;
    let handled = false;
    if (parentNav === 'row' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) handled = moveVertical(e.key === 'ArrowDown' ? 1 : -1);
    else handled = moveGrid(cur, e.key);
    if (handled) e.preventDefault();
  });

  // ---------- Header: clock, weather, now playing ----------
  function tickClock() {
    const d = new Date();
    $('clock').textContent = d.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'}) + '  •  ' +
      d.toLocaleDateString([], {weekday: 'long', month: 'short', day: 'numeric'});
  }
  async function loadWeather() {
    try {
      const w = await rpc('XBMC.GetInfoLabels', {labels: ['Weather.Temperature', 'Weather.Conditions', 'Weather.Location', 'System.FriendlyName']});
      if (w['System.FriendlyName']) $('device-name').textContent = w['System.FriendlyName'];
      if (!w['Weather.Temperature'] || /busy/i.test(w['Weather.Temperature'])) return;
      $('weather-temp').textContent = w['Weather.Temperature'];
      $('weather-text').textContent = [w['Weather.Conditions'], w['Weather.Location']].filter(Boolean).join('  •  ');
      $('weather').hidden = false;
    } catch { /* weather is optional */ }
  }
  let nowPlayer = null;
  async function pollNow() {
    try {
      const players = await rpc('Player.GetActivePlayers');
      const p = (players || []).find(x => x.type === 'video') || (players || [])[0];
      if (!p) { nowPlayer = null; $('now').hidden = true; document.body.classList.remove('has-now'); return; }
      nowPlayer = p.playerid;
      const [{item}, props] = await Promise.all([
        rpc('Player.GetItem', {playerid: p.playerid, properties: ['title', 'showtitle', 'season', 'episode', 'thumbnail', 'art', 'channel']}),
        rpc('Player.GetProperties', {playerid: p.playerid, properties: ['percentage', 'speed', 'time', 'totaltime', 'live']})
      ]);
      const title = item.showtitle || item.title || item.label || 'Playing';
      const sub = item.channel ? item.channel : item.episode > 0 ? 'S' + item.season + 'E' + item.episode + '  •  ' + (item.title || '') : item.title !== title ? item.title : '';
      $('now-title').textContent = title;
      const t = props.time, tt = props.totaltime;
      const clock = t && tt && tt.hours + tt.minutes + tt.seconds > 0
        ? (t.hours ? t.hours + ':' : '') + pad(t.minutes) + ':' + pad(t.seconds) + ' / ' + (tt.hours ? tt.hours + ':' : '') + pad(tt.minutes) + ':' + pad(tt.seconds) : '';
      $('now-sub').textContent = ['Now on the TV', sub, clock].filter(Boolean).join('  •  ');
      $('now-progress').style.width = (props.percentage || 0) + '%';
      $('now-toggle').textContent = props.speed === 0 ? '▶' : '❚❚';
      const pic = art(item, 'poster', 'tvshow.poster', 'thumb', 'thumbnail');
      if (pic) $('now-art').src = pic; else $('now-art').removeAttribute('src');
      $('now').hidden = false;
      document.body.classList.add('has-now');
    } catch { /* keep last state */ }
  }
  document.querySelectorAll('[data-player]').forEach(b => b.addEventListener('click', async () => {
    if (nowPlayer == null) return;
    const a = b.dataset.player;
    try {
      if (a === 'toggle') await rpc('Player.PlayPause', {playerid: nowPlayer});
      if (a === 'stop') await rpc('Player.Stop', {playerid: nowPlayer});
      if (a === 'back') await rpc('Player.Seek', {playerid: nowPlayer, value: {seconds: -30}});
      if (a === 'forward') await rpc('Player.Seek', {playerid: nowPlayer, value: {seconds: 30}});
    } catch (e) { toast(e.message, true); }
    setTimeout(pollNow, 400);
  }));

  // ---------- Start ----------
  $('sheet-close').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', e => { if (e.target === $('sheet')) closeSheet(); });
  if (!live) {
    const device = params.get('device');
    const banner = $('banner');
    banner.hidden = false;
    banner.append(el('strong', null, 'Preview with sample titles. '));
    banner.append('This page is running from GitHub, which can\'t reach Kodi directly. ');
    if (Object.hasOwn(DEVICES, device)) {
      const a = el('a', null, 'Open the live Enhanced menu on your Kodi');
      a.href = 'http://' + DEVICES[device] + ':' + KODI_PORT + '/addons/webinterface.jmediabox/';
      banner.append(a, ' (Tailscale must be on).');
    } else banner.append('Open it from Connect → Enhanced menu to control your TV.');
    $('device-name').textContent = 'Preview';
  }
  tickClock();
  setInterval(tickClock, 15000);
  loadWeather();
  pollNow();
  setInterval(() => { if (!document.hidden) pollNow(); }, 4000);
  window.addEventListener('hashchange', route);
  route();
})();
