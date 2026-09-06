/* 到账音效：耳聆网「支付宝到账金币掉落收钱音」CC-BY，署名 L488386791。https://www.ear0.com/sound/show/soundid-35919 */
(function (global) {
  'use strict';

  /* 原 mp3 前约 195ms 为完全静音；从攻击点前回放，避免「掉落已经发生、金币才响」。 */
  const TRIM = 0.192;
  const OUTPUT_LEAD = 0.03;

  const AudioApi = {
    ctx: null,
    masterGain: null,
    buffer: null,
    loading: null,
    clip: null,
    primed: false,
    scheduled: null,

    src() {
      try {
        if (global.chrome && chrome.runtime && chrome.runtime.getURL) {
          return chrome.runtime.getURL('assets/sounds/coin-drop.mp3');
        }
      } catch (e) {}
      return '../assets/sounds/coin-drop.mp3';
    },

    ensureClip() {
      if (this.clip) return this.clip;
      this.clip = new Audio(this.src());
      this.clip.preload = 'auto';
      this.clip.volume = 0.9;
      return this.clip;
    },

    unlock() {
      try {
        const AC = global.AudioContext || global.webkitAudioContext;
        if (!this.ctx && AC) {
          this.ctx = new AC();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 1;
          this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      } catch (e) {}
      this.primeElement();
      this.warm();
    },

    primeElement() {
      const clip = this.ensureClip();
      if (this.primed) return;
      try {
        clip.muted = true;
        const play = clip.play();
        if (play && play.then) {
          play.then(() => {
            clip.pause();
            clip.currentTime = TRIM;
            clip.muted = false;
            this.primed = true;
          }).catch(() => {});
        }
      } catch (e) {}
    },

    warm() {
      if (this.buffer || this.loading) return this.loading;
      const url = this.src();
      this.loading = fetch(url).then((res) => {
        if (!res.ok) throw new Error('sound missing');
        return res.arrayBuffer();
      }).then((raw) => {
        if (!this.ctx) {
          const AC = global.AudioContext || global.webkitAudioContext;
          if (!AC) throw new Error('no audio context');
          this.ctx = new AC();
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = 1;
          this.masterGain.connect(this.ctx.destination);
        }
        return this.ctx.decodeAudioData(raw.slice(0));
      }).then((decoded) => {
        this.buffer = decoded;
        return decoded;
      }).catch(() => {
        this.buffer = null;
      }).finally(() => {
        this.loading = null;
      });
      return this.loading;
    },

    trimStart() {
      if (!this.buffer) return TRIM;
      return Math.min(TRIM, Math.max(0, this.buffer.duration - 0.05));
    },

    playBuffer(delaySec) {
      if (!this.ctx || this.ctx.state !== 'running' || !this.buffer || !this.masterGain) return false;
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = this.buffer;
        src.connect(this.masterGain);
        const wait = Math.max(0, (delaySec || 0) - OUTPUT_LEAD);
        src.start(this.ctx.currentTime + wait, this.trimStart());
        return true;
      } catch (e) {
        return false;
      }
    },

    playElement() {
      try {
        const clip = this.ensureClip();
        clip.muted = false;
        clip.volume = 0.9;
        clip.pause();
        try { clip.currentTime = TRIM; } catch (e) {}
        const play = clip.play();
        if (play && play.catch) {
          play.catch(() => {
            const fresh = new Audio(this.src());
            fresh.volume = 0.9;
            const start = () => {
              try { fresh.currentTime = TRIM; } catch (e) {}
              fresh.play().catch(() => this.synthDrop());
            };
            if (fresh.readyState >= 1) start();
            else fresh.addEventListener('loadedmetadata', start, { once: true });
          });
        }
        return true;
      } catch (e) {
        return false;
      }
    },

    strike(from, to, offset, duration, volume, type) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      const at = this.ctx.currentTime + offset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = (from + to) / 2;
      filter.Q.value = 5;
      osc.type = type || 'triangle';
      osc.frequency.setValueAtTime(from, at);
      osc.frequency.exponentialRampToValueAtTime(to, at + duration);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(volume, at + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      osc.connect(filter).connect(gain).connect(this.masterGain);
      osc.start(at);
      osc.stop(at + duration + 0.02);
    },

    synthDrop() {
      if (!this.ctx) this.unlock();
      if (!this.ctx || this.ctx.state !== 'running') return;
      this.strike(2093, 1047, 0, 0.18, 0.12, 'triangle');
      this.strike(1568, 784, 0.05, 0.24, 0.1, 'sine');
      this.strike(1245, 622, 0.1, 0.28, 0.09, 'triangle');
      this.strike(784, 392, 0.17, 0.45, 0.06, 'sine');
    },

    cancelScheduled() {
      if (this.scheduled) {
        global.clearTimeout(this.scheduled);
        this.scheduled = null;
      }
    },

    /* delayMs：从现在起预约播放。有解码缓冲时走 AudioContext 时钟，避免「动画等到点才开始加载」。 */
    coinDrop(delayMs) {
      this.unlock();
      this.cancelScheduled();
      const now = () => (global.performance && performance.now) ? performance.now() : Date.now();
      const delaySec = Math.max(0, (Number(delayMs) || 0) / 1000);
      const deadline = now() + delaySec * 1000;
      const remainSec = () => (deadline - now()) / 1000;

      const tryBuffer = () => this.playBuffer(Math.max(0, remainSec()));
      const armFallback = () => {
        this.cancelScheduled();
        this.scheduled = global.setTimeout(() => {
          this.scheduled = null;
          if (this.playBuffer(0)) return;
          if (this.playElement()) return;
          this.synthDrop();
        }, Math.max(0, deadline - OUTPUT_LEAD * 1000 - now()));
      };

      const afterReady = () => {
        if (tryBuffer()) {
          this.cancelScheduled();
          return;
        }
        armFallback();
      };

      if (this.ctx && this.ctx.state === 'suspended') {
        armFallback();
        this.ctx.resume().then(afterReady).catch(afterReady);
        return;
      }
      if (this.buffer) {
        afterReady();
        return;
      }
      armFallback();
      const pending = this.warm();
      if (pending && pending.then) pending.then(afterReady);
    },

    coin() {
      this.unlock();
      if (!this.ctx) return;
      const ring = () => {
        this.strike(1319, 988, 0, 0.15, 0.08, 'sine');
        this.strike(1047, 880, 0.08, 0.12, 0.06, 'triangle');
      };
      if (this.ctx.state === 'suspended') this.ctx.resume().then(ring).catch(ring);
      else ring();
    }
  };

  AudioApi.tone = function (freq, offset, duration, volume) {
    AudioApi.unlock();
    if (!AudioApi.ctx) return;
    AudioApi.strike(freq, freq, offset, duration, volume);
  };

  global.QJAudio = AudioApi;
})(typeof globalThis !== 'undefined' ? globalThis : this);
