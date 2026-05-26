import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── State Machine ────────────────────────────────────────────────────────────
// pre-reveal → reveal → slashes-reveal → soma-reveal → dock → indictment-1
//           → indictment-2 → indictment-3 → indictment-4 → world-open → complete
// ─────────────────────────────────────────────────────────────────────────────

export type IntroState =
  | 'pre-reveal'
  | 'reveal'
  | 'slashes-reveal'
  | 'soma-reveal'
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

export default function CinematicIntro({ onComplete, navWordmarkRef }: CinematicIntroProps) {
  const [introState, setIntroState] = useState<IntroState>('pre-reveal');
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

    // Timing timeline:
    // reveal: ORNYX starts slow majestic fade-in
    pushTimer(() => setIntroState('reveal'), 500);

    // slashes-reveal: // swooshes in (Wait exactly 1.0 second after ORNYX settles at 2500ms -> 3500ms)
    pushTimer(() => setIntroState('slashes-reveal'), 3500);

    // soma-reveal: SOMA swooshes in from // 0.5 seconds later (3500ms + 500ms = 4000ms)
    pushTimer(() => setIntroState('soma-reveal'), 4000);

    // dock: Fly to nav (Let SOMA settle for 1.2s + 1.2s rest -> 6400ms)
    pushTimer(() => {
      measureDockTarget();
      setIntroState('dock');
    }, 6400);

    const dockEnd = 6400 + 1200; // 7600ms

    // indictment-1: We built a system to (dockEnd + 600ms rest -> 8200ms)
    pushTimer(() => setIntroState('indictment-1'), dockEnd + 600);

    // indictment-2: standardize minds (Wait 1600ms -> 9800ms)
    pushTimer(() => setIntroState('indictment-2'), dockEnd + 2200);

    // color bleed: standardize orange (Wait 800ms after Line 2 -> 10600ms)
    pushTimer(() => setStandardizeOrange(true), dockEnd + 3000);

    // indictment-3: It worked. (Wait 2200ms after Line 2 starts -> 12000ms)
    pushTimer(() => setIntroState('indictment-3'), dockEnd + 4400);

    // indictment-4: Too well. (Wait 1600ms -> 13600ms)
    pushTimer(() => {
      setIntroState('indictment-4');
      setStandardizePulse(true);
    }, dockEnd + 6000);

    // Turn off pulse glow (Wait 700ms -> 14300ms)
    pushTimer(() => setStandardizePulse(false), dockEnd + 6700);

    // world-open: cascade main page, unlock scroll, fade overlay (Wait 2400ms after Line 4 starts -> 16000ms)
    pushTimer(() => setIntroState('world-open'), dockEnd + 8400);

    // complete: unmount overlay (Wait 1800ms after world-open starts -> 17800ms)
    pushTimer(() => {
      if (!isComplete.current) {
        isComplete.current = true;
        document.body.classList.remove('ci-active');
        document.body.classList.add('ci-done');
        setIntroState('complete');
        setTimeout(onComplete, 80);
      }
    }, dockEnd + 10200);

    return clearAllTimers;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Skip on scroll / touch / click / key ─────────────────────────────────────
  useEffect(() => {
    const onWheel  = () => skip();
    const onTouch  = () => skip();
    const onClick  = () => skip();
    const onKey    = (e: KeyboardEvent) => {
      if ([' ', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Escape'].includes(e.key)) skip();
    };

    window.addEventListener('wheel',     onWheel,  { passive: true });
    window.addEventListener('touchmove', onTouch,  { passive: true });
    window.addEventListener('click',     onClick,  { passive: true });
    window.addEventListener('keydown',   onKey);

    return () => {
      window.removeEventListener('wheel',     onWheel);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('click',     onClick);
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
    'pre-reveal', 'reveal', 'slashes-reveal', 'soma-reveal', 'dock',
    'indictment-1', 'indictment-2', 'indictment-3', 'indictment-4',
    'world-open', 'complete',
  ];
  const stateIdx = states.indexOf(introState);

  const atOrPast = (s: IntroState) => stateIdx >= states.indexOf(s);

  const isDocked         = atOrPast('dock');
  const showIndictment1  = atOrPast('indictment-1');
  const showIndictment2  = atOrPast('indictment-2');
  const showIndictment3  = atOrPast('indictment-3');
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

      {/* ── Centered wordmark logo (Acts 1 & 2) ─────────────────────────────── */}
      <span
        ref={logoRef}
        id="ci-logo"
        className={[
          'ci-logo',
          atOrPast('reveal')     ? 'ci-logo--visible'  : '',
          isDocked               ? 'ci-logo--docked'   : '',
          atOrPast('world-open') ? 'ci-logo--hidden'   : '',
        ].join(' ')}
        style={{ '--dock-x': '0px', '--dock-y': '0px' } as React.CSSProperties}
      >
        <span className="ci-logo__ornyx">ORNYX</span>
        <span
          className={[
            'ci-logo__slashes',
            atOrPast('slashes-reveal') ? 'ci-logo__slashes--visible' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          //
        </span>
        <span
          className={[
            'ci-logo__soma',
            atOrPast('soma-reveal') ? 'ci-logo__soma--visible' : '',
          ].join(' ')}
          aria-hidden="true"
        >
          SOMA
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
        scroll, click or press any key to skip
      </div>
    </div>
  );
}
