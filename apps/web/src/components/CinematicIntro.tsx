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
  navWordmarkRef: React.RefObject<HTMLSpanElement | null>;
}

export default function CinematicIntro({ onComplete, navWordmarkRef }: CinematicIntroProps) {
  const [introState, setIntroState] = useState<IntroState>('pre-reveal');
  const [standardizeOrange, setStandardizeOrange] = useState(false);
  const [standardizePulse,  setStandardizePulse]  = useState(false);

  const logoRef      = useRef<HTMLSpanElement>(null);
  const isComplete   = useRef(false);
  const timers       = useRef<ReturnType<typeof setTimeout>[]>([]);

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
  const showIndictment4  = atOrPast('indictment-4');
  const showWorldOpen    = atOrPast('world-open');
  const overlayDone      = atOrPast('complete');

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

  // ── Skip handler — fast-forward animations directly to the gated screen ─────
  const skip = useCallback(() => {
    if (isComplete.current) return;
    clearAllTimers();

    setIntroState('indictment-4');
    setStandardizeOrange(true);
  }, [clearAllTimers]);

  /** Trigger overlay fade-out and unmount when user clicks ENTER */
  const handleEnter = useCallback(() => {
    if (isComplete.current) return;
    isComplete.current = true;
    clearAllTimers();

    setIntroState('world-open');
    document.body.classList.remove('ci-active');
    document.body.classList.add('ci-done');

    // Wait for the 0.7s overlay fade-out to finish, then unmount overlay
    pushTimer(() => {
      setIntroState('complete');
      onComplete();
    }, 700);
  }, [clearAllTimers, onComplete, pushTimer]);

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

    // soma-reveal: Unit 1 shifts left, and SOMA swooshes in from the slashes (Wait 500ms slashes reveal -> 3000ms)
    pushTimer(() => setIntroState('soma-reveal'), 3000);

    // dock: Fly to nav (Let SOMA settle for 1.2s + 1.2s rest -> 5400ms)
    pushTimer(() => {
      measureDockTarget();
      setIntroState('dock');
    }, 5400);

    const dockEnd = 5400 + 1100; // 6500ms

    // indictment-1: We built a system to (dockEnd + 500ms rest -> 7000ms)
    pushTimer(() => setIntroState('indictment-1'), dockEnd + 500);

    // indictment-2: standardize minds (Wait 1400ms -> 8400ms)
    pushTimer(() => setIntroState('indictment-2'), dockEnd + 1900);

    // indictment-3: It worked. (Wait 1400ms -> 9800ms)
    pushTimer(() => setIntroState('indictment-3'), dockEnd + 3300);

    // indictment-4: Too well. (Wait 1400ms -> 11200ms)
    pushTimer(() => setIntroState('indictment-4'), dockEnd + 4700);

    // color bleed: standardize turns orange (Wait 500ms after Line 4 "Too well." is in -> 11700ms)
    pushTimer(() => setStandardizeOrange(true), dockEnd + 5200);

    // color bleed: standardize turns orange (Wait 500ms after Line 4 "Too well." is in -> 11700ms)
    pushTimer(() => setStandardizeOrange(true), dockEnd + 5200);

    // Clean up timers and restore scroll lock state if component unmounts prematurely (fixes Copilot)
    return () => {
      clearAllTimers();
      document.body.classList.remove('ci-active');
    };
  }, [clearAllTimers, measureDockTarget, onComplete, pushTimer, skip]);

  // ── Skip on scroll / touch / click / key ─────────────────────────────────────
  useEffect(() => {
    // Only capture skip gestures while the intro animations are running (before indictment-4 / gated state is reached)
    if (showIndictment4) return;

    const onWheel  = () => skip();
    const onTouch  = () => skip();
    const onClick  = () => skip();
    // Allow any keypress to skip, aligning with the visual copy instructions (fixes Coderabbit/Copilot)
    const onKey    = () => skip();

    window.addEventListener('wheel',     onWheel,  { passive: true });
    window.addEventListener('touchmove', onTouch,  { passive: true });
    window.addEventListener('click',     onClick,  { passive: true });
    window.addEventListener('keydown',   onKey,    { passive: true });

    return () => {
      window.removeEventListener('wheel',     onWheel);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('click',     onClick);
      window.removeEventListener('keydown',   onKey);
    };
  }, [skip, showIndictment4]);

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


  if (introState === 'complete') return null;

  return (
    <div
      id="ci-overlay"
      className={`ci-overlay ${showWorldOpen ? 'ci-overlay--done' : ''}`}
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
        <span className="ci-logo__unit-1">
          <span className="ci-logo__ornyx">ORNYX</span><span
            className={[
              'ci-logo__slashes',
              atOrPast('slashes-reveal') ? 'ci-logo__slashes--visible' : '',
            ].join(' ')}
            aria-hidden="true"
          >//</span>
        </span><span
          className={[
            'ci-logo__soma',
            atOrPast('soma-reveal') ? 'ci-logo__soma--visible' : '',
          ].join(' ')}
          aria-hidden="true"
        >SOMA</span>
      </span>

      {/* ── Indictment text (Act 3) — lives inside overlay, centered ──── */}
      <div
        className={`ci-indictment ${showIndictment1 ? 'ci-indictment--visible' : ''} ${showWorldOpen ? 'ci-indictment--exit' : ''}`}
      >
        {/* Line 1 */}
        <p className="ci-line ci-line--1">
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment1 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-0`}>We</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment1 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-1`}>built</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment1 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-2`}>a</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment1 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-3`}>system</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment1 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-4`}>to</span></span>
        </p>

        {/* Line 2 — standardize colour-bleeds after delay */}
        <p className="ci-line ci-line--2">
          <span className={`inline-block ${standardizeOrange ? '' : 'overflow-hidden'}`}>
            <span
              className={[
                'ci-indictment-word',
                'interactive',
                showIndictment2 ? 'ci-indictment-word--in' : '',
                'ci-indictment-word--delay-0',
                'ci-standardize',
                standardizeOrange ? 'ci-standardize--orange' : '',
              ].join(' ')}
            >
              standardize
            </span>
          </span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment2 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-2`}>minds.</span></span>
        </p>

        {/* Line 3 */}
        <p className="ci-line ci-line--3">
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment3 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-0`}>It</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment3 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-2`}>worked.</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment4 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-0 ci-bold`}>Too</span></span>{' '}
          <span className="inline-block overflow-hidden"><span className={`ci-indictment-word interactive ${showIndictment4 ? 'ci-indictment-word--in' : ''} ci-indictment-word--delay-2 ci-bold`}>well.</span></span>
        </p>

        {/* Post-intro gate: Enter button is always in the DOM to prevent vertical layout centering shifts */}
        <div className="pt-8 flex justify-center w-full z-20">
          <button
            id="hero-enter-btn"
            className={`hero-enter-btn ${showIndictment4 ? 'hero-enter-btn--active' : ''}`}
            onClick={showIndictment4 ? handleEnter : undefined}
          >
            UNDERSTAND ITS UTILITY
          </button>
        </div>
      </div>

      {/* ── Skip hint — only visible until the ENTER button is ready ──────────────── */}
      <div className={`ci-skip ${atOrPast('indictment-1') && !showIndictment4 && !showWorldOpen ? 'ci-skip--visible' : ''}`}>
        scroll, click or press any key to skip
      </div>
    </div>
  );
}
