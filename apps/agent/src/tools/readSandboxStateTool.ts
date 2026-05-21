import { llm } from '@livekit/agents';
import { z } from 'zod';
import { SandboxStateSchema } from '@soma/shared';

export const ReadSandboxStateParamsSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  maxChars: z.number().int().positive().max(8000).default(4000),
});

export type ReadSandboxStateParams = z.infer<typeof ReadSandboxStateParamsSchema>;

export function createReadSandboxStateTool(
  requestSandboxState: (args: ReadSandboxStateParams) => Promise<unknown>
) {
  return llm.tool({
    description: 'Read the current browser sandbox state before critiquing code or execution claims.',
    parameters: ReadSandboxStateParamsSchema,
    execute: async (args) => {
      const state = await requestSandboxState(args);
      return JSON.stringify(state);
    },
  });
}
