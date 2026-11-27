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
  // The streaming page and add-on menus, shaped like the real ones (jmediabox pages.json, CINEHD, POV, Seren…).
  const JMB = 'plugin://plugin.video.jmediabox/?page=';
  const svc = (label, file, i, dir) => ({label, title: label, type: 'unknown', filetype: dir ? 'directory' : 'file', file, art: {thumb: poster(label, i, 640, 360)}});
  const services = [svc('Master Search', 'plugin://plugin.video.jmedia.mastersearch/', 0, 1), svc('Jacktook', JMB + 'streaming&go=1', 1),
    svc('Spelunkr', JMB + 'streaming&go=2', 2), svc('Seren', JMB + 'streaming&go=3', 3), svc('POV', JMB + 'streaming&go=4', 4),
    svc('CINEHD', 'plugin://plugin.video.cinehd/', 5, 1), svc('More Services', JMB + 'more-services', 6, 1)];
  const liveTv = [svc('Program Guide', JMB + 'live-tv&go=0', 0), svc('All Channels', JMB + 'live-tv&go=1', 1), svc('Recordings', JMB + 'live-tv&go=2', 2),
    svc('TV Mix', JMB + 'live-tv&go=3', 3), svc('Custom Channels', JMB + 'custom-channels', 4, 1)];
  const moreServices = [svc('TubiTV', JMB + 'more-services&go=4', 0), svc('YouTube', JMB + 'more-services&go=5', 1), svc('Pluto TV', JMB + 'more-services&go=8', 2)];
  const menu = (base, entries) => entries.map(([label, q, file], i) => ({label, title: label, type: 'unknown', filetype: file ? 'file' : 'directory', file: base + q, art: {thumb: poster(label, i + 1, 640, 360)}}));
  const asMovie = (m, file) => Object.assign({}, m, {file});
  const asShow = (sh, file, type) => Object.assign({}, sh, {file, type: type || 'tvshow', plot: 'A sample series. Pick it to see its seasons on the phone.'});
  const matches = (list, q) => list.filter(x => x.title.toLowerCase().includes(q.toLowerCase()));
  function addon(path) {
    const [base, qs] = path.split('?');
    const a = new URLSearchParams(qs || '');
    const id = base.replace('plugin://', '').replace(/\/$/, '');
    const q = a.get('query') || a.get('q') || a.get('actionArgs') || '';
    if (id === 'plugin.video.cinehd') {
      const B = 'plugin://plugin.video.cinehd/?';
      const mv = list => list.map((m, i) => asMovie(m, B + 'mode=play&kind=movie&id=' + movies.indexOf(m)));
      const tv = list => list.map(sh => asShow(sh, B + 'mode=seasons&kind=tv&id=' + shows.indexOf(sh), 'unknown'));
      const mode = a.get('mode');
      if (!mode) return menu(B, [['Search movies and TV shows', 'mode=search'], ['Movies', 'mode=catalogue&kind=movie'], ['TV shows', 'mode=catalogue&kind=tv'], ['Trending movies', 'mode=catalogue&kind=movie&trending=true']]);
      if (mode === 'search') return mv(matches(movies, q)).concat(tv(matches(shows, q)));
      if (mode === 'catalogue') return a.get('kind') === 'tv' ? tv(shows) : mv(a.get('trending') ? pick(movies, 6, 5) : movies);
      if (mode === 'seasons') return menu(B, [['Season 1', 'mode=episodes&season=1&id=' + a.get('id')], ['Season 2', 'mode=episodes&season=2&id=' + a.get('id')]]);
      if (mode === 'episodes') return episodes.filter(e => e.showtitle === showNames[+a.get('id')]).map(e => Object.assign({}, e, {file: B + 'mode=play&kind=tv&id=' + a.get('id') + '&episode=' + e.episode}));
    }
    if (id === 'plugin.video.pov') {
      const B = 'plugin://plugin.video.pov/?';
      const mv = list => list.map(m => asMovie(m, B + 'mode=play_media&mediatype=movie&tmdb_id=' + movies.indexOf(m)));
      const tv = list => list.map(sh => asShow(sh, B + 'mode=build_season_list&tmdb_id=' + shows.indexOf(sh)));
      const mode = a.get('mode') || '';
      if (!mode) return menu(B, [['Movies', 'mode=navigator.main&action=MovieList'], ['TV Shows', 'mode=navigator.main&action=TVShowList'], ['Search', 'mode=navigator.search'], ['Popular People', 'mode=build_popular_people', 1]]);
      if (mode === 'navigator.main') return a.get('action') === 'TVShowList' ? menu(B, [['Trending', 'mode=build_tvshow_list&action=trakt_tv_trending'], ['Popular', 'mode=build_tvshow_list&action=tmdb_tv_popular']])
        : menu(B, [['Trending', 'mode=build_movie_list&action=trakt_movies_trending'], ['Popular', 'mode=build_movie_list&action=tmdb_movies_popular'], ['Genres', 'mode=navigator.genres&menu_type=movie']]);
      if (mode === 'build_movie_list') return mv(q ? matches(movies, q) : pick(movies, 10, 2));
      if (mode === 'build_tvshow_list') return tv(q ? matches(shows, q) : shows);
      if (mode === 'build_season_list') return [1, 2].map(n => Object.assign(asShow(shows[+a.get('tmdb_id')], B + 'mode=build_episode_list&season=' + n + '&tmdb_id=' + a.get('tmdb_id'), 'season'), {label: 'Season ' + n, title: 'Season ' + n}));
      if (mode === 'build_episode_list') return episodes.filter(e => e.showtitle === showNames[+a.get('tmdb_id')]).map(e => Object.assign({}, e, {file: B + 'mode=play_media&mediatype=episode&tmdb_id=' + a.get('tmdb_id') + '&episode=' + e.episode}));
      return menu(B, [['Action', 'mode=build_movie_list&genre_id=28'], ['Comedy', 'mode=build_movie_list&genre_id=35']]);
    }
    if (id === 'plugin.video.seren') {
      const B = 'plugin://plugin.video.seren/?';
      const mv = list => list.map(m => asMovie(m, B + 'action=getSources&action_args=' + movies.indexOf(m)));
      const act = a.get('action') || '';
      if (!act) return menu(B, [['Discover Movies', 'action=moviesHome'], ['Discover TV Shows', 'action=showsHome'], ['Search...', 'action=searchMenu']]);
      if (act === 'searchMenu') return menu(B, [['Movies', 'action=moviesSearch'], ['TV Shows', 'action=showsSearch']]);
      if (act === 'moviesHome') return menu(B, [['Trending', 'action=genericEndpoint&endpoint=trending&mediatype=movies'], ['Box Office Top 10', 'action=genericEndpoint&endpoint=boxoffice&mediatype=movies']]);
      if (act === 'moviesSearchResults') return mv(matches(movies, q));
      if (act === 'showsSearchResults' || act === 'showsHome') return (q ? matches(shows, q) : shows).map(sh => asShow(sh, 'plugin://plugin.video.pov/?mode=build_season_list&tmdb_id=' + shows.indexOf(sh)));
      return mv(pick(movies, 8, 1));
    }
    if (id === 'plugin.video.jmedia.mastersearch') {
      const B = 'plugin://plugin.video.jmedia.mastersearch/?';
      const mode = a.get('mode') || '';
      if (!mode) return menu(B, [['Search Spelunkr, Seren and POV', 'mode=search'], ['How source filtering works', 'mode=about']]);
      if (mode === 'search') return matches(movies, q).map(m => Object.assign(svc(m.title + ' (' + m.year + ') — Movie', B + 'mode=title&id=' + movies.indexOf(m), movies.indexOf(m), 1), {art: m.art, plot: m.plot}));
      if (mode === 'title') return [svc('Find ready streams — Seren + POV', B + 'mode=sources&id=' + a.get('id'), 1, 1)];
      return [];
    }
    if (id === 'plugin.video.jacktook') {
      const B = 'plugin://plugin.video.jacktook/?';
      const act = a.get('action') || '';
      if (!act) return menu(B, [['Search', 'action=search_menu&'], ['Movies', 'action=movies_items&'], ['TV Shows', 'action=tv_shows_items&']]);
      if (act === 'search_menu') return menu(B, [['Search', 'action=search_direct&mode=direct', 1]]);
      if (act === 'search_item') return pick(movies, 8, 3).map(m => asMovie(m, B + 'action=show_tmdb_item&mode=movies&id=' + movies.indexOf(m)));
      return menu(B, [['Trending', 'action=search_item&mode=movies&query=tmdb_trending&api=tmdb'], ['Popular', 'action=search_item&mode=movies&query=tmdb_popular&api=tmdb']]);
    }
    if (/^plugin\.video\.tubitv/.test(id)) {
      return a.get('mode') ? pick(movies, 8, 6).map(m => asMovie(m, 'plugin://plugin.video.tubitv/?mode=GV&url=' + movies.indexOf(m)))
        : menu('plugin://plugin.video.tubitv/?', [['Featured', 'mode=GS&url=featured'], ['Most Popular', 'mode=GS&url=most_popular']]);
    }
    return null;
  }
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
  const favs = [
    {title: 'Northern Lights (2008)', type: 'media', path: 'plugin://demo/movie/0', thumbnail: movies[0].art.poster},
    {title: 'Harbor Patrol', type: 'window', window: 'videos', windowparameter: 'plugin://demo/show/0', thumbnail: shows[0].art.poster},
    {title: 'TV Mix', type: 'script', path: '/storage/.kodi/addons/plugin.video.tv.mix/channel_action.py', thumbnail: ''}
  ];
  let playing = null;
  let paused = false;
  let pos = 0;
  function directory(path) {
    if (/page=streaming/.test(path)) return services;
    if (/page=live-tv/.test(path)) return liveTv;
    if (/page=more-services/.test(path)) return moreServices;
    if (/page=custom-channels/.test(path)) return [svc('Twilight Zone TV', JMB + 'custom-channels&go=0', 1), svc('Three Stooges TV', JMB + 'custom-channels&go=1', 2)];
    if (!/jellycon|demo/.test(path)) { const r = addon(path); if (r) return r; }
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
    if (/IncludeItemTypes%3DMovie/.test(path)) return movies;
    if (/IncludeItemTypes%3DSeries/.test(path)) return shows;
    const s = /demo\/show\/(\d+)/.exec(path);
    if (s) return episodes.filter(e => e.showtitle === showNames[+s[1]]);
    return pick(movies, 8, 3);
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
            : all().find(x => x.file === p.item.file) || {title: 'Sample stream', runtime: 5400};
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
        case 'Favourites.GetFavourites': return {favourites: favs.map(f => Object.assign({}, f)), limits: {start: 0, end: favs.length, total: favs.length}};
        case 'Favourites.AddFavourite': {
          // Kodi 21 toggles: the same path (or window target) again removes it.
          const key = f => f.type === 'window' ? 'w:' + f.windowparameter : 'p:' + f.path;
          const i = favs.findIndex(f => key(f) === key(p));
          if (i >= 0) favs.splice(i, 1); else favs.push(Object.assign({}, p));
          return 'OK';
        }
        case 'PVR.GetClients': return {clients: [{clientid: 2, instanceid: 1, addonid: 'pvr.iptvsimple'}]};
        case 'PVR.GetChannelDetails': return {channeldetails: {channelid: p.channelid, clientid: 2, uniqueid: 1000 + p.channelid}};
        case 'Player.PlayPause': paused = !paused; return {speed: paused ? 0 : 1};
        case 'Player.Stop': playing = null; return 'OK';
        case 'Player.Seek': pos = Math.max(0, pos + p.value.seconds); return {};
        case 'Addons.ExecuteAddon':
          // The VPN switch then plays: PlayMedia("…") arrives base64url-encoded.
          if (p.addonid === 'service.local.vpn.favourites') {
            const cmd = atob(p.params[1].replace(/-/g, '+').replace(/_/g, '/'));
            if (/^PlayMedia/.test(cmd)) { playing = {title: 'Sample stream', runtime: 5400}; paused = false; pos = 0; }
            window.DemoKodi.lastCommand = cmd;
          }
          return 'OK';
        default: return 'OK';
      }
    }
  };
})();
