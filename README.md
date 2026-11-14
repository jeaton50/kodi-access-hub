# Kodi Control Hub

A static GitHub Pages launcher for KodiLA, Original Kodi, their existing assistants and the shared iMac Jellyfin library.

## Access

The website contains links only. It does not proxy private network requests, store device passwords, or authenticate visitors to Kodi. Visitors need Tailscale access to each device and the existing device dashboard login. The shared iMac library requires access to the iMac too.

The **Get Tailscale** button links to the official download page. Visitors must still accept a device-sharing invitation from the owner; installing Tailscale alone does not grant access.

GitHub Pages publication normally makes the launcher public, even when a repository is private. The device addresses remain private Tailscale endpoints.

## Publish

In repository Settings → Pages, select **Deploy from a branch**, choose **main** and **/(root)**. Public-repository Pages is supported on GitHub Free. Keep `.nojekyll` in the root.

## Files

- `index.html`: launcher and connection help
- `style.css`: responsive styling
- `app.js`: clipboard interaction
- `icon.svg`: site icon

No package installation or build step is needed.
