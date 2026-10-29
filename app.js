'use strict';

/* ------------------------------------------------------------------
   Mini Piano
   Two octaves of synthesized piano, playable with a computer keyboard
   or by tapping / clicking the keys. No samples, no dependencies.
------------------------------------------------------------------- */

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SEMITONES = 24;          // two octaves: C to B
const MIN_OCTAVE = 1;
const MAX_OCTAVE = 6;
const BLACK_NOTES = new Set([1, 3, 6, 8, 10]);

/* Computer keyboard -> semitone offset from the base C.
   Lower octave: A S D F G H J + Q W E R T
   Upper octave: K L C V B N M + Y U I O P                             */
const KEY_MAP = {
  a: 0, s: 2, d: 4, f: 5, g: 7, h: 9, j: 11,
  q: 1, w: 3, e: 6, r: 8, t: 10,
  k: 12, l: 14, c: 16, v: 17, b: 19, n: 21, m: 23,
  y: 13, u: 15, i: 18, o: 20, p: 22
};

const SEMITONE_TO_KEY = {};
for (const [key, semitone] of Object.entries(KEY_MAP)) {
  SEMITONE_TO_KEY[semitone] = key;
}

/* Songs as semitone offsets from the base C. The guide follows the octave
   controls, so every tune transposes with them. */
const SONGS = [
  {
    id: 'happy-birthday',
    title: 'Happy Birthday',
    finish: 'Happy Birthday! 🎂',
    beatMs: 550,
    phrases: [
      [7, 7, 9, 7, 12, 11],
      [7, 7, 9, 7, 14, 12],
      [7, 7, 19, 16, 12, 11, 9],
      [17, 17, 16, 12, 14, 12]
    ],
    beats: [
      0.5, 0.5, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 1, 2,
      0.5, 0.5, 1, 1, 1, 2
    ]
  },
  {
    id: 'hot-cross-buns',
    title: 'Hot Cross Buns',
    finish: 'Hot Cross Buns complete! 🎉',
    beatMs: 560,
    phrases: [
      [4, 2, 0],
      [4, 2, 0],
      [0, 0, 0, 0, 2, 2, 2, 2],
      [4, 2, 0]
    ],
    beats: [
      1, 1, 2,
      1, 1, 2,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      1, 1, 2
    ]
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    finish: 'Ode to Joy complete! 🎉',
    beatMs: 620,
    phrases: [
      [4, 4, 5, 7],
      [7, 5, 4, 2],
      [0, 0, 2, 4],
      [4, 2, 2],
      [4, 4, 5, 7],
      [7, 5, 4, 2],
      [0, 0, 2, 4],
      [2, 0, 0]
    ],
    beats: [
      1, 1, 1, 1,
      1, 1, 1, 1,
      1, 1, 1, 1,
      1, 1, 2,
      1, 1, 1, 1,
      1, 1, 1, 1,
      1, 1, 1, 1,
      1, 1, 2
    ]
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle',
    finish: 'Twinkle Twinkle complete! ⭐',
    beatMs: 580,
    phrases: [
      [0, 0, 7, 7, 9, 9, 7],
      [5, 5, 4, 4, 2, 2, 0],
      [7, 7, 5, 5, 4, 4, 2],
      [7, 7, 5, 5, 4, 4, 2],
      [0, 0, 7, 7, 9, 9, 7],
      [5, 5, 4, 4, 2, 2, 0]
    ],
    beats: [
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2,
      1, 1, 1, 1, 1, 1, 2
    ]
  }
];

SONGS.forEach((song) => {
  song.notes = song.phrases.flat();
  if (song.beats.length !== song.notes.length) {
    console.warn(`Song "${song.id}" has ${song.beats.length} beats for ${song.notes.length} notes.`);
  }
});

let currentSong = SONGS[0];

const guide = {
  active: false,
  complete: false,
  index: 0,
  timer: null,
  targetEl: null,
  loop: false,
  loopTimer: null,
  autoSustain: false
};

const isBlack = (semitone) => BLACK_NOTES.has(((semitone % 12) + 12) % 12);
const noteName = (midi) => NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);

