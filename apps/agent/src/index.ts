import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Map shared config schema to LiveKit Agent CLI expected keys
if (process.env.LIVEKIT_WS_URL && !process.env.LIVEKIT_URL) {
  process.env.LIVEKIT_URL = process.env.LIVEKIT_WS_URL;
}

import { cli, defineAgent, voice, WorkerOptions, type JobContext } from '@livekit/agents';
import { parseAgentEnv } from './env.js';
import { createAzureRealtimeModel } from './realtime/createAzureRealtimeModel.js';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt.js';
import { PHILOSOPHY_MENTOR_PROMPT } from './rams/philosophyPrompt.js';
import { createTurnId } from '@soma/shared';
import { requestSandboxState } from './rpc/requestSandboxState.js';
import { createReadSandboxStateTool } from './tools/readSandboxStateTool.js';
import { postAgentEvent } from './lib/events.js';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);
    await ctx.connect();
    const participant = await ctx.waitForParticipant();

    await postAgentEvent(env.API_BASE_URL, {
      sessionId: ctx.room.name || 'soma-mvp-demo',
      kind: 'session.lifecycle',
      payload: {
        action: 'agent-joined',
        participant: participant.identity,
      },
      createdAt: new Date().toISOString(),
    }).catch((err) => {
      console.error('Failed to post agent-joined event:', err);
    });

    const readSandboxState = createReadSandboxStateTool(async (args) => {
      return requestSandboxState(ctx, participant, {
        sessionId: ctx.room.name || 'soma-mvp-demo',
        turnId: args.turnId || createTurnId(),
        maxChars: args.maxChars,
      });
    });

    const isPhilosophyMode = env.MENTOR_MODE === 'philosophy';

    const agent = new voice.Agent({
      instructions: isPhilosophyMode ? PHILOSOPHY_MENTOR_PROMPT : RAMS_SYSTEM_PROMPT,
      tools: isPhilosophyMode
        ? {}
        : {
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
      instructions: isPhilosophyMode
        ? 'Greet the user, explain that you are now in philosophy mentor mode, and invite them to present a philosophical claim or question for examination.'
        : 'Greet the user, explain that they should write a tiny JS function and you will inspect the live sandbox when they make code claims.',
    });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));

