'use strict';
/* Sample Kodi for the GitHub Pages preview. Titles are made up; artwork is generated. */
(() => {
  const palette = ['#24507c', '#4b3d72', '#235d57', '#7a4530', '#5a2a4a', '#3b4a5c', '#2f5d2f', '#6b5a24'];
  function poster(title, i, w, h) {
    const c = palette[i % palette.length];
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '"/><stop offset="1" stop-color="#0a1622"/></linearGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="' + (h * 0.8) + '" fill="#fff" font-family="sans-serif" font-size="' + Math.round(w / 11) +
      '" text-anchor="middle">' + title.replace(/[<&]/g, '') + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const movieNames = ['Northern Lights', 'The Long Road', 'Midnight Diner', 'Glass Harbor', 'Paper Moon Rising', 'Quiet Hours',
    'Iron Orchard', 'Saltwater', 'The Last Ferry', 'Blue Canyon', 'Static', 'Hollow Pines'];
  const showNames = ['Harbor Patrol', 'Kitchen Nights', 'Cosmic Shorts', 'The Archive', 'Ranch Hands', 'Night Shift'];
  const genres = ['Comedy', 'Horror', 'Thriller', 'Drama', 'Animation'];
  const movies = movieNames.map((t, i) => ({
    label: t, title: t, type: 'movie', filetype: 'file', file: 'plugin://demo/movie/' + i, year: 2008 + i, runtime: 5400 + i * 300,
    genre: [genres[i % genres.length]], rating: 6 + (i % 4) * 0.7,
    plot: 'A sample film used for the preview. On your TV this row shows your own Jellyfin titles.',
    art: {poster: poster(t, i, 300, 450), fanart: poster('', i + 2, 1280, 720)},
    resume: {position: i < 3 ? 1200 * (i + 1) : 0, total: 5400}
  }));
  const shows = showNames.map((t, i) => ({
    label: t, title: t, type: 'tvshow', filetype: 'directory', file: 'plugin://demo/show/' + i, year: 2015 + i,
    genre: [genres[(i + 1) % genres.length]], plot: 'A sample series for the preview.', art: {poster: poster(t, i + 3, 300, 450)}
  }));
  const episodes = showNames.flatMap((t, i) => [1, 2, 3].map(e => ({
    label: 'Episode ' + e, title: 'Chapter ' + e, showtitle: t, season: 1, episode: e, type: 'episode', filetype: 'file',
    file: 'plugin://demo/ep/' + i + '/' + e, runtime: 1500, plot: 'A sample episode.', art: {thumb: poster(t + ' ' + e, i + e, 640, 360)}
  })));
  const services = ['Netflix', 'Max', 'Disney+', 'YouTube', 'Pluto TV', 'Tubi'].map((t, i) => ({
    label: t, title: t, type: 'unknown', filetype: 'directory', file: 'plugin://demo/service/' + i, art: {thumb: poster(t, i, 640, 360)}
  }));
  const now = ['Evening News', 'NHL Hockey', 'Cooking Live', 'Classic Movie', 'Cartoon Hour', 'Weather Now', 'Late Show', 'Documentary'];
  const chans = ['2.1 KDTN-DT', '2.2 KDTN-ES', '4.1 KDFW-DT', '4.2 KDFW D2', '4.3 Heroes', '5.1 KXAS', '8.1 WFAA', '11.1 KTVT'].map((n, i) => ({
    channelid: i + 1, label: n, channel: n, channelnumber: i + 1, hidden: false, locked: false,
    lastplayed: '2026-11-2' + (5 - (i % 5)) + ' 21:00:00',
    broadcastnow: {title: now[i], progresspercentage: 15 + i * 9, plot: 'Sample listing.'},
    broadcastnext: {title: now[(i + 3) % now.length]}
  }));
  const pick = (list, n, off) => list.slice(off || 0).concat(list).slice(0, n);
  const dirs = {
    inprogress_movies: () => movies.slice(0, 3),
    inprogress_episodes: () => pick(episodes, 4, 2),
    nextup_episodes: () => pick(episodes, 5, 5),
    recent_movies: () => pick(movies, 10, 4),
    recent_episodes: () => pick(episodes, 8, 1),
    recent_tvshows: () => shows,
    random_movies: () => pick(movies, 10, 7)
  };
  let playing = null;
  let paused = false;
  let pos = 0;
  function directory(path) {
    const w = /type=([a-z_]+)/.exec(path);
    if (w && dirs[w[1]]) return dirs[w[1]]();
    const g = /Genres%3D([A-Za-z]+)/.exec(path);
    if (g) {
      const list = (/Series/.test(path) ? shows : movies).filter(m => m.genre[0] === g[1]);
      return list.length ? list : pick(/Series/.test(path) ? shows : movies, 4, 2);
    }
    if (/Filters%3DIsPlayed/.test(path)) return pick(movies, 6, 1);
    const st = /SearchTerm%3D([^%]*(?:%25[0-9A-F]{2}[^%]*)*)%26IncludeItemTypes%3D(\w+)/.exec(path);
    if (st) {
      const q = decodeURIComponent(decodeURIComponent(st[1])).toLowerCase();
      const src = st[2] === 'Movie' ? movies : st[2] === 'Series' ? shows : episodes;
      return src.filter(x => (x.title + ' ' + (x.showtitle || '')).toLowerCase().includes(q));
    }
    if (/page=streaming/.test(path)) return services;
    if (/page=live-tv/.test(path)) return services.slice(3);
    if (/IncludeItemTypes%3DMovie/.test(path)) return movies;
    if (/IncludeItemTypes%3DSeries/.test(path)) return shows;
    const s = /demo\/show\/(\d+)/.exec(path);
    if (s) return episodes.filter(e => e.showtitle === showNames[+s[1]]);
    if (/demo\/service/.test(path)) return pick(movies, 8, 3);
    return [];
  }
  const all = () => movies.concat(episodes);
  window.DemoKodi = {
    async call(method, p) {
      await new Promise(r => setTimeout(r, 120 + Math.random() * 200));
      switch (method) {
        case 'Files.GetDirectory': {
          let files = directory(p.directory);
          if (p.limits) files = files.slice(p.limits.start, p.limits.end);
          return {files: files.map(f => Object.assign({}, f))};
        }
        case 'PVR.GetChannels': return {channels: p.limits ? chans.slice(p.limits.start, p.limits.end) : chans};
        case 'XBMC.GetInfoLabels': return {'Weather.Temperature': '41°F', 'Weather.Conditions': 'Clear', 'Weather.Location': 'Fort Worth', 'System.FriendlyName': 'Original Kodi (preview)'};
        case 'Player.Open':
          playing = p.item.channelid ? Object.assign({channel: chans[p.item.channelid - 1].label}, {title: chans[p.item.channelid - 1].broadcastnow.title})
            : all().find(x => x.file === p.item.file) || null;
          paused = false; pos = 0;
          return 'OK';
        case 'Player.GetActivePlayers': return playing ? [{playerid: 1, type: 'video'}] : [];
        case 'Player.GetItem': return {item: playing || {}};
        case 'Player.GetProperties': {
          if (!paused) pos += 4;
          const total = (playing && playing.runtime) || 1800;
          const t = s => ({hours: Math.floor(s / 3600), minutes: Math.floor(s / 60) % 60, seconds: s % 60, milliseconds: 0});
          return {percentage: 100 * pos / total, speed: paused ? 0 : 1, time: t(pos), totaltime: t(total), live: !!(playing && playing.channel)};
        }
        case 'Player.PlayPause': paused = !paused; return {speed: paused ? 0 : 1};
        case 'Player.Stop': playing = null; return 'OK';
        case 'Player.Seek': pos = Math.max(0, pos + p.value.seconds); return {};
        default: return 'OK';
      }
    }
  };
})();
