export interface HistoricalBeat {
  id: string;
  title: string;
  era: string;
  description: string;
  metric: string;
  metricLabel: string;
}

export interface RhetoricalChoice {
  id: string;
  question: string;
  options: {
    key: string;
    text: string;
    consequence: string;
    isHarmful: boolean;
  }[];
}

export interface EventLog {
  timestamp: string;
  type: 'SYSTEM' | 'RAMS_INSPECT' | 'RAMS_CHALLENGE' | 'USER_INPUT' | 'ERROR';
  message: string;
}

export interface ChatMessage {
  sender: 'user' | 'rams';
  text: string;
  timestamp: string;
}

export interface RoadmapItem {
  phase: string;
  title: string;
  items: string[];
  status: 'current' | 'next' | 'later';
}

export interface ComparisonRow {
  feature: string;
  soma: string;
  chatbots: string;
  copilots: string;
}
