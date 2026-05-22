import { type ApiEnv } from '@soma/shared';
import { type HandoffPayload, type SessionBootstrapResponse, type HandoffCurriculumStep } from './types';
import { createLiveKitJoinToken } from '../livekit-token';

function truncate(value: string | undefined, maxChars: number): string | undefined {
  if (!value) return undefined;
  return value.length > maxChars ? `${value.slice(0, Math.max(0, maxChars - 1))}…` : value;
}

function formatCurriculumForMetadata(curriculum: HandoffCurriculumStep[]): string {
  const outline = curriculum
    .slice(0, 6)
    .map((step) => `${step.step}. ${truncate(step.title, 80)}: ${truncate(step.description, 80)}`)
    .join('\n');

  const suffix = curriculum.length > 6 ? `\n…${curriculum.length - 6} more steps` : '';
  return truncate(`${outline}${suffix}`, 500) ?? '';
}

export async function createSessionBootstrap(
  env: ApiEnv,
  payload: HandoffPayload
): Promise<SessionBootstrapResponse> {
  const roomName = `room-${payload.jti}`;
  // Use a predictable / friendly student format
  const participantName = `student-${crypto.randomUUID().slice(0, 8)}`;

  // Include lesson context in participant metadata
  const lessonContext = {
    topic: truncate(payload.topic, 180) ?? payload.topic,
    curriculum: formatCurriculumForMetadata(payload.curriculum),
    socraticQuestion: truncate(payload.socraticQuestion, 200),
  };

  const metadata = JSON.stringify({ lessonContext });

  const livekitData = await createLiveKitJoinToken(env, roomName, participantName, {
    metadata,
  });

  return {
    topic: payload.topic,
    curriculum: payload.curriculum,
    socraticQuestion: payload.socraticQuestion,
    roomName,
    participantName,
    livekit: {
      url: livekitData.wsUrl,
      token: livekitData.token,
    },
  };
}
