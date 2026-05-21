import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { cli, defineAgent, voice, WorkerOptions, type JobContext } from '@livekit/agents';
import { parseAgentEnv } from './env.js';
import { createAzureRealtimeModel } from './realtime/createAzureRealtimeModel.js';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt.js';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);
    await ctx.connect();
    await ctx.waitForParticipant();

    const agent = new voice.Agent({
      instructions: RAMS_SYSTEM_PROMPT,
    });

    const session = new voice.AgentSession({
      llm: createAzureRealtimeModel(env),
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: 'Greet the user, explain that you will challenge their reasoning, and ask them to implement a tiny JavaScript function.',
    });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));
