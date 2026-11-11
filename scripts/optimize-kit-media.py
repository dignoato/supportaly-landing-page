#!/usr/bin/env python3
"""Create compact, responsive WebP derivatives; preserve migration originals."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets' / 'kit-optimized'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = json.loads((ROOT / 'migration/wix-media-manifest.json').read_text())
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = []
    sources = [ROOT / asset['localEquivalent'] for asset in manifest['assets']]
    sources += sorted((ROOT / 'assets/product-originals').glob('*.png'))
    for source in sources:
        variants = []
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            for size, quality in ((160, 78), (640, 82), (1200, 85)):
                variant = image.copy()
                # Width descriptors must match actual pixel widths, including portraits.
                width = min(size, image.width)
                height = round(image.height * width / image.width)
                variant = variant.resize((width, height), Image.Resampling.LANCZOS)
                target = OUTPUT / f'{source.stem}-{size}.webp'
                variant.save(target, 'WEBP', quality=quality, method=6)
                variants.append({'path': target.relative_to(ROOT).as_posix(),
                                 'width':width, 'height':height,
                                 'bytes':target.stat().st_size, 'sha256':digest(target)})
        assets.append({'source':source.relative_to(ROOT).as_posix(),
                       'sourceBytes':source.stat().st_size, 'sourceSha256':digest(source),
                       'variants':variants})
    index = {'version':1, 'format':'WebP', 'assets':assets}
    (OUTPUT / 'index.json').write_text(json.dumps(index, indent=2)+'\n')
    before = sum(a['sourceBytes'] for a in assets)
    after = sum(a['variants'][-1]['bytes'] for a in assets)
    print(f'{len(assets)} images: {before:,} -> {after:,} bytes at full size ({100*(1-after/before):.1f}% smaller)')


if __name__ == '__main__':
    main()
