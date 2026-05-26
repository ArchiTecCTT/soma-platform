import { HistoricalBeat, RhetoricalChoice, RoadmapItem } from './types';

export const HISTORICAL_BEATS: HistoricalBeat[] = [
  {
    id: 'standardization',
    title: 'The Standardized Mind',
    era: 'Late 19th Century',
    description: 'Industrialization demanded predictable human components. Education was re-engineered to produce uniform outputs: individuals who could execute identical instructions without variance.',
    metric: '99.8%',
    metricLabel: 'Variance Reduction Target'
  },
  {
    id: 'discipline',
    title: 'The Bell & The Clock',
    era: 'Early 20th Century',
    description: 'Time-blocking and physical containment trained the workforce to respect arbitrary boundaries. Obedience to the schedule superseded the pursuit of deep, uninterrupted synthesis.',
    metric: '45 Min',
    metricLabel: 'Standardized Attention Block'
  },
  {
    id: 'workforce',
    title: 'The Legible Worker',
    era: 'Mid 20th Century',
    description: 'Success was defined by compliance to a pre-written curriculum. Grading systems were designed not to measure understanding, but to filter for administrative legibility.',
    metric: 'A - F',
    metricLabel: 'Linear Compliance Scale'
  }
];

export const RHETORICAL_CHOICE: RhetoricalChoice = {
  id: 'cognitive-trap',
  question: 'You encounter a subtle, undocumented race condition in a production distributed system. What is your immediate instinct?',
  options: [
    {
      key: 'A',
      text: 'Query a standard LLM to generate a quick-fix wrapper.',
      consequence: 'You deploy code you do not fully understand. The symptom is masked, but the underlying architectural flaw remains, waiting to fail under load.',
      isHarmful: true
    },
    {
      key: 'B',
      text: 'Search StackOverflow for a highly-upvoted pattern to copy-paste.',
      consequence: 'You inherit legacy assumptions from a different context. You trade immediate compliance for long-term technical debt.',
      isHarmful: true
    },
    {
      key: 'C',
      text: 'Isolate the state machine, write a deterministic test, and trace the execution path.',
      consequence: 'You choose the path of synthesis. It is slower initially, but it builds genuine technical autonomy and structural understanding.',
      isHarmful: false
    }
  ]
};

export const COMPARISON_DATA = [
  {
    feature: 'Primary Objective',
    soma: 'Rigorous understanding & mental model validation',
    chatbots: 'Instant, frictionless answers & code generation',
    copilots: 'Autocomplete speed & output volume acceleration'
  },
  {
    feature: 'Interaction Style',
    soma: 'Adversarial inquiry (RAMS challenges weak logic)',
    chatbots: 'Passive agreement & sycophantic confirmation',
    copilots: 'Silent execution of user-provided prompts'
  },
  {
    feature: 'State Awareness',
    soma: 'Deep inspection of live sandbox AST & runtime state',
    chatbots: 'Static text context window only',
    copilots: 'Local file buffer & cursor proximity'
  },
  {
    feature: 'Target Audience',
    soma: 'Technical builders seeking mastery',
    chatbots: 'Generalists seeking quick summaries',
    copilots: 'Developers optimizing for typing speed'
  }
];

export const ROADMAP: RoadmapItem[] = [
  {
    phase: 'Phase 01',
    title: 'Now: The Core Engine',
    items: [
      'Realtime RAMS voice & text mentor',
      'Live sandboxed execution environment',
      'AST-level state inspection loop',
      'Deterministic session event logging'
    ],
    status: 'current'
  },
  {
    phase: 'Phase 02',
    title: 'Next: Cognitive Memory',
    items: [
      'Cross-session concept memory tracking',
      'Dynamic mastery mapping',
      'Targeted adversarial challenge queue',
      'Custom sandbox runtime environments'
    ],
    status: 'next'
  },
  {
    phase: 'Phase 03',
    title: 'Later: Local-First Synthesis',
    items: [
      'Local-first offline RAMS execution',
      'Deep IDE integration (VS Code / Cursor)',
      'Multi-agent collaborative debugging layers',
      'Enterprise-grade custom reasoning engines'
    ],
    status: 'later'
  }
];

export const DEFAULT_FLAWED_CODE = `// FLAWED TOKEN BUCKET RATE LIMITER
// RAMS Challenge: Find the race condition and logical flaws.
class RateLimiter {
  constructor(capacity, fillRate) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.lastRefill = Date.now();
    this.fillRate = fillRate; // tokens per millisecond
  }

  allowRequest() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    
    // FLAW 1: Direct assignment without atomic guards
    // FLAW 2: Math precision loss in rapid succession
    this.tokens = Math.min(
      this.capacity, 
      this.tokens + elapsed * this.fillRate
    );
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}`;
