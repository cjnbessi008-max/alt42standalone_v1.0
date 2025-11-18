# Calming Message Audio Files

This directory contains audio files for the calming message feature.

## Audio File Structure

The system expects the following audio files:

- `difficulty_4.mp3` - Audio message for difficulty level 4 (Hard)
- `difficulty_5.mp3` - Audio message for difficulty level 5 (Very Hard)

## Audio Requirements

- **Format**: MP3 (recommended) or WAV
- **Duration**: 2-5 seconds
- **Bitrate**: 128kbps or higher
- **Sample Rate**: 44.1kHz
- **Channels**: Mono or Stereo

## Sample Messages (Korean)

### Difficulty Level 4:
"이 문제는 어렵지만 당신은 할 수 있어요. 깊게 숨을 쉬고 한 단계씩 시도해보세요."

Translation: "This problem is difficult, but you can do it. Take a deep breath and try step by step."

### Difficulty Level 5:
"이것은 도전적이지만, 당신에게는 실력이 있습니다. 신중하게 생각하고 계속 노력하세요."

Translation: "This is challenging, but you have the skills. Think carefully and keep trying."

## How to Generate Audio

### Option 1: Professional Recording
1. Record a voice actor reading the messages
2. Edit and normalize the audio
3. Export as MP3
4. Place in this directory

### Option 2: Text-to-Speech (TTS)
You can use online TTS services:

**Google Cloud Text-to-Speech:**
```bash
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json; charset=utf-8" \
  --data "{
    'input':{
      'text':'이 문제는 어렵지만 당신은 할 수 있어요. 깊게 숨을 쉬고 한 단계씩 시도해보세요.'
    },
    'voice':{
      'languageCode':'ko-KR',
      'name':'ko-KR-Wavenet-A'
    },
    'audioConfig':{
      'audioEncoding':'MP3'
    }
  }" \
  "https://texttospeech.googleapis.com/v1/text:synthesize" > difficulty_4.mp3
```

**Azure Cognitive Services:**
```bash
curl -X POST \
  -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  -H "Content-Type: application/ssml+xml" \
  -d '<speak version="1.0" xml:lang="ko-KR">
        <voice name="ko-KR-SunHiNeural">
          이 문제는 어렵지만 당신은 할 수 있어요. 깊게 숨을 쉬고 한 단계씩 시도해보세요.
        </voice>
      </speak>' \
  "https://YOUR_REGION.tts.speech.microsoft.com/cognitiveservices/v1" \
  > difficulty_4.mp3
```

**ElevenLabs (Premium Quality):**
```bash
curl -X POST \
  -H "xi-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 문제는 어렵지만 당신은 할 수 있어요. 깊게 숨을 쉬고 한 단계씩 시도해보세요.",
    "voice_settings": {
      "stability": 0.75,
      "similarity_boost": 0.75
    }
  }' \
  "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID" \
  > difficulty_4.mp3
```

### Option 3: Web-Based TTS (Free)
Visit these websites and download the generated audio:
- https://cloud.google.com/text-to-speech
- https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/
- https://www.naturalreaders.com/online/

## Placeholder Files

For testing purposes, placeholder files are included:
- `difficulty_4_placeholder.txt` - Text content for level 4
- `difficulty_5_placeholder.txt` - Text content for level 5

**Note:** The system will return a 404 error if actual MP3 files are not present. Make sure to generate and place the audio files before deploying to production.

## Testing

To test if audio files are correctly configured:

```bash
# Test if files exist
ls -lh public/audio/calming_messages/

# Test playback (Linux)
mpg123 public/audio/calming_messages/difficulty_4.mp3

# Test via API
curl http://localhost:3001/api/modules/a0000000-0000-0000-0000-000000000001/audio/calming_message_4
```

## Customization

Teachers can upload custom audio files through the admin interface (future feature). Until then, files must be manually placed in this directory.

## License

Audio files should be either:
1. Original recordings owned by the organization
2. Licensed from a voice actor or TTS service
3. Public domain or Creative Commons licensed

Ensure you have the appropriate rights before deploying to production.
