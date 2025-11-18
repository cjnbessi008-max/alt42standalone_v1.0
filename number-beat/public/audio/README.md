# Audio Files

This directory should contain the following audio files:

## Required Files

1. **beat.mp3** - Rhythm beat sound (played during rhythm pattern)
   - Duration: ~200ms
   - Format: MP3 or OGG
   - Suggested: Simple percussive sound (e.g., metronome click, hi-hat)

2. **success.mp3** - Correct answer sound
   - Duration: ~1-2 seconds
   - Format: MP3
   - Suggested: Cheerful chime or success jingle

3. **fail.mp3** - Wrong answer sound
   - Duration: ~500ms
   - Format: MP3
   - Suggested: Low buzz or gentle error sound

4. **tap.mp3** - Number selection sound
   - Duration: ~100ms
   - Format: MP3
   - Suggested: Short tap or click sound

## Obtaining Audio Files

You can obtain free sound effects from:
- **Freesound.org** - https://freesound.org/
- **Zapsplat** - https://www.zapsplat.com/
- **Free Music Archive** - https://freemusicarchive.org/

Or use the Web Audio API fallback (already implemented in audio.js)

## Converting Audio Files

To convert audio files to MP3:
```bash
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k beat.mp3
```

## File Sizes

Keep audio files small (< 100KB each) for faster loading.
