import { llm } from '@livekit/agents';
import { z } from 'zod';
import { SandboxStateSchema } from '@soma/shared';

export const ReadSandboxStateParamsSchema = z.object({
  maxChars: z.number().min(1).max(8000).optional(),
});

export type ReadSandboxStateToolParams = z.infer<typeof ReadSandboxStateParamsSchema>;
export interface ReadSandboxStateParams extends ReadSandboxStateToolParams {
  sessionId: string;
  turnId: string;
  maxChars: number;
}

export function createReadSandboxStateTool(
  requestSandboxState: (args: ReadSandboxStateParams) => Promise<unknown>
) {
  return llm.tool({
    description: 'Read the current browser sandbox state before critiquing code or execution claims.',
    parameters: ReadSandboxStateParamsSchema,
    execute: async (args: ReadSandboxStateToolParams) => {
      const state = await requestSandboxState({
        sessionId: '',
        turnId: crypto.randomUUID(),
        maxChars: args.maxChars ?? 4000,
      });
      return JSON.stringify(state);
    },
  });
}
