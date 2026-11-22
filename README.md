# Kodi Control Hub

A static GitHub Pages launcher for KodiLA, Original Kodi, their existing assistants and the shared iMac Jellyfin library.

## Access

The website contains links only. It does not proxy private network requests, store device passwords, or authenticate visitors to Kodi. Visitors need Tailscale access to each device and the existing device dashboard login. The shared iMac library requires access to the iMac too.

The **Get Tailscale** button links to the official download page. Visitors must still accept a device-sharing invitation from the owner; installing Tailscale alone does not grant access.

## Connect buttons

Each box has a Connect button. On Android, it opens the installed Tailscale app using its supported navigation link. The visitor taps Connect in Tailscale if needed, then returns to the hub. The hub opens the selected box's dashboard in the same tab. The selected box is stored in tab-scoped session storage for up to ten minutes; there is no saved password, VPN token, cloud proxy, or claim of confirmed connectivity. A cancel button and direct dashboard links are always available. Missing-app fallback stays on the connection help page instead of redirecting to an unreachable private address.

On other platforms, the connection page instructs visitors to open and connect Tailscale manually, then use the chosen dashboard link. Browser links cannot silently switch the VPN on: Tailscale's supported Android deep links only navigate, and Chrome only launches browser-accessible activities from a user gesture. Native Tailscale automation activities are not exposed to browser links.

References: [Tailscale Android deep-link handler](https://github.com/tailscale/tailscale-android/blob/main/android/src/main/java/com/tailscale/ipn/ui/util/DeepLinkNavigator.kt), [Android manifest](https://github.com/tailscale/tailscale-android/blob/main/android/src/main/AndroidManifest.xml), [Chrome Android intents](https://developer.chrome.com/docs/android/intents).

## Guide and library search

Enter a term and choose KodiLA, Original Kodi or the iMac Jellyfin library. The hub opens that box's private `/tv-search` page, where the existing dashboard login protects program results and playback controls. Search covers channel names, program titles, episode names and descriptions in currently loaded current/upcoming guide data. On-now and upcoming filters and paginated results are available. Tune channel buttons play the current live broadcast on the selected Kodi TV; they do not play future programs on demand.

Choosing the iMac opens Jellyfin's own library search at `/web/#/search?query=...`, which covers stored movies, shows, music and recordings rather than live-TV listings. It uses the Jellyfin hash route and query parameter current in Jellyfin 10.9 and later; Jellyfin's own login still applies. Results are not combined across devices: each search opens on the device you picked.

Without JavaScript the device selector cannot route the form, so the form is hidden and direct per-device search links are shown instead.

The search service runs on each Kodi box, not on GitHub Pages. Search results are limited to currently available TV channels and exclude hidden or locked channels. Channel-name matches are possible even when a channel has no program-guide data. The page shows guide coverage so missing listings are visible.

GitHub Pages publication normally makes the launcher public, even when a repository is private. The device addresses remain private Tailscale endpoints.

## Publish

In repository Settings → Pages, select **Deploy from a branch**, choose **main** and **/(root)**. Public-repository Pages is supported on GitHub Free. Keep `.nojekyll` in the root.

## Files

- `index.html`: launcher and connection help
- `style.css`: responsive styling
- `app.js`: clipboard interaction
- `connection.js`: Tailscale app handoff and per-box return routing
- `connect.html`: connection help and missing-app fallback
- `icon.svg`: site icon

No package installation or build step is needed.
