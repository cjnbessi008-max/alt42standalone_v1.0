/**
 * Scale Sound Audio Service
 * 닮음 배율에 따라 음높이가 변하는 사운드를 생성합니다.
 * Web Audio API를 사용합니다.
 */

export class AudioService {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentOscillator: OscillatorNode | null = null;

  constructor() {
    this.initAudioContext();
  }

  /**
   * AudioContext 초기화
   */
  private initAudioContext(): void {
    try {
      // @ts-ignore - webkit 브라우저 호환성
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0.3; // 볼륨 30%
    } catch (error) {
      console.error('Web Audio API 초기화 실패:', error);
    }
  }

  /**
   * 배율을 주파수로 변환
   * @param scale 닮음 배율 (0.5 ~ 3.0)
   * @param minScale 최소 배율 (기본값: 0.5)
   * @param maxScale 최대 배율 (기본값: 3.0)
   * @returns 주파수 (Hz)
   */
  private scaleToFrequency(
    scale: number,
    minScale: number = 0.5,
    maxScale: number = 3.0
  ): number {
    const baseFreq = 440; // A4 (라)

    // 배율을 0~1 범위로 정규화
    const normalizedScale = (scale - minScale) / (maxScale - minScale);

    // 로그 스케일로 주파수 계산
    // 0.5x → C4 (261.63 Hz, -12 semitones)
    // 1.0x → A4 (440.00 Hz, 0 semitones)
    // 2.0x → A5 (880.00 Hz, +12 semitones)
    // 3.0x → C#6 (1108.73 Hz, +16 semitones)

    const minSemitones = -12; // 0.5x에서의 반음 차이
    const maxSemitones = 16;  // 3.0x에서의 반음 차이

    const semitones = minSemitones + normalizedScale * (maxSemitones - minSemitones);

    // 주파수 계산: f = f0 * 2^(n/12)
    const frequency = baseFreq * Math.pow(2, semitones / 12);

    return frequency;
  }

  /**
   * 음계 이름 가져오기
   * @param scale 닮음 배율
   * @returns 음계 이름 (예: "A4", "C5")
   */
  public getNoteName(scale: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const frequency = this.scaleToFrequency(scale);

    // 주파수를 MIDI 노트 번호로 변환
    const midiNote = 12 * Math.log2(frequency / 440) + 69;
    const noteIndex = Math.round(midiNote) % 12;
    const octave = Math.floor(Math.round(midiNote) / 12) - 1;

    return `${notes[noteIndex]}${octave}`;
  }

  /**
   * Scale Sound 재생
   * @param scale 닮음 배율
   * @param duration 재생 시간 (초, 기본값: 0.3)
   * @param waveType 파형 타입 (기본값: 'sine')
   */
  public playScaleSound(
    scale: number,
    duration: number = 0.3,
    waveType: OscillatorType = 'sine'
  ): void {
    if (!this.audioContext || !this.gainNode) {
      console.warn('AudioContext가 초기화되지 않았습니다.');
      return;
    }

    // 이전 사운드 중지
    this.stopSound();

    // 주파수 계산
    const frequency = this.scaleToFrequency(scale);

    // Oscillator 생성
    this.currentOscillator = this.audioContext.createOscillator();
    this.currentOscillator.type = waveType;
    this.currentOscillator.frequency.value = frequency;

    // GainNode 연결
    this.currentOscillator.connect(this.gainNode);

    // 페이드 인/아웃 효과
    const now = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05); // 페이드 인
    this.gainNode.gain.linearRampToValueAtTime(0, now + duration); // 페이드 아웃

    // 재생 시작
    this.currentOscillator.start(now);
    this.currentOscillator.stop(now + duration);

    // 재생 완료 후 정리
    this.currentOscillator.onended = () => {
      this.currentOscillator = null;
    };
  }

  /**
   * 현재 재생 중인 사운드 중지
   */
  public stopSound(): void {
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop();
        this.currentOscillator.disconnect();
      } catch (error) {
        // 이미 중지된 경우 무시
      }
      this.currentOscillator = null;
    }
  }

  /**
   * 볼륨 설정
   * @param volume 볼륨 (0.0 ~ 1.0)
   */
  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * AudioContext 재개 (브라우저 autoplay 정책 대응)
   */
  public async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.stopSound();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.gainNode = null;
  }
}

// 싱글톤 인스턴스
export const audioService = new AudioService();
