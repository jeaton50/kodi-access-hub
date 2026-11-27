#!/usr/bin/env python3
"""Package enhanced/ as the Kodi add-on webinterface.jmediabox-<version>.zip.

Usage: python3 kodi/build_webinterface.py [output_dir]
Install the zip on Kodi with Add-ons > Install from zip file.
"""
import io
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ADDON = 'webinterface.jmediabox'
SOURCE = ROOT / 'enhanced'
MANIFEST = ROOT / 'kodi' / ADDON / 'addon.xml'


def icon_png():
    """A 256x256 solid PNG in the menu's accent colour (Kodi add-on icons must be PNG)."""
    import struct
    import zlib
    w = h = 256
    row = b'\x00' + bytes((0x0a, 0x16, 0x22)) * w
    raw = row * h
    def chunk(kind, data):
        c = struct.pack('>I', len(data)) + kind + data
        return c + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def main():
    out_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'dist'
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = MANIFEST.read_text(encoding='utf-8')
    version = re.search(r'<addon[^>]*\sversion="([^"]+)"', manifest).group(1)
    target = out_dir / f'{ADDON}-{version}.zip'
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr(f'{ADDON}/addon.xml', manifest)
        z.writestr(f'{ADDON}/icon.png', icon_png())
        for f in sorted(SOURCE.iterdir()):
            if f.is_file():
                z.write(f, f'{ADDON}/{f.name}')
    print(target)


if __name__ == '__main__':
    main()
