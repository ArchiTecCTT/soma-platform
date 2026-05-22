import { z } from 'zod';

export const handoffHeaderSchema = z.object({
  alg: z.literal('HS256'),
  typ: z.literal('JWT'),
});

export type HandoffHeader = z.infer<typeof handoffHeaderSchema>;

export const handoffCurriculumStepSchema = z.object({
  step: z.string().min(1).max(32),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1200),
});

export type HandoffCurriculumStep = z.infer<typeof handoffCurriculumStepSchema>;

export const handoffPayloadSchema = z.object({
  iss: z.literal('ornyx-landing-page'),
  aud: z.literal('soma-rams-mentor'),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  jti: z.string().min(1).max(128),
  topic: z.string().min(1).max(500),
  curriculum: z.array(handoffCurriculumStepSchema).min(1).max(50),
  socraticQuestion: z.string().min(1).max(1500).optional(),
});

export type HandoffPayload = z.infer<typeof handoffPayloadSchema>;

export const handoffRequestSchema = z.object({
  handoff: z.string().min(1),
});

export type HandoffRequest = z.infer<typeof handoffRequestSchema>;

export interface LiveKitTokenData {
  url: string;
  token: string;
}

export interface SessionBootstrapResponse {
  topic: string;
  curriculum: HandoffCurriculumStep[];
  socraticQuestion?: string;
  roomName: string;
  participantName: string;
  livekit: LiveKitTokenData;
}