/* ---------------------------- DOM ---------------------------- */

const dom = {
  piano: document.getElementById('piano'),
  whiteKeys: document.getElementById('whiteKeys'),
  blackKeys: document.getElementById('blackKeys'),
  octaveValue: document.getElementById('octaveValue'),
  octDown: document.getElementById('octDown'),
  octUp: document.getElementById('octUp'),
  sustainBtn: document.getElementById('sustainBtn'),
  volume: document.getElementById('volume'),
  recordBtn: document.getElementById('recordBtn'),
  recordLabel: document.getElementById('recordLabel'),
  recTimer: document.getElementById('recTimer'),
  recHint: document.getElementById('recHint'),
  take: document.getElementById('take'),
  takeInfo: document.getElementById('takeInfo'),
  downloadBtn: document.getElementById('downloadBtn'),
  learnBtn: document.getElementById('learnBtn'),
  guide: document.getElementById('guide'),
  guideProgress: document.getElementById('guideProgress'),
  guideStrip: document.getElementById('guideStrip'),
  guideNext: document.getElementById('guideNext'),
  guideClose: document.getElementById('guideClose'),
  guideAgain: document.getElementById('guideAgain'),
  guideLoop: document.getElementById('guideLoop'),
  guideHint: document.getElementById('guideHint'),
  songSelect: document.getElementById('songSelect')
};

/* --------------------------- State --------------------------- */

let baseOctave = 4;
let sustainOn = false;

const keyEls = new Map();        // semitone offset -> element
const sources = new Map();       // input id -> { offset, el, voice }
const pedalVoices = new Set();   // voices ringing because of sustain

/* --------------------------- Keybed --------------------------- */

function buildKeyboard() {
  const whiteCount = Array.from({ length: SEMITONES }, (_, i) => i).filter((s) => !isBlack(s)).length;
  dom.piano.style.setProperty('--white-count', String(whiteCount));
  dom.whiteKeys.textContent = '';
  dom.blackKeys.textContent = '';

  for (let semitone = 0; semitone < SEMITONES; semitone++) {
    const el = document.createElement('div');
    el.className = `key ${isBlack(semitone) ? 'black' : 'white'}`;
    el.dataset.offset = String(semitone);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '-1');

    const hint = document.createElement('span');
    hint.className = 'key-hint';
    hint.textContent = (SEMITONE_TO_KEY[semitone] || '').toUpperCase();

    const name = document.createElement('span');
    name.className = 'note-name';

    el.append(hint, name);
    bindPointer(el, semitone);

    keyEls.set(semitone, el);

    if (isBlack(semitone)) {
      const whitesBefore = Array.from({ length: semitone }, (_, i) => i).filter((s) => !isBlack(s)).length;
      el.style.left = `${(whitesBefore / whiteCount) * 100}%`;
      dom.blackKeys.append(el);
    } else {
      dom.whiteKeys.append(el);
    }
  }

  updateLabels();
}

function updateLabels() {
  const baseMidi = 12 * (baseOctave + 1);

  keyEls.forEach((el, semitone) => {
    const name = el.querySelector('.note-name');
    name.textContent = noteName(baseMidi + semitone);
    el.dataset.midi = String(baseMidi + semitone);
    el.setAttribute('aria-label', `Play ${noteName(baseMidi + semitone)}`);
  });

  dom.octaveValue.textContent = `C${baseOctave}`;
  dom.octDown.disabled = baseOctave <= MIN_OCTAVE;
  dom.octUp.disabled = baseOctave >= MAX_OCTAVE;

  if (guide.active) renderGuide();
}

/* --------------------------- Audio --------------------------- */

let ctx = null;
let bus = null;
let master = null;
let compressor = null;
let hammerBuffer = null;

