# Icons Directory

This directory should contain PNG icons for the PWA in various sizes.

## Required Icons

Generate from `icon.svg` using an SVG-to-PNG converter:

- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-152.png` (152x152)
- `icon-192.png` (192x192) - Android
- `icon-384.png` (384x384)
- `icon-512.png` (512x512) - Android maskable

## How to Generate

### Online Tools
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

### Command Line (ImageMagick)
```bash
# Install ImageMagick
sudo apt-get install imagemagick

# Convert SVG to PNG at different sizes
convert -background none icon.svg -resize 72x72 icon-72.png
convert -background none icon.svg -resize 96x96 icon-96.png
convert -background none icon.svg -resize 128x128 icon-128.png
convert -background none icon.svg -resize 144x144 icon-144.png
convert -background none icon.svg -resize 152x152 icon-152.png
convert -background none icon.svg -resize 192x192 icon-192.png
convert -background none icon.svg -resize 384x384 icon-384.png
convert -background none icon.svg -resize 512x512 icon-512.png
```

### Node.js (sharp)
```bash
npm install sharp-cli -g
sharp -i icon.svg -o icon-72.png resize 72 72
sharp -i icon.svg -o icon-96.png resize 96 96
# ... repeat for all sizes
```

## Temporary Placeholder

Until PNG icons are generated, the browser will use `icon.svg` as a fallback.
For best PWA experience, generate all PNG sizes listed above.
