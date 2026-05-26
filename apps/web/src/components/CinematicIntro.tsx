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

    // slashes-reveal: // swooshes in bottom-to-top simultaneously (Wait exactly 0.5s after ORNYX settles at 2000ms -> 2500ms)
    pushTimer(() => setIntroState('slashes-reveal'), 2500);

    // soma-reveal: Unit 1 shifts left, and SOMA swooshes in from the slashes (Wait 900ms slashes reveal -> 3400ms)
    pushTimer(() => setIntroState('soma-reveal'), 3400);

    // dock: Fly to nav (Let SOMA settle for 1.2s + 1.2s rest -> 5800ms)
    pushTimer(() => {
      measureDockTarget();
      setIntroState('dock');
    }, 5800);

    const dockEnd = 5800 + 1100; // 6900ms

    // indictment-1: We built a system to (dockEnd + 500ms rest -> 7400ms)
    pushTimer(() => setIntroState('indictment-1'), dockEnd + 500);

    // indictment-2: standardize minds (Wait 1400ms -> 8800ms)
    pushTimer(() => setIntroState('indictment-2'), dockEnd + 1900);

    // indictment-3: It worked. (Wait 1400ms -> 10200ms)
    pushTimer(() => setIntroState('indictment-3'), dockEnd + 3300);

    // indictment-4: Too well. (Wait 1400ms -> 11600ms)
    pushTimer(() => setIntroState('indictment-4'), dockEnd + 4700);

    // color bleed: standardize turns orange (Wait 200ms after Line 4 "Too well." is in -> 11800ms)
    pushTimer(() => setStandardizeOrange(true), dockEnd + 4900);

    // world-open: cascade main page, unlock scroll, fade overlay (Wait 2.8s after bleed starts -> 14600ms)
    pushTimer(() => setIntroState('world-open'), dockEnd + 7700);

    // complete: unmount overlay (Wait 1600ms after world-open starts -> 16200ms)
    pushTimer(() => {
      if (!isComplete.current) {
        isComplete.current = true;
        document.body.classList.remove('ci-active');
        document.body.classList.add('ci-done');
        setIntroState('complete');
        setTimeout(onComplete, 80);
      }
    }, dockEnd + 9300);

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
        <span
          className={[
            'ci-logo__unit-1',
            atOrPast('soma-reveal') ? 'ci-logo__unit-1--shifted' : '',
          ].join(' ')}
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
