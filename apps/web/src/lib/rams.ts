import { csrfHeader } from './csrf';

export interface AnalyzeSandboxInput {
  code: string;
  explanation: string;
}

export interface AnalyzeSandboxResponse {
  critique: string;
}

export async function analyzeSandbox(
  apiBaseUrl: string,
  input: AnalyzeSandboxInput
): Promise<AnalyzeSandboxResponse> {
  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const url = `${normalizedBase}/rams/analyze`;

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeader(),
    },
    body: JSON.stringify(input),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = typeof payload?.error === 'string' ? payload.error : `RAMS analyze failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}