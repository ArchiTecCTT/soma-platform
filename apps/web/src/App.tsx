import React from 'react';
import { VoiceSessionShell } from './components/VoiceSessionShell';

export default function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

  return (
    <div>
      <VoiceSessionShell apiBaseUrl={apiBaseUrl} />
    </div>
  );
}