const PARTIALS = [
  { ratio: 1, gain: 0.16, decay: 3.4, type: 'triangle' },
  { ratio: 2.002, gain: 0.07, decay: 2.2, type: 'sine' },
  { ratio: 3.003, gain: 0.038, decay: 1.5, type: 'sine' },
  { ratio: 4.005, gain: 0.022, decay: 1.1, type: 'sine' },
  { ratio: 5.008, gain: 0.013, decay: 0.8, type: 'sine' },
  { ratio: 6.012, gain: 0.008, decay: 0.6, type: 'sine' },
  { ratio: 8.02, gain: 0.004, decay: 0.45, type: 'sine' }
];

function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  ctx = new AudioCtx();

  compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 24;
  compressor.ratio.value = 6;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.22;

  master = ctx.createGain();
  master.gain.value = (Number(dom.volume.value) / 100) * 0.9;

  bus = ctx.createGain();
  bus.connect(compressor);
  compressor.connect(master);
  master.connect(ctx.destination);

  // Small synthetic room so notes do not feel dry.
  const convolver = ctx.createConvolver();
  convolver.buffer = makeImpulse(1.7, 2.8);
  const damp = ctx.createBiquadFilter();
  damp.type = 'lowpass';
  damp.frequency.value = 3200;
  const wet = ctx.createGain();
  wet.gain.value = 0.18;
  bus.connect(convolver);
  convolver.connect(damp);
  damp.connect(wet);
  wet.connect(compressor);

  hammerBuffer = makeNoise(0.12);
}

function makeImpulse(seconds, decay) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = ctx.createBuffer(2, length, rate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return buffer;
}

function makeNoise(seconds) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function playNote(midi) {
  initAudio();
  if (!ctx) return null;
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  const detune = (Math.random() - 0.5) * 2.5; // tiny per-note drift, in cents

  const out = ctx.createGain();
  out.gain.value = 1;

  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = Math.min(14000, Math.max(1400, freq * 9));
  tone.Q.value = 0.4;

  out.connect(tone);
  tone.connect(bus);

  const oscillators = [];

  for (const partial of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.type = partial.type;
    osc.frequency.value = freq * partial.ratio;
    osc.detune.value = detune;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(partial.gain, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + partial.decay);

    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + partial.decay + 0.2);
    oscillators.push(osc);
  }

  // A whisper of noise at the attack reads as a hammer strike.
  if (hammerBuffer) {
    const hammer = ctx.createBufferSource();
    hammer.buffer = hammerBuffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = Math.min(5200, 900 + freq * 2.2);
    band.Q.value = 1.1;

    const hammerGain = ctx.createGain();
    hammerGain.gain.setValueAtTime(0.045, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    hammer.connect(band);
    band.connect(hammerGain);
    hammerGain.connect(out);
    hammer.start(now);
    hammer.stop(now + 0.08);
  }

  return { midi, out, oscillators, stopped: false };
}

function stopNote(voice) {
  if (!voice || voice.stopped || !ctx) return;
  voice.stopped = true;

  const now = ctx.currentTime;
  const gain = voice.out.gain;

  if (typeof gain.cancelAndHoldAtTime === 'function') {
    gain.cancelAndHoldAtTime(now);
  } else {
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
  }

  gain.linearRampToValueAtTime(0, now + 0.18);

  for (const osc of voice.oscillators) {
    try {
      osc.stop(now + 0.24);
    } catch (err) {
      /* already stopped */
    }
  }
}

/* ------------------------- Recording ------------------------- */

const MAX_RECORD_SECONDS = 600;

const rec = {
  active: false,
  busy: false,
  processor: null,
  sink: null,
  chunks: [],
  frames: 0,
  timer: null
};

let take = null; // { url, duration, bytes }

function startRecording() {
  if (rec.active || rec.busy) return;

  initAudio();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();

  // Tap the compressed mix (before the volume control) so the recording
  // level is consistent no matter how loud the speakers are set.
  // ScriptProcessorNode is deprecated, but it works from file:// and in every
  // current browser, which keeps this a single-file, zero-setup app.
  const processor = ctx.createScriptProcessor(4096, 2, 2);
  const sink = ctx.createGain();
  sink.gain.value = 0; // keep the branch silent; it only exists to drive the node

  processor.onaudioprocess = (event) => {
    if (!rec.active) return;
    const left = new Float32Array(event.inputBuffer.getChannelData(0));
    const right = new Float32Array(event.inputBuffer.getChannelData(1));
    rec.chunks.push([left, right]);
    rec.frames += left.length;
  };

  compressor.connect(processor);
  processor.connect(sink);
  sink.connect(ctx.destination);

  rec.active = true;
  rec.processor = processor;
  rec.sink = sink;
  rec.chunks = [];
  rec.frames = 0;
  rec.timer = setInterval(updateRecordingTime, 200);

  renderRecorder();
}

