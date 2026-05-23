import { useEffect, useState } from 'react';
import { bootstrapSession, type SessionBootstrapResponse } from '../lib/handoff';

export function useHandoffBootstrap(apiBaseUrl: string) {
  const [bootstrapData, setBootstrapData] = useState<SessionBootstrapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const handoffToken = params.get('handoff');

    if (!handoffToken) return;

    const doBootstrap = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await bootstrapSession(apiBaseUrl, handoffToken);
        setBootstrapData(data);

        // Clean URL after success: remove only handoff query param, preserving others and hash
        const urlObj = new URL(window.location.href);
        urlObj.searchParams.delete('handoff');
        const cleanUrl = urlObj.pathname + urlObj.search + urlObj.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (err: any) {
        console.error('Handoff bootstrap error:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    void doBootstrap();
  }, [apiBaseUrl]);

  return { bootstrapData, isLoading, error };
}
