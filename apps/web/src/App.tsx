import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HISTORICAL_BEATS, RHETORICAL_CHOICE, COMPARISON_DATA, ROADMAP, DEFAULT_FLAWED_CODE } from './constants';
import { ChatMessage, EventLog } from './types';
import { analyzeSandbox } from './lib/rams';
import AmbientBackground from './components/AmbientBackground';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

export default function App() {
  // Loading Screen State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingStatus, setLoadingProgressStatus] = useState<string>('INITIALIZING COGNITIVE CORE...');

  // Narrative Navigation State
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  // Interactive Sandbox State
  const [code, setCode] = useState<string>(DEFAULT_FLAWED_CODE);
  const [explanation, setExplanation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'rams',
      text: "I've loaded a flawed Token Bucket Rate Limiter into your sandbox. It compiles, but it will fail under concurrent production load. Explain how you would fix it, or modify the code directly.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([
    { timestamp: new Date().toLocaleTimeString(), type: 'SYSTEM', message: 'RAMS Session Initialized.' },
    { timestamp: new Date().toLocaleTimeString(), type: 'RAMS_INSPECT', message: 'AST parsed. 2 critical logical vulnerabilities identified.' }
  ]);

  // Audio Waveform Simulation State
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(10));

  // Scroll tracking for scrollytelling effects
  const [scrollY, setScrollY] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Simulated Boot Sequence
  useEffect(() => {
    const statuses = [
      'INITIALIZING COGNITIVE CORE...',
      'PARSING AST PARADIGMS...',
      'ESTABLISHING ADVERSARIAL LINK...',
      'LOADING RAMS REASONING ENGINE...',
      'READY.'
    ];

    let currentStatusIdx = 0;
    let doneTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          doneTimeout = setTimeout(() => setIsLoading(false), 600);
          return 100;
        }
        const nextProgress = prev + Math.floor(Math.random() * 15) + 5;
        if (nextProgress >= (currentStatusIdx + 1) * 20 && currentStatusIdx < statuses.length - 1) {
          currentStatusIdx++;
          setLoadingProgressStatus(statuses[currentStatusIdx]);
        }
        return Math.min(nextProgress, 100);
      });
    }, 150);

    return () => {
      clearInterval(interval);
      if (doneTimeout !== undefined) clearTimeout(doneTimeout);
    };
  }, []);

  // Scroll tracking & Scrollytelling 2.0 Engine - rAF for scrollY/progress, IntersectionObserver for active section
  useEffect(() => {
    let rafId: number;
    let lastScrollY = 0;

    const updateScroll = () => {
      const currentScroll = window.scrollY;
      lastScrollY = currentScroll;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(currentScroll);
      setScrollProgress(totalHeight > 0 ? currentScroll / totalHeight : 0);
    };

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateScroll);
    };

    const sectionIds = ['narrative', 'historical-context', 'world-changed', 'sandbox', 'comparison', 'roadmap'];
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      observers.push(observer);
    });


    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once to set initial values

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  // Simulate audio waveform when RAMS is "speaking"
  useEffect(() => {
    let interval: any;
    if (isAudioPlaying) {
      interval = setInterval(() => {
        setWaveformBars(Array(24).fill(0).map(() => Math.floor(Math.random() * 50) + 10));
      }, 80);
    } else {
      setWaveformBars(Array(24).fill(12));
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying]);

  // Add a system log helper
  const addLog = (type: EventLog['type'], message: string) => {
    setEventLogs(prev => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), type, message }
    ]);
  };

  // Call Gemini API to act as RAMS (Adversarial Mentor)
  const handleAnalyze = async () => {
    if (!explanation.trim() && code === DEFAULT_FLAWED_CODE) {
      addLog('ERROR', 'No modifications or explanations provided to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setIsAudioPlaying(true);
    addLog('SYSTEM', 'Transmitting sandbox state to RAMS...');
    addLog('RAMS_INSPECT', 'Analyzing AST and user reasoning...');

    try {
      const response = await analyzeSandbox(apiBaseUrl, {
        code,
        explanation,
      });

      const ramsResponse = response.critique || 'I detect no rigorous reasoning here. Try again.';

      setChatHistory(prev => [
        ...prev,
        { sender: 'user', text: explanation || "Modified code in sandbox.", timestamp: new Date().toLocaleTimeString() },
        { sender: 'rams', text: ramsResponse, timestamp: new Date().toLocaleTimeString() }
      ]);

      addLog('RAMS_CHALLENGE', 'Adversarial challenge generated.');
      setExplanation('');
    } catch (error) {
      console.error(error);
      addLog('ERROR', 'Failed to connect to RAMS reasoning engine.');
      setChatHistory(prev => [
        ...prev,
        { sender: 'rams', text: "Connection interrupted. The adversarial engine requires a valid environment configuration.", timestamp: new Date().toLocaleTimeString() }
      ]);
    } finally {
      setIsAnalyzing(false);
      setIsAudioPlaying(false);
    }
  };

  // Reset Sandbox to default state
  const handleResetSandbox = () => {
    setCode(DEFAULT_FLAWED_CODE);
    setExplanation('');
    setChatHistory([
      {
        sender: 'rams',
        text: "Sandbox reset. The flawed Token Bucket Rate Limiter is reloaded. Show me your reasoning.",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setEventLogs([
      { timestamp: new Date().toLocaleTimeString(), type: 'SYSTEM', message: 'Sandbox state reset.' }
    ]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col justify-center items-center p-6 select-none">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center items-center space-x-3">
            <div className="w-4 h-4 bg-brand-accent animate-ping rounded-full"></div>
            <span className="font-mono tracking-[0.3em] text-sm font-bold text-white">ORNYX // SOMA</span>
          </div>

          <div className="space-y-2">
            <div className="h-1 w-full bg-brand-gray rounded-full overflow-hidden">
              <div
                style={{ width: `${loadingProgress}%` }}
                className="h-full bg-gradient-to-r from-brand-accent to-brand-cyan transition-all duration-150"
              ></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-brand-textMuted">
              <span>{loadingStatus}</span>
              <span>{loadingProgress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-black text-gray-100 selection:bg-brand-accent selection:text-black">

      {/* Ambient Background Motion */}
      <AmbientBackground />

      {/* Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-brand-black/80 backdrop-blur-md border-b border-brand-gray px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-brand-accent animate-pulse rounded-full"></div>
          <span className="font-mono tracking-widest text-sm font-bold text-white">ORNYX // SOMA</span>
        </div>
        <nav className="hidden md:flex space-x-8 text-xs font-mono tracking-wider text-brand-textMuted">
          <a href="#narrative" className={`transition-colors ${activeSection === 'narrative' ? 'text-brand-accent' : 'hover:text-white'}`}>01 / THE PROBLEM</a>
          <a href="#sandbox" className={`transition-colors ${activeSection === 'sandbox' ? 'text-brand-cyan' : 'hover:text-white'}`}>02 / LIVE DEMO</a>
          <a href="#comparison" className={`transition-colors ${activeSection === 'comparison' ? 'text-white' : 'hover:text-white'}`}>03 / ARCHITECTURE</a>
          <a href="#roadmap" className={`transition-colors ${activeSection === 'roadmap' ? 'text-white' : 'hover:text-white'}`}>04 / ROADMAP</a>
        </nav>
        <div>
          <a
            href="#cta"
            className="px-4 py-1.5 border border-brand-accent/40 hover:border-brand-accent text-brand-accent hover:bg-brand-accent/10 transition-all text-xs font-mono tracking-wider rounded"
          >
            INITIATE SESSION
          </a>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-grow pt-16">

        {/* SECTION 1: Hook (Immersive Storytelling) */}
        <section id="narrative" className="relative min-h-[95vh] flex flex-col justify-center items-center px-6 text-center overflow-hidden border-b border-brand-gray">
          {/* Subtle background grid with parallax effect */}
          <div
            style={{ transform: `translateY(${scrollY * 0.15}px)` }}
            className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none"
          ></div>

          <div className="max-w-4xl mx-auto z-10 space-y-10">
            {/* Hero Title: Slower, premium entry animation */}
            <h1 className="animate-hero-title text-5xl md:text-7xl font-light tracking-tight text-white leading-tight font-display">
              We built a system to <span className="text-brand-accent font-mono font-normal">standardize</span> minds.
              <br />
              <span className="font-semibold">It worked. Too well.</span>
            </h1>

            {/* Hero Sub-header: Slower, slides in from the right */}
            <p className="animate-hero-sub text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed font-light tracking-wide">
              Industrial-era education optimized for obedience, predictability, and compliance. But modern technical life rewards the exact opposite: <span className="text-white font-medium">autonomy, synthesis, and adversarial reasoning</span>.
            </p>

            {/* Hero Buttons: Sequenced left-slide and fade-in */}
            <div className="pt-6 flex flex-col sm:flex-row justify-center items-center gap-8">
              <button
                onClick={() => {
                  document.getElementById('historical-context')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="animate-hero-btn-left px-8 py-4 bg-brand-gray hover:bg-brand-lightGray border border-brand-lightGray text-white text-xs font-mono tracking-widest transition-all rounded hover:border-brand-accent/50 hover:shadow-[0_0_20px_rgba(255,87,51,0.15)]"
              >
                BEGIN HISTORICAL INQUIRY
              </button>
              <a
                href="#sandbox"
                className="animate-hero-btn-fade text-xs font-mono tracking-widest text-brand-textMuted hover:text-white transition-colors underline underline-offset-4"
              >
                SKIP TO LIVE SANDBOX
              </a>
            </div>
          </div>

          {/* Scroll indicator: Highly visible, static text, flowing light track */}
          <div
            onClick={() => {
              document.getElementById('historical-context')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="animate-hero-scroll absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4 z-20 cursor-pointer group"
          >
            <span className="text-xs font-mono tracking-[0.3em] text-brand-accent font-semibold uppercase transition-colors group-hover:text-white">
              SCROLL TO DESCEND
            </span>
            <div className="w-[2px] h-16 bg-brand-gray/80 relative overflow-hidden rounded-full">
              <div className="absolute top-0 left-0 w-full h-1/2 bg-brand-accent rounded-full animate-scroll-flow"></div>
            </div>
          </div>
        </section>


        {/* SECTION 2: Why the old system existed */}
        <section id="historical-context" className="py-24 px-6 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-md relative overflow-hidden">
          {/* Self-drawing SVG line connecting the beats driven by scroll progress */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 100 100 Q 300 300 500 100 T 900 400"
                fill="none"
                stroke="#FF5733"
                strokeWidth="2"
                style={{ strokeDashoffset: 1000 - (scrollProgress * 1000) }}
              />
            </svg>
          </div>

          <div className="max-w-5xl mx-auto space-y-16 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-xs font-mono text-brand-accent tracking-widest">01 / HISTORICAL LOGIC</span>
                <h2 className="text-3xl md:text-4xl font-light text-white mt-2 font-display">The System Was Not Always Irrational.</h2>
              </div>
              <p className="text-brand-textMuted text-xs md:text-sm max-w-md leading-relaxed">
                To critique the past, we must first understand its utility. The industrial machine required human components that behaved with mathematical predictability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HISTORICAL_BEATS.map((beat, idx) => (
                <div
                  key={beat.id}
                  className="p-6 border border-brand-gray bg-brand-black/80 rounded-lg hover:border-brand-accent/40 transition-all duration-500 group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-xs font-mono text-brand-textMuted">{beat.era}</span>
                    <span className="text-xs font-mono text-brand-accent group-hover:animate-pulse">0{idx + 1}</span>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-3 font-display">{beat.title}</h3>
                  <p className="text-brand-textMuted text-xs leading-relaxed mb-6">{beat.description}</p>
                  <div className="border-t border-brand-gray pt-4">
                    <span className="block text-2xl font-mono text-white font-bold">{beat.metric}</span>
                    <span className="text-[10px] font-mono text-brand-textMuted uppercase tracking-wider">{beat.metricLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  document.getElementById('world-changed')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-2 border border-brand-lightGray hover:border-brand-accent text-xs font-mono tracking-widest transition-all rounded"
              >
                OBSERVE THE SHIFT
              </button>
            </div>
          </div>
        </section>


        {/* SECTION 3: The world changed */}
        <section id="world-changed" className="py-24 px-6 border-b border-brand-gray relative overflow-hidden">
          <div className="max-w-5xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">02 / THE GREAT DIVERGENCE</span>
              <h2 className="text-3xl md:text-4xl font-light text-white font-display">The World Mutated. The Classroom Stagnated.</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                The modern technical landscape does not reward obedience. It demands rapid synthesis, continuous adaptation, and the courage to reason under extreme uncertainty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Then */}
              <div className="p-8 border border-brand-gray bg-brand-dark/50 rounded-lg relative group hover:border-brand-lightGray transition-all">
                <div className="absolute top-4 right-4 text-[10px] font-mono text-brand-textMuted">HISTORICAL PARADIGM</div>
                <h3 className="text-xl font-mono text-brand-textMuted mb-6">Optimized for "Then"</h3>
                <ul className="space-y-4 text-xs font-mono text-brand-textMuted">
                  <li className="flex items-center space-x-3">
                    <span className="text-red-500">✕</span>
                    <span>Standardized testing & rote memorization</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-red-500">✕</span>
                    <span>Fear of error as a grading penalty</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-red-500">✕</span>
                    <span>Passive consumption of pre-filtered curricula</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-red-500">✕</span>
                    <span>Linear progression through static concepts</span>
                  </li>
                </ul>
              </div>

              {/* Now */}
              <div className="p-8 border border-brand-accent/30 bg-brand-dark rounded-lg relative group hover:border-brand-accent transition-all shadow-[0_0_30px_rgba(255,87,51,0.02)]">
                <div className="absolute top-4 right-4 text-[10px] font-mono text-brand-accent">MODERN REALITY</div>
                <h3 className="text-xl font-mono text-white mb-6">Demanded by "Now"</h3>
                <ul className="space-y-4 text-xs font-mono text-white">
                  <li className="flex items-center space-x-3">
                    <span className="text-brand-cyan">✓</span>
                    <span>First-principles synthesis & system design</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-brand-cyan">✓</span>
                    <span>Rapid failure loops as primary learning signals</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-brand-cyan">✓</span>
                    <span>Autonomy to navigate complex, open-ended systems</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <span className="text-brand-cyan">✓</span>
                    <span>Continuous adaptation to shifting technical stacks</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 4: Why this becomes harmful now */}
        <section className="py-24 px-6 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-md relative">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">03 / THE COGNITIVE TRAP</span>
              <h2 className="text-2xl md:text-3xl font-light text-white font-display">Inherited Habits Are Actively Harmful.</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                When technical builders are trained to seek the "correct answer" from an authority, they lose the capacity to challenge assumptions. Test your default cognitive instinct below.
              </p>
            </div>

            {/* Rhetorical Choice Interaction */}
            <div className="p-6 md:p-8 border border-brand-gray bg-brand-black rounded-lg space-y-6">
              <h3 className="text-sm font-mono text-white border-b border-brand-gray pb-4">
                {RHETORICAL_CHOICE.question}
              </h3>

              <div className="space-y-3">
                {RHETORICAL_CHOICE.options.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSelectedChoice(option.key)}
                    className={`w-full text-left p-4 border rounded-lg transition-all text-xs font-mono flex items-start space-x-4 ${
                      selectedChoice === option.key
                        ? option.isHarmful
                          ? 'border-brand-accent bg-brand-accent/5 text-white'
                          : 'border-brand-cyan bg-brand-cyan/5 text-white'
                        : 'border-brand-gray hover:border-brand-lightGray text-brand-textMuted'
                    }`}
                  >
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      selectedChoice === option.key
                        ? option.isHarmful ? 'bg-brand-accent text-black' : 'bg-brand-cyan text-black'
                        : 'bg-brand-gray text-brand-textMuted'
                    }`}>
                      {option.key}
                    </span>
                    <span>{option.text}</span>
                  </button>
                ))}
              </div>

              {selectedChoice && (
                <div className="p-4 border border-brand-lightGray bg-brand-dark rounded-lg animate-fadeIn">
                  <span className="text-[10px] font-mono text-brand-accent uppercase tracking-wider block mb-1">
                    Consequence Analysis:
                  </span>
                  <p className="text-xs text-brand-textMuted leading-relaxed">
                    {RHETORICAL_CHOICE.options.find(o => o.key === selectedChoice)?.consequence}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* SECTION 5: AI makes this easier to hide */}
        <section className="py-24 px-6 border-b border-brand-gray relative overflow-hidden">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-mono text-brand-accent tracking-widest">04 / THE AGREEABILITY CRISIS</span>
              <h2 className="text-3xl font-light text-white leading-tight font-display">
                Modern AI is powerful.
                <br />
                <span className="text-brand-accent font-semibold">But it is too agreeable.</span>
              </h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                Current AI tools are optimized for user satisfaction. They generate fast output, agree with flawed premises, and mask weak reasoning. They accelerate your typing speed while quietly eroding your deep understanding.
              </p>
              <div className="p-4 border border-brand-gray bg-brand-dark/50 rounded-lg font-mono text-xs text-brand-textMuted space-y-2">
                <div className="text-brand-accent font-bold">// THE COGNITIVE FAILURE MODE</div>
                <div>1. User proposes a flawed architectural pattern.</div>
                <div>2. AI enthusiastically agrees and generates 200 lines of boilerplate.</div>
                <div>3. User deploys, feeling highly productive.</div>
                <div>4. System fails under load. User cannot debug it.</div>
              </div>
            </div>

            {/* Visual representation of the Agreeability Trap */}
            <div className="border border-brand-gray bg-brand-dark p-6 rounded-lg font-mono text-xs space-y-4 relative">
              <div className="absolute top-3 right-3 flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
              </div>

              <div className="text-brand-textMuted border-b border-brand-gray pb-2">STANDARD_AI_SESSION.log</div>

              <div className="space-y-3">
                <div className="text-brand-cyan">
                  <span className="text-brand-textMuted">[USER]:</span> "Is my O(N^2) bubble sort fine for this 10M record database?"
                </div>
                <div className="text-brand-textMuted pl-4 border-l border-brand-gray">
                  <span className="text-brand-accent font-bold">[AI]:</span> "Yes, absolutely! Bubble sort is a classic and highly intuitive algorithm. While it has an O(N^2) time complexity, it is very easy to implement and understand. Here is the optimized code for your database..."
                </div>
                <div className="text-red-500 text-[10px] bg-red-950/30 p-2 border border-red-900/50 rounded">
                  CRITICAL WARNING: Agreeable response generated. Cognitive validation bypassed. False confidence established.
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 6: Soma Reveal */}
        <section className="py-32 px-6 border-b border-brand-gray bg-brand-black/50 backdrop-blur-md relative text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/0 via-brand-accent/5 to-brand-dark/0 pointer-events-none"></div>
          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            <span className="text-xs font-mono text-brand-cyan tracking-widest uppercase">Introducing Ornyx // Soma</span>
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-white font-display">
              SOMA
            </h2>
            <p className="text-brand-accent font-mono text-sm tracking-widest uppercase">
              The Adversarial Learning Engine
            </p>
            <p className="text-brand-textMuted text-sm md:text-base max-w-xl mx-auto leading-relaxed font-light">
              Soma does not write your code for you. It does not agree with your weak assumptions. Powered by <span className="text-white font-medium">RAMS</span>, a voice-first AI mentor, Soma challenges your reasoning, inspects your live sandbox state, and forces you to synthesize understanding.
            </p>
            <div className="pt-4">
              <a
                href="#sandbox"
                className="px-8 py-3 bg-brand-accent hover:bg-brand-accent/90 text-black text-xs font-mono font-bold tracking-widest transition-all rounded inline-block"
              >
                ENTER THE SANDBOX
              </a>
            </div>
          </div>
        </section>


        {/* SECTION 7: How Soma works & Live Sandbox Simulator */}
        <section id="sandbox" className="py-24 px-6 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-md relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">05 / LIVE PROTOTYPE</span>
              <h2 className="text-3xl font-light text-white font-display">The RAMS Adversarial Session</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                Interact with the live MVP prototype below. We have loaded a flawed rate limiter. Modify the code or explain your reasoning, and let RAMS challenge your logic.
              </p>
            </div>

            {/* Interactive Sandbox Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Code Sandbox (5 cols) */}
              <div className="lg:col-span-5 flex flex-col border border-brand-gray bg-brand-black rounded-lg overflow-hidden">
                <div className="bg-brand-dark px-4 py-3 border-b border-brand-gray flex justify-between items-center">
                  <span className="text-xs font-mono text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-brand-cyan"></span>
                    <span>sandbox_environment.js</span>
                  </span>
                  <button
                    onClick={handleResetSandbox}
                    className="text-[10px] font-mono text-brand-textMuted hover:text-white transition-colors"
                  >
                    RESET CODE
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  aria-label="Sandbox code editor"
                  className="flex-grow p-4 bg-brand-black text-brand-cyan font-mono text-xs leading-relaxed focus:outline-none resize-none min-h-[350px] lg:min-h-[450px]"
                  spellCheck="false"
                />
                <div className="bg-brand-dark/50 px-4 py-2 border-t border-brand-gray text-[10px] font-mono text-brand-textMuted flex justify-between">
                  <span>Lines: {code.split('\n').length}</span>
                  <span>Language: JavaScript (ES6)</span>
                </div>
              </div>

              {/* Middle Column: RAMS Session & Chat (4 cols) */}
              <div className="lg:col-span-4 flex flex-col border border-brand-gray bg-brand-black rounded-lg overflow-hidden">
                <div className="bg-brand-dark px-4 py-3 border-b border-brand-gray flex justify-between items-center">
                  <span className="text-xs font-mono text-white flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></span>
                    <span>RAMS_SESSION_ACTIVE</span>
                  </span>
                  <span className="text-[10px] font-mono text-brand-accent">VOICE-FIRST MENTOR</span>
                </div>

                {/* Chat History */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto max-h-[300px] lg:max-h-[350px] min-h-[250px]">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-xs font-mono leading-relaxed ${
                        msg.sender === 'rams'
                          ? 'bg-brand-dark border-l-2 border-brand-accent text-brand-textMuted'
                          : 'bg-brand-lightGray/30 border-l-2 border-brand-cyan text-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 text-[10px] text-brand-textMuted">
                        <span className="font-bold uppercase">{msg.sender === 'rams' ? 'RAMS' : 'YOU'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>

                {/* Simulated Audio Waveform */}
                <div className="px-4 py-3 bg-brand-dark/30 border-t border-brand-gray flex items-center justify-between">
                  <span className="text-[10px] font-mono text-brand-textMuted">RAMS VOICE FEED</span>
                  <div className="flex items-end space-x-1 h-8">
                    {waveformBars.map((height, idx) => (
                      <div
                        key={idx}
                        style={{ height: `${height}%` }}
                        className={`w-1 rounded-t transition-all duration-100 ${isAudioPlaying ? 'bg-brand-accent' : 'bg-brand-gray'}`}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-brand-gray bg-brand-dark space-y-3">
                  <textarea
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    aria-label="Explain your reasoning or proposed fix here"
                    placeholder="Explain your reasoning or proposed fix here..."
                    className="w-full p-3 bg-brand-black border border-brand-gray rounded-lg text-xs font-mono text-white focus:outline-none focus:border-brand-accent resize-none h-20"
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full py-2.5 bg-brand-accent hover:bg-brand-accent/90 disabled:bg-brand-gray text-black font-mono text-xs font-bold tracking-widest transition-all rounded-lg flex justify-center items-center space-x-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="animate-spin">⚡</span>
                        <span>RAMS IS THINKING...</span>
                      </>
                    ) : (
                      <>
                        <span>SUBMIT TO RAMS</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Sandbox State & Event Logs (3 cols) */}
              <div className="lg:col-span-3 flex flex-col border border-brand-gray bg-brand-black rounded-lg overflow-hidden">
                <div className="bg-brand-dark px-4 py-3 border-b border-brand-gray">
                  <span className="text-xs font-mono text-white flex items-center space-x-2">
                    <span>STATE_INSPECTION.log</span>
                  </span>
                </div>

                <div className="flex-grow p-4 font-mono text-[10px] space-y-3 overflow-y-auto max-h-[400px]">
                  {eventLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-brand-gray/30 pb-2">
                      <div className="flex justify-between text-brand-textMuted mb-1">
                        <span>{log.timestamp}</span>
                        <span className={`px-1 rounded ${
                          log.type === 'SYSTEM' ? 'bg-brand-gray text-white' :
                          log.type === 'RAMS_INSPECT' ? 'bg-brand-cyan/20 text-brand-cyan' :
                          log.type === 'RAMS_CHALLENGE' ? 'bg-brand-accent/20 text-brand-accent' :
                          'bg-red-950 text-red-400'
                        }`}>
                          {log.type}
                        </span>
                      </div>
                      <p className="text-white leading-relaxed">{log.message}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-brand-dark/50 border-t border-brand-gray space-y-2">
                  <div className="text-[10px] font-mono text-brand-textMuted uppercase tracking-wider">Active Constraints:</div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-textMuted">Concurrency Guard:</span>
                    <span className="text-red-500">MISSING</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-textMuted">Precision Loss:</span>
                    <span className="text-red-500">DETECTED</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* SECTION 8: Why Soma is different */}
        <section id="comparison" className="py-24 px-6 border-b border-brand-gray bg-brand-black/50 backdrop-blur-md relative">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">06 / ARCHITECTURAL CONTRAST</span>
              <h2 className="text-3xl font-light text-white font-display">Soma vs The Agreeable Web</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                We do not build tools to help you type faster. We build engines to help you think deeper.
              </p>
            </div>

            <div className="overflow-x-auto border border-brand-gray rounded-lg">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-brand-dark border-b border-brand-gray text-white">
                    <th className="p-4 font-medium">Feature / Paradigm</th>
                    <th className="p-4 font-medium text-brand-accent">SOMA // RAMS</th>
                    <th className="p-4 font-medium text-brand-textMuted">Standard Chatbots</th>
                    <th className="p-4 font-medium text-brand-textMuted">Coding Copilots</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-gray text-brand-textMuted">
                  {COMPARISON_DATA.map((row, idx) => (
                    <tr key={idx} className="hover:bg-brand-dark/30 transition-colors">
                      <td className="p-4 font-medium text-white">{row.feature}</td>
                      <td className="p-4 text-brand-cyan bg-brand-accent/5 font-medium">{row.soma}</td>
                      <td className="p-4">{row.chatbots}</td>
                      <td className="p-4">{row.copilots}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>


        {/* SECTION 9: What exists now */}
        <section className="py-24 px-6 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-md relative">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">07 / HONEST PROOF</span>
              <h2 className="text-3xl font-light text-white font-display">Current MVP Status</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                No fake metrics. No synthetic testimonials. Here is exactly what is built and operational in our MVP-1 prototype today.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <div className="text-brand-accent font-mono text-xs mb-4">01 / VOICE AGENT</div>
                <h3 className="text-sm font-bold text-white mb-2 font-display">Realtime RAMS Voice</h3>
                <p className="text-brand-textMuted text-xs leading-relaxed">
                  Low-latency voice-first reasoning engine capable of real-time audio synthesis and adversarial dialogue.
                </p>
              </div>
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <div className="text-brand-accent font-mono text-xs mb-4">02 / SANDBOX</div>
                <h3 className="text-sm font-bold text-white mb-2 font-display">Live Code Sandbox</h3>
                <p className="text-brand-textMuted text-xs leading-relaxed">
                  Isolated execution environment supporting JavaScript/TypeScript AST parsing and runtime state capture.
                </p>
              </div>
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <div className="text-brand-accent font-mono text-xs mb-4">03 / INSPECTION</div>
                <h3 className="text-sm font-bold text-white mb-2 font-display">State Inspection</h3>
                <p className="text-brand-textMuted text-xs leading-relaxed">
                  Automated AST analysis that maps user code structures against known logical and architectural vulnerabilities.
                </p>
              </div>
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <div className="text-brand-accent font-mono text-xs mb-4">04 / LOGGING</div>
                <h3 className="text-sm font-bold text-white mb-2 font-display">Event Trail</h3>
                <p className="text-brand-textMuted text-xs leading-relaxed">
                  Deterministic, typed session logging that captures every cognitive pivot and adversarial challenge.
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 10: Roadmap snapshot */}
        <section id="roadmap" className="py-24 px-6 border-b border-brand-gray bg-brand-black/50 backdrop-blur-md relative">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">08 / DEVELOPMENT PATH</span>
              <h2 className="text-3xl font-light text-white font-display">Roadmap Snapshot</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                Our disciplined engineering path from MVP to local-first cognitive synthesis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ROADMAP.map((phase, idx) => (
                <div
                  key={idx}
                  className={`p-6 border rounded-lg relative ${
                    phase.status === 'current'
                      ? 'border-brand-accent bg-brand-accent/5'
                      : 'border-brand-gray bg-brand-dark/30'
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-mono text-brand-textMuted">{phase.phase}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                      phase.status === 'current' ? 'bg-brand-accent text-black font-bold' :
                      phase.status === 'next' ? 'bg-brand-gray text-white' : 'bg-brand-gray/40 text-brand-textMuted'
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-4 font-display">{phase.title}</h3>
                  <ul className="space-y-3 text-xs font-mono text-brand-textMuted">
                    {phase.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start space-x-2">
                        <span className="text-brand-accent">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* SECTION 11: Who it is for / not for */}
        <section className="py-24 px-6 border-b border-brand-gray bg-brand-dark/50 backdrop-blur-md relative">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <span className="text-xs font-mono text-brand-accent tracking-widest">09 / ALIGNMENT</span>
              <h2 className="text-3xl font-light text-white font-display">Is Soma For You?</h2>
              <p className="text-brand-textMuted text-xs md:text-sm leading-relaxed">
                We are building a highly specific tool for a highly specific mindset. Read carefully before requesting access.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Good Fit */}
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <h3 className="text-sm font-mono text-brand-cyan uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <span>✓</span>
                  <span>A Strong Fit If:</span>
                </h3>
                <ul className="space-y-3 text-xs font-mono text-brand-textMuted">
                  <li>• You are a self-directed software engineer or technical builder.</li>
                  <li>• You value rigorous, first-principles understanding over typing speed.</li>
                  <li>• You want an AI mentor that actively challenges your weak assumptions.</li>
                  <li>• You are willing to struggle with complex problems to achieve mastery.</li>
                </ul>
              </div>

              {/* Not Fit */}
              <div className="p-6 border border-brand-gray bg-brand-black rounded-lg">
                <h3 className="text-sm font-mono text-brand-accent uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <span>✕</span>
                  <span>Not A Fit If:</span>
                </h3>
                <ul className="space-y-3 text-xs font-mono text-brand-textMuted">
                  <li>• You want a passive chatbot to write boilerplate code for you.</li>
                  <li>• You seek instant, agreeable answers without cognitive friction.</li>
                  <li>• You expect a finished, polished enterprise curriculum.</li>
                  <li>• You prioritize output volume over structural comprehension.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>


        {/* SECTION 12: Early access CTA */}
        <section id="cta" className="py-32 px-6 bg-brand-black/50 backdrop-blur-md relative text-center">
          <div className="max-w-2xl mx-auto space-y-8 relative z-10">
            <span className="text-xs font-mono text-brand-accent tracking-widest uppercase">Inquiry Complete</span>
            <h2 className="text-4xl md:text-5xl font-light text-white leading-tight font-display">
              Reclaim Your <span className="font-semibold">Cognitive Autonomy</span>.
            </h2>
            <p className="text-brand-textMuted text-xs md:text-sm max-w-md mx-auto leading-relaxed">
              Join the early access cohort for Soma MVP-1. We admit builders in small, disciplined batches to preserve reasoning quality.
            </p>

            {/* Early Access Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Access request received. Your cognitive profile has been queued.");
              }}
              className="max-w-md mx-auto flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                id="early-access-email"
                aria-label="Engineering email address"
                required
                placeholder="Enter your engineering email..."
                className="flex-grow px-4 py-3 bg-brand-dark border border-brand-gray rounded-lg text-xs font-mono text-white focus:outline-none focus:border-brand-accent"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-black text-xs font-mono font-bold tracking-widest transition-all rounded-lg"
              >
                REQUEST ACCESS
              </button>
            </form>

            <div className="flex justify-center space-x-6 text-xs font-mono text-brand-textMuted pt-4">
              <a href="#sandbox" className="hover:text-white transition-colors">View Demo</a>
              <span>/</span>
              <a href="#sandbox" className="hover:text-white transition-colors">Read Quickstart</a>
              <span>/</span>
              <a href="#roadmap" className="hover:text-white transition-colors">System Architecture</a>
            </div>
          </div>
        </section>

      </main>

      {/* SECTION 13: Footer */}
      <footer className="bg-brand-black border-t border-brand-gray px-6 py-12 text-xs font-mono text-brand-textMuted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 bg-brand-accent rounded-full"></div>
            <span className="text-white font-bold tracking-widest">ORNYX // SOMA</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            <a href="#sandbox" className="hover:text-white transition-colors">Docs</a>
            <a href="#comparison" className="hover:text-white transition-colors">Demo</a>
            <a href="#narrative" className="hover:text-white transition-colors">About</a>
            <a href="mailto:founders@soma.intelligence" className="hover:text-white transition-colors">Contact</a>
            <a href="#narrative" className="hover:text-white transition-colors">Privacy</a>
            <a href="https://github.com/ArchiTecCTT/soma-platform" className="hover:text-white transition-colors">GitHub</a>
          </div>

          <div className="text-right">
            <span>© {new Date().getFullYear()} Ornyx Inc. All rights reserved.</span>
            <br />
            <span className="text-[10px] text-brand-gray">RAMS Engine v1.2.0-beta</span>
          </div>
        </div>
      </footer>

    </div>
  );
}