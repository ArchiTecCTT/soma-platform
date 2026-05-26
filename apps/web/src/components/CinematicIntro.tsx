import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── State Machine ────────────────────────────────────────────────────────────
// pre-reveal → reveal → soma-type → dock → indictment-1 → indictment-2
//           → indictment-3 → indictment-4 → world-open → complete
// ─────────────────────────────────────────────────────────────────────────────

export type IntroState =
  | 'pre-reveal'
  | 'reveal'
  | 'soma-type'
  | 'dock'
  | 'indictment-1'
  | 'indictment-2'
  | 'indictment-3'
  | 'indictment-4'
  | 'world-open'
  | 'complete';

interface CinematicIntroProps {
  /** Called once the intro fully completes so App can unmount the overlay */
  onComplete: () => void;
  /** Ref to the nav wordmark so we can measure its position for the dock */
  navWordmarkRef: React.RefObject<HTMLElement | null>;
}

const SOMA_LETTERS = ['/', '/', ' ', 'S', 'O', 'M', 'A'];

export default function CinematicIntro({ onComplete, navWordmarkRef }: CinematicIntroProps) {
  const [introState, setIntroState] = useState<IntroState>('pre-reveal');
  const [somaTyped, setSomaTyped]   = useState(0); // how many chars of "// SOMA" are visible
  const [standardizeOrange, setStandardizeOrange] = useState(false);
  const [standardizePulse,  setStandardizePulse]  = useState(false);

  const logoRef      = useRef<HTMLSpanElement>(null);
  const isComplete   = useRef(false);
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const pushTimer = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  const clearAllTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /** Measure the gap between the centered overlay logo and its nav destination */
  const measureDockTarget = useCallback(() => {
    const logoEl = logoRef.current;
    const navEl  = navWordmarkRef.current;
    if (!logoEl || !navEl) return;

    const lr = logoEl.getBoundingClientRect();
    const nr = navEl.getBoundingClientRect();

    logoEl.style.setProperty('--dock-x', `${nr.left + nr.width / 2 - (lr.left + lr.width / 2)}px`);
    logoEl.style.setProperty('--dock-y', `${nr.top  + nr.height / 2 - (lr.top  + lr.height / 2)}px`);
  }, [navWordmarkRef]);

  // ── Skip handler — collapse everything to final state ────────────────────────
  const skip = useCallback(() => {
    if (isComplete.current) return;
    isComplete.current = true;
    clearAllTimers();

    document.body.classList.remove('ci-active');
    document.body.classList.add('ci-done');
    setIntroState('complete');
    // Short delay so React can flush, then call onComplete
    setTimeout(onComplete, 80);
  }, [clearAllTimers, onComplete]);

  // ── Main sequence ────────────────────────────────────────────────────────────
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { skip(); return; }

    document.body.classList.add('ci-active');
    isComplete.current = false;

    // Ensure we can measure before dock transition fires
    pushTimer(measureDockTarget, 0);

    // Act 1 — ORNYX reveal
    pushTimer(() => setIntroState('reveal'), 300);

    // Act 1b — // SOMA types in
    pushTimer(() => setIntroState('soma-type'), 1050);

    // Type "// SOMA" letter by letter (7 chars × 90 ms each)
    SOMA_LETTERS.forEach((_, i) => {
      pushTimer(() => setSomaTyped(i + 1), 1050 + i * 90);
    });

    // Act 2 — dock
    pushTimer(() => {
      measureDockTarget();
      setIntroState('dock');
    }, 1050 + SOMA_LETTERS.length * 90 + 320);

    const dockEnd = 1050 + SOMA_LETTERS.length * 90 + 320 + 820;

    // Act 3 — Indictment cascade
    pushTimer(() => setIntroState('indictment-1'), dockEnd + 160);
    pushTimer(() => setIntroState('indictment-2'), dockEnd + 900);
    // Colour bleed on standardize starts 300 ms after line 2 appears
    pushTimer(() => setStandardizeOrange(true), dockEnd + 1200);
    pushTimer(() => setIntroState('indictment-3'), dockEnd + 1800);
    pushTimer(() => setIntroState('indictment-4'), dockEnd + 2700);
    // Pulse on "Too well."
    pushTimer(() => { setStandardizePulse(true); }, dockEnd + 2700);
    pushTimer(() => setStandardizePulse(false), dockEnd + 3200);

    // Act 4 — World opens
    pushTimer(() => setIntroState('world-open'), dockEnd + 3600);

    // Complete
    pushTimer(() => {
      if (!isComplete.current) {
        isComplete.current = true;
        document.body.classList.remove('ci-active');
        document.body.classList.add('ci-done');
        setIntroState('complete');
        setTimeout(onComplete, 80);
      }
    }, dockEnd + 5200);

    return clearAllTimers;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skip on scroll / touch / key ────────────────────────────────────────────
  useEffect(() => {
    const onWheel  = () => skip();
    const onTouch  = () => skip();
    const onKey    = (e: KeyboardEvent) => {
      if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Escape'].includes(e.key)) skip();
    };

    window.addEventListener('wheel',     onWheel,  { passive: true });
    window.addEventListener('touchmove', onTouch,  { passive: true });
    window.addEventListener('keydown',   onKey);

    return () => {
      window.removeEventListener('wheel',     onWheel);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('keydown',   onKey);
    };
  }, [skip]);

  // ── Realign dock target on window resize ────────────────────────────────────
  useEffect(() => {
    let raf: number;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureDockTarget);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf); };
  }, [measureDockTarget]);

  // ── Derived booleans ─────────────────────────────────────────────────────────
  const states: IntroState[] = [
    'pre-reveal','reveal','soma-type','dock',
    'indictment-1','indictment-2','indictment-3','indictment-4',
    'world-open','complete',
  ];
  const stateIdx = states.indexOf(introState);

  const past = (s: IntroState) => stateIdx > states.indexOf(s);
  const atOrPast = (s: IntroState) => stateIdx >= states.indexOf(s);

  const isDocked         = atOrPast('dock');
  const showIndictment1  = atOrPast('indictment-1');
  const showIndictment2  = atOrPast('indictment-2');
  const showIndictment3  = atOrPast('indictment-3');
  const showIndictment4  = atOrPast('indictment-4');
  const showWorldOpen    = atOrPast('world-open');
  const overlayDone      = atOrPast('complete');

  if (introState === 'complete') return null;

  return (
    <div
      id="ci-overlay"
      aria-hidden="true"
      className={`ci-overlay ${overlayDone ? 'ci-overlay--done' : ''}`}
    >
      {/* ── Scanline flicker — single decorative layer ──────────────────── */}
      <div className="ci-scanlines" />

      {/* ── Centered wordmark (Acts 1 & 2) ─────────────────────────────── */}
      <span
        ref={logoRef}
        id="ci-logo"
        className={[
          'ci-logo',
          atOrPast('reveal')    ? 'ci-logo--visible'  : '',
          atOrPast('soma-type') ? 'ci-logo--full'     : '',
          isDocked              ? 'ci-logo--docked'   : '',
          past('dock')          ? 'ci-logo--hidden'   : '',
        ].join(' ')}
        style={{ '--dock-x': '0px', '--dock-y': '0px' } as React.CSSProperties}
      >
        <span className="ci-logo__ornyx">ORNYX</span>
        <span
          className="ci-logo__soma"
          aria-hidden="true"
        >
          {SOMA_LETTERS.slice(0, somaTyped).join('')}
          {somaTyped < SOMA_LETTERS.length && atOrPast('soma-type') && (
            <span className="ci-type-cursor" />
          )}
        </span>
      </span>

      {/* ── Indictment text (Act 3) — lives inside overlay, centered ──── */}
      <div
        className={`ci-indictment ${showIndictment1 ? 'ci-indictment--visible' : ''} ${showWorldOpen ? 'ci-indictment--exit' : ''}`}
      >
        {/* Line 1 */}
        <p className={`ci-line ci-line--1 ${showIndictment1 ? 'ci-line--in' : ''}`}>
          We built a system to
        </p>

        {/* Line 2 — standardize colour-bleeds after delay */}
        <p className={`ci-line ci-line--2 ${showIndictment2 ? 'ci-line--in' : ''}`}>
          <span
            className={[
              'ci-standardize',
              standardizeOrange ? 'ci-standardize--orange' : '',
              standardizePulse  ? 'ci-standardize--pulse'  : '',
            ].join(' ')}
          >
            standardize
          </span>
          {' '}minds.
        </p>

        {/* Line 3 */}
        <p className={`ci-line ci-line--3 ${showIndictment3 ? 'ci-line--in' : ''}`}>
          It worked.{' '}
          <span className="ci-bold">Too well.</span>
        </p>
      </div>

      {/* ── Skip hint ───────────────────────────────────────────────────── */}
      <div className={`ci-skip ${atOrPast('indictment-1') && !showWorldOpen ? 'ci-skip--visible' : ''}`}>
        scroll or press any key to skip
      </div>
    </div>
  );
}
