export interface LiveKitTokenData {
  url: string;
  token: string;
}

export interface CurriculumStep {
  step: string;
  title: string;
  description: string;
}

export interface SessionBootstrapResponse {
  topic: string;
  curriculum: CurriculumStep[];
  socraticQuestion?: string;
  roomName: string;
  participantName: string;
  livekit: LiveKitTokenData;
}

/**
 * Sends the handoff token to the API to bootstrap a verified LiveKit session.
 */
export async function bootstrapSession(
  apiBaseUrl: string,
  handoffToken: string
): Promise<SessionBootstrapResponse> {
  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${normalizedBase}/handoff/bootstrap`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ handoff: handoffToken }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Handoff bootstrap failed with status: ${response.status}`);
  }

  return response.json();
}
