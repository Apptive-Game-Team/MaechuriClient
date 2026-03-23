let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

let lastWalkSoundTime = 0;
const WALK_SOUND_MIN_INTERVAL_MS = 300;
const MODAL_SOUND_DURATION_SEC = 0.45;
const WIND_NOTIFICATION_DURATION_SEC = 0.55;

/** Short footstep tap — plays at most once per 300 ms to match walking cadence */
export function playWalkSound(): void {
  const now = Date.now();
  if (now - lastWalkSoundTime < WALK_SOUND_MIN_INTERVAL_MS) return;
  lastWalkSoundTime = now;

  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * 0.05); // 50 ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 350;
  filter.Q.value = 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

/** Heavy desk-thud — used for modal open and close */
export function playModalSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const duration = MODAL_SOUND_DURATION_SEC;

  // Low-frequency body resonance sweep
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + duration);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);

  // Short impact noise burst
  const noiseSize = Math.floor(ctx.sampleRate * 0.12);
  const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseSize; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseSize * 0.1));
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.value = 280;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.55, ctx.currentTime);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSource.start();
}

/** Wind-like notification for a sent message */
export function playMessageSentSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playWindNotification(ctx, 1400, 0.12);
}

/** Wind-like notification for a received message */
export function playMessageReceivedSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  playWindNotification(ctx, 950, 0.18);
}

function playWindNotification(ctx: AudioContext, centerFreq: number, peakTime: number): void {
  const duration = WIND_NOTIFICATION_DURATION_SEC;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = centerFreq;
  filter.Q.value = 4;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + peakTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}
