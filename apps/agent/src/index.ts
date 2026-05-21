import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { cli, defineAgent, voice, WorkerOptions, type JobContext } from '@livekit/agents';
import { parseAgentEnv } from './env.js';
import { createAzureRealtimeModel } from './realtime/createAzureRealtimeModel.js';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt.js';
import { createTurnId } from '@soma/shared';
import { requestSandboxState } from './rpc/requestSandboxState.js';
import { createReadSandboxStateTool } from './tools/readSandboxStateTool.js';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);
    await ctx.connect();
    const participant = await ctx.waitForParticipant();

    const readSandboxState = createReadSandboxStateTool(async (args) => {
      return requestSandboxState(ctx, participant, {
        ...args,
        turnId: args.turnId || createTurnId(),
      });
    });

    const agent = new voice.Agent({
      instructions: RAMS_SYSTEM_PROMPT,
      tools: {
        readSandboxState,
      },
    });

    const session = new voice.AgentSession({
      llm: createAzureRealtimeModel(env),
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: 'Greet the user, explain that they should write a tiny JS function and you will inspect the live sandbox when they make code claims.',
    });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));
