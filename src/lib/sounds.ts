// Lightweight futuristic UI click sounds via WebAudio (no asset downloads).
let ctx: AudioContext | null = null;
let enabled = true;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
};

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
};
export const isSoundEnabled = () => enabled;

type Tone = { freq: number; type?: OscillatorType; dur?: number; gain?: number; slideTo?: number };

const playTones = (tones: Tone[]) => {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  let t = now;
  tones.forEach(({ freq, type = "square", dur = 0.06, gain = 0.04, slideTo }) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    t += dur * 0.6;
  });
};

export const sfx = {
  click: () => playTones([{ freq: 880, type: "square", dur: 0.05, gain: 0.035, slideTo: 1320 }]),
  toggle: () => playTones([{ freq: 660, type: "triangle", dur: 0.05, gain: 0.04, slideTo: 990 }]),
  tick: () => playTones([{ freq: 1200, type: "sine", dur: 0.015, gain: 0.02 }]),
  open: () => playTones([
    { freq: 520, type: "sine", dur: 0.07, gain: 0.05, slideTo: 880 },
    { freq: 1040, type: "sine", dur: 0.08, gain: 0.04, slideTo: 1480 },
  ]),
  close: () => playTones([
    { freq: 880, type: "sine", dur: 0.07, gain: 0.04, slideTo: 440 },
  ]),
  launch: () => playTones([
    { freq: 220, type: "sawtooth", dur: 0.09, gain: 0.05, slideTo: 880 },
    { freq: 880, type: "square", dur: 0.08, gain: 0.04, slideTo: 1760 },
  ]),
};

// Global delegated click sound for any <button> not opting out.
let installed = false;
export const installGlobalClickSounds = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const handler = (e: MouseEvent) => {
    if (!enabled) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest(
      'button, [role="button"], [role="switch"], [role="tab"], [role="menuitem"], a[href]'
    ) as HTMLElement | null;
    if (!btn) return;
    if (btn.dataset.silent === "true") return;
    if (btn.hasAttribute("disabled")) return;
    sfx.click();
  };
  window.addEventListener("pointerdown", handler, { capture: true });
};
