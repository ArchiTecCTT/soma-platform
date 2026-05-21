import { z } from 'zod';

export const RawSessionEventSchema = z.object({
  sessionId: z.string().min(1),
  timestamp: z.string().datetime(),
  type: z.string(),
  payload: z.unknown().default({}),
});

export const SessionEventSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1).optional(),
  kind: z.enum([
    'session.lifecycle',
    'user.message',
    'agent.message',
    'sandbox.run',
    'sandbox.snapshot',
    'rpc.request',
    'rpc.response',
  ]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

export type RawSessionEvent = z.infer<typeof RawSessionEventSchema>;
export type SessionEvent = z.infer<typeof SessionEventSchema>;