function stopRecording() {
  if (!rec.active) return;

  rec.active = false;

  if (rec.timer) {
    clearInterval(rec.timer);
    rec.timer = null;
  }

  if (rec.processor) {
    rec.processor.onaudioprocess = null;
    try {
      compressor.disconnect(rec.processor);
    } catch (err) {
      /* already disconnected */
    }
    try {
      rec.processor.disconnect();
    } catch (err) {
      /* already disconnected */
    }
  }

  if (rec.sink) {
    try {
      rec.sink.disconnect();
    } catch (err) {
      /* already disconnected */
    }
  }

  const chunks = rec.chunks;
  const frames = rec.frames;

  rec.processor = null;
  rec.sink = null;
  rec.chunks = [];
  rec.frames = 0;

  if (frames === 0) {
    renderRecorder();
    return;
  }

  // Let the button paint "Saving…" before the WAV encode blocks the thread.
  rec.busy = true;
  renderRecorder();

  setTimeout(() => {
    try {
      const blob = encodeWav(chunks, ctx.sampleRate);

      if (take) URL.revokeObjectURL(take.url);

      take = {
        url: URL.createObjectURL(blob),
        duration: frames / ctx.sampleRate,
        bytes: blob.size
      };

      dom.downloadBtn.href = take.url;
      dom.downloadBtn.download = `mini-piano-${timestamp()}.wav`;
      dom.takeInfo.textContent = `${formatClock(Math.ceil(take.duration))} · ${formatBytes(take.bytes)}`;
    } finally {
      rec.busy = false;
      renderRecorder();
    }
  }, 30);
}

function renderRecorder() {
  dom.recordBtn.classList.toggle('on', rec.active);
  dom.recordBtn.setAttribute('aria-pressed', String(rec.active));
  dom.recordBtn.disabled = rec.busy;

  dom.recordLabel.textContent = rec.busy ? 'Saving…' : rec.active ? 'Stop' : 'Record';
  dom.recTimer.hidden = !rec.active;
  dom.recHint.hidden = rec.active || rec.busy || Boolean(take);
  dom.take.hidden = rec.active || rec.busy || !take;

  if (rec.active) updateRecordingTime();
}

function updateRecordingTime() {
  if (!rec.active || !ctx) return;

  const seconds = rec.frames / ctx.sampleRate;
  dom.recTimer.textContent = formatClock(seconds);

  if (seconds >= MAX_RECORD_SECONDS) stopRecording();
}

