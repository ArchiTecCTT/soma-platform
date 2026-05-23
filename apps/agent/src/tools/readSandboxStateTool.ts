import { llm } from '@livekit/agents';
import { z } from 'zod';
import { createTurnId, SandboxStateSchema, type SandboxState } from '@soma/shared';

export const ReadSandboxStateParamsSchema = z.object({
  maxChars: z.coerce.number().int().positive().max(8000).optional(),
});

export type ReadSandboxStateToolParams = z.infer<typeof ReadSandboxStateParamsSchema>;
export interface ReadSandboxStateParams extends ReadSandboxStateToolParams {
  sessionId: string;
  turnId: string;
  maxChars: number;
}

export function createReadSandboxStateTool(
  requestSandboxState: (args: ReadSandboxStateParams) => Promise<SandboxState>,
  options: { sessionId: string }
) {
  return llm.tool({
    description: 'Read the current browser sandbox state before critiquing code or execution claims.',
    parameters: ReadSandboxStateParamsSchema,
    execute: async (args: ReadSandboxStateToolParams) => {
      const state = await requestSandboxState({
        sessionId: options.sessionId,
        turnId: createTurnId(),
        maxChars: args.maxChars ?? 4000,
      });
      const parsedState = SandboxStateSchema.parse(state);
      return JSON.stringify(parsedState);
    },
  });
}
