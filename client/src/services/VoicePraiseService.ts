/**
 * VoicePraiseService
 * Handles Text-to-Speech using Web Speech API
 */

interface VoiceConfig {
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface PraiseEvent {
  id: string;
  message: string;
  voiceConfig: VoiceConfig;
  timestamp: string;
  type: string;
}

class VoicePraiseService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isEnabled: boolean = true;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Load voices when they change (some browsers load async)
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    console.log(`🗣️ Loaded ${this.voices.length} voices`);
  }

  /**
   * Speak praise message with configured voice
   */
  speak(praiseEvent: PraiseEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isEnabled) {
        console.log('Voice praise is disabled');
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(praiseEvent.message);
      const { voiceConfig } = praiseEvent;

      // Configure voice settings
      utterance.lang = voiceConfig.lang || 'ko-KR';
      utterance.rate = voiceConfig.rate || 0.9;
      utterance.pitch = voiceConfig.pitch || 1.1;
      utterance.volume = voiceConfig.volume || 1.0;

      // Try to find a matching voice
      const matchingVoice = this.voices.find(
        voice => voice.lang === utterance.lang
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => {
        console.log(`✅ Praise spoken: "${praiseEvent.message}"`);
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        reject(error);
      };

      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop(): void {
    this.synth.cancel();
  }

  /**
   * Enable/disable voice praise
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if voice praise is enabled
   */
  isVoiceEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get available voices for a language
   */
  getVoicesForLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(lang));
  }

  /**
   * Test voice with a sample message
   */
  testVoice(message: string = '안녕하세요! 잘했어요!', config?: VoiceConfig): void {
    const testEvent: PraiseEvent = {
      id: 'test',
      message,
      voiceConfig: config || {
        lang: 'ko-KR',
        rate: 0.9,
        pitch: 1.1,
        volume: 1.0
      },
      timestamp: new Date().toISOString(),
      type: 'test'
    };
    this.speak(testEvent);
  }
}

export default new VoicePraiseService();
export type { PraiseEvent, VoiceConfig };