function encodeWav(chunks, sampleRate) {
  let frames = 0;
  let peak = 0;

  for (const [left, right] of chunks) {
    frames += left.length;
    for (let i = 0; i < left.length; i++) {
      const l = Math.abs(left[i]);
      const r = Math.abs(right[i]);
      if (l > peak) peak = l;
      if (r > peak) peak = r;
    }
  }

  // Bring the take up to a healthy level without letting dense chords clip.
  const scale = peak > 0 ? Math.min(4, 0.89 / peak) : 1;

  const buffer = new ArrayBuffer(44 + frames * 4);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + frames * 4, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 2, true); // stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true); // byte rate
  view.setUint16(32, 4, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, 'data');
  view.setUint32(40, frames * 4, true);

  let offset = 44;
  for (const [left, right] of chunks) {
    for (let i = 0; i < left.length; i++) {
      const l = Math.max(-1, Math.min(1, left[i] * scale));
      const r = Math.max(-1, Math.min(1, right[i] * scale));
      view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
      view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
      offset += 4;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

function formatClock(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/* --------------------------- Playing --------------------------- */

function press(id, offset, el) {
  const existing = sources.get(id);
  if (existing) {
    if (existing.offset === offset) return;
    release(id);
  }

  const midi = 12 * (baseOctave + 1) + offset;
  const voice = playNote(midi);
  if (!voice) return;

  sources.set(id, { offset, midi, el, voice });
  el.classList.add('active');

  handleGuideNote(offset);
}

function release(id) {
  const source = sources.get(id);
  if (!source) return;

  sources.delete(id);
  source.el.classList.remove('active');

  if (sustainOn) {
    pedalVoices.add(source.voice);
  } else {
    stopNote(source.voice);
  }
}

function releaseAll() {
  for (const source of sources.values()) {
    source.el.classList.remove('active');
    stopNote(source.voice);
  }
  sources.clear();

  for (const voice of pedalVoices) stopNote(voice);
  pedalVoices.clear();

  setSustain(false);
}

function setSustain(on) {
  if (sustainOn === on) return;
  sustainOn = on;

  dom.sustainBtn.classList.toggle('on', on);
  dom.sustainBtn.setAttribute('aria-pressed', String(on));

  if (!on) {
    for (const voice of pedalVoices) stopNote(voice);
    pedalVoices.clear();
  }
}

function shiftOctave(direction) {
  const next = Math.min(MAX_OCTAVE, Math.max(MIN_OCTAVE, baseOctave + direction));
  if (next === baseOctave) return;
  baseOctave = next;
  updateLabels();
}

/* ------------------------- Guided song ------------------------- */

function startGuide() {
  guide.active = true;
  guide.complete = false;
  guide.index = 0;

  if (guide.timer) clearTimeout(guide.timer);
  guide.timer = null;

  if (guide.loopTimer) clearTimeout(guide.loopTimer);
  guide.loopTimer = null;

  // Learning sounds better with the pedal down. Restore the previous
  // sustain state when the guide is closed.
  guide.autoSustain = !sustainOn;
  if (guide.autoSustain) setSustain(true);

  dom.learnBtn.hidden = true;
  dom.guide.hidden = false;
  dom.guideNext.classList.remove('wrong');
  document.body.classList.add('guide-open');

  renderGuide();
}

function stopGuide() {
  guide.active = false;
  guide.complete = false;

  if (guide.timer) clearTimeout(guide.timer);
  guide.timer = null;

  if (guide.loopTimer) clearTimeout(guide.loopTimer);
  guide.loopTimer = null;

  if (guide.autoSustain) {
    setSustain(false);
    guide.autoSustain = false;
  }

  if (guide.targetEl) {
    guide.targetEl.classList.remove('target');
    guide.targetEl = null;
  }

  dom.guide.hidden = true;
  dom.learnBtn.hidden = false;
  dom.guideNext.classList.remove('wrong');
  dom.guide.classList.remove('complete');
  document.body.classList.remove('guide-open');
}

function restartGuide() {
  if (!guide.active) return;

  guide.complete = false;
  guide.index = 0;

  if (guide.timer) clearTimeout(guide.timer);
  guide.timer = null;

  if (guide.loopTimer) clearTimeout(guide.loopTimer);
  guide.loopTimer = null;

  dom.guideNext.classList.remove('wrong');
  renderGuide();
}

function toggleGuideLoop() {
  guide.loop = !guide.loop;
  dom.guideLoop.setAttribute('aria-pressed', String(guide.loop));

  if (!guide.loop) {
    if (guide.loopTimer) clearTimeout(guide.loopTimer);
    guide.loopTimer = null;
    if (guide.active && guide.complete) renderGuide();
    return;
  }

  // If the song was already finished, start the next pass right away.
  if (guide.active && guide.complete) restartGuide();
}

function selectSong(id) {
  const next = SONGS.find((song) => song.id === id);
  if (!next) return;

  currentSong = next;
  guide.index = 0;
  guide.complete = false;

  if (guide.timer) clearTimeout(guide.timer);
  guide.timer = null;

  if (guide.loopTimer) clearTimeout(guide.loopTimer);
  guide.loopTimer = null;

  dom.guideNext.classList.remove('wrong');
  dom.songSelect.blur();
  renderGuide();
}

function buildSongPicker() {
  dom.songSelect.textContent = '';

  for (const song of SONGS) {
    const option = document.createElement('option');
    option.value = song.id;
    option.textContent = song.title;
    dom.songSelect.append(option);
  }

  dom.songSelect.value = currentSong.id;
}

function scheduleGuideLoop() {
  if (guide.loopTimer) {
    clearTimeout(guide.loopTimer);
    guide.loopTimer = null;
  }

  if (!guide.loop) return;

  guide.loopTimer = setTimeout(() => {
    guide.loopTimer = null;
    if (!guide.active || !guide.complete || !guide.loop) return;
    restartGuide();
  }, 1400);
}

function renderGuide() {
  if (!guide.active) return;

  const baseMidi = 12 * (baseOctave + 1);
  const total = currentSong.notes.length;

  // The bar on the next chip fills for the length of the note just played,
  // so following it produces the song's relative rhythm. The first note gets
  // a two-beat lead-in.
  const previousIndex = guide.index - 1;
  const rhythmBeats = previousIndex >= 0 ? (currentSong.beats[previousIndex] || 1) : 2;
  const timingMs = Math.max(220, Math.round(rhythmBeats * (currentSong.beatMs || 600)));

  dom.songSelect.value = currentSong.id;
  dom.guideProgress.textContent = `${guide.index} / ${total}`;
  dom.guideStrip.textContent = '';

  let noteIndex = 0;

  for (const phrase of currentSong.phrases) {
    for (let phraseIndex = 0; phraseIndex < phrase.length; phraseIndex++) {
      const offset = phrase[phraseIndex];
      const chip = document.createElement('span');
      const isDone = noteIndex < guide.index || guide.complete;
      const isCurrent = !isDone && noteIndex === guide.index;
      const phraseStart = phraseIndex === 0 && noteIndex > 0 ? ' phrase-start' : '';
      const state = isDone ? ' done' : isCurrent ? ' current' : '';

      chip.className = `chip${state}${phraseStart}`;

      const key = document.createElement('span');
      key.textContent = (SEMITONE_TO_KEY[offset] || '?').toUpperCase();

      const note = document.createElement('small');
      note.textContent = noteName(baseMidi + offset);

      chip.append(key, note);

      if (isCurrent) {
        const timing = document.createElement('span');
        timing.className = 'chip-timing';

        const fill = document.createElement('span');
        fill.className = 'chip-timing-fill';
        fill.style.animationDuration = `${timingMs}ms`;
        fill.addEventListener('animationend', () => {
          if (chip.isConnected) chip.classList.add('ready');
        });

        timing.append(fill);
        chip.append(timing);
      }

      dom.guideStrip.append(chip);
      noteIndex++;
    }
  }

  dom.guide.classList.toggle('complete', guide.complete);
  dom.guideLoop.setAttribute('aria-pressed', String(guide.loop));

  updateGuidePrompt();
  markGuideTarget();
}

function updateGuidePrompt() {
  if (!guide.active) return;

  const baseMidi = 12 * (baseOctave + 1);

  if (guide.complete) {
    dom.guideAgain.hidden = guide.loop;
    dom.guideHint.hidden = true;
    dom.guideNext.textContent = guide.loop
      ? `${currentSong.finish} Again in a moment…`
      : currentSong.finish;
  } else {
    dom.guideAgain.hidden = true;
    dom.guideHint.hidden = false;
    const expected = currentSong.notes[guide.index];
    const key = (SEMITONE_TO_KEY[expected] || '?').toUpperCase();
    dom.guideNext.innerHTML = `Next: press <kbd>${key}</kbd> <span>${noteName(baseMidi + expected)}</span>`;
  }
}

function markGuideTarget() {
  if (guide.targetEl) {
    guide.targetEl.classList.remove('target');
    guide.targetEl = null;
  }

  if (!guide.active || guide.complete) return;

  const el = keyEls.get(currentSong.notes[guide.index]);
  if (!el) return;

  el.classList.add('target');
  guide.targetEl = el;
}

function pulseGuideChip(index) {
  const chip = dom.guideStrip.children[index];
  if (!chip) return;

  chip.classList.add('hit');
  setTimeout(() => chip.classList.remove('hit'), 380);
}

function handleGuideNote(offset) {
  if (!guide.active || guide.complete) return;

  if (offset === currentSong.notes[guide.index]) {
    if (guide.timer) clearTimeout(guide.timer);
    guide.timer = null;

    const completedIndex = guide.index;
    guide.index++;

    if (guide.index >= currentSong.notes.length) {
      guide.complete = true;

      if (guide.timer) clearTimeout(guide.timer);
      guide.timer = null;

      dom.guideNext.classList.remove('wrong');
      renderGuide();
      pulseGuideChip(completedIndex);
      scheduleGuideLoop();
      return;
    }

    dom.guideNext.classList.remove('wrong');
    renderGuide();
    pulseGuideChip(completedIndex);
    return;
  }

  promptGuideMiss(offset);
}

function promptGuideMiss(offset) {
  const baseMidi = 12 * (baseOctave + 1);
  const expected = currentSong.notes[guide.index];
  const key = (SEMITONE_TO_KEY[expected] || '?').toUpperCase();

  if (guide.timer) clearTimeout(guide.timer);

  dom.guideNext.classList.remove('wrong');
  void dom.guideNext.offsetWidth;
  dom.guideNext.classList.add('wrong');
  dom.guideNext.innerHTML =
    `Heard ${noteName(baseMidi + offset)} &mdash; press <kbd>${key}</kbd> <span>${noteName(baseMidi + expected)}</span>`;

  guide.timer = setTimeout(() => {
    guide.timer = null;
    if (!guide.active || guide.complete) return;
    dom.guideNext.classList.remove('wrong');
    updateGuidePrompt();
  }, 1500);
}

/* --------------------------- Input --------------------------- */

function bindPointer(el, offset) {
  el.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (el.setPointerCapture) {
      try {
        el.setPointerCapture(event.pointerId);
      } catch (err) {
        /* ignore */
      }
    }
    press(`p:${event.pointerId}`, offset, el);
  });

  const end = (event) => release(`p:${event.pointerId}`);
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;

  const tag = event.target && event.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  if (event.code === 'Space') {
    event.preventDefault();
    setSustain(true);
    return;
  }

  const key = event.key.toLowerCase();

  if (key === 'escape' && guide.active) {
    stopGuide();
    return;
  }

  if (key === 'arrowleft') {
    event.preventDefault();
    shiftOctave(-1);
    return;
  }

  if (key === 'arrowright') {
    event.preventDefault();
    shiftOctave(1);
    return;
  }

  if (Object.prototype.hasOwnProperty.call(KEY_MAP, key)) {
    event.preventDefault();
    const offset = KEY_MAP[key];
    const el = keyEls.get(offset);
    if (el) press(`k:${key}`, offset, el);
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    setSustain(false);
    return;
  }

  const key = event.key.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(KEY_MAP, key)) release(`k:${key}`);
});

window.addEventListener('blur', releaseAll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) releaseAll();
});

/* --------------------------- Controls --------------------------- */

dom.octDown.addEventListener('click', () => shiftOctave(-1));
dom.octUp.addEventListener('click', () => shiftOctave(1));

dom.sustainBtn.addEventListener('click', () => setSustain(!sustainOn));

dom.learnBtn.addEventListener('click', startGuide);
dom.guideClose.addEventListener('click', stopGuide);
dom.guideAgain.addEventListener('click', restartGuide);
dom.guideLoop.addEventListener('click', toggleGuideLoop);
dom.songSelect.addEventListener('change', () => selectSong(dom.songSelect.value));

dom.recordBtn.addEventListener('click', () => {
  if (rec.active) stopRecording();
  else startRecording();
});

dom.volume.addEventListener('input', () => {
  const value = (Number(dom.volume.value) / 100) * 0.9;
  if (master && ctx) master.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
});

/* --------------------------- Start --------------------------- */

buildKeyboard();
buildSongPicker();
