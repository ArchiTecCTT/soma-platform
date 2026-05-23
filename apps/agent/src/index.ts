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
import { createAzureRealtimeModel, buildTurnHandlingOptions } from './realtime/createAzureRealtimeModel.js';
import { RAMS_SYSTEM_PROMPT } from './rams/systemPrompt.js';
import { PHILOSOPHY_MENTOR_PROMPT } from './rams/philosophyPrompt.js';
import { requestSandboxState } from './rpc/requestSandboxState.js';
import { createReadSandboxStateTool } from './tools/readSandboxStateTool.js';
import { postAgentEvent } from './lib/events.js';
import { sanitizeLessonContext } from './lib/lessonContext.js';

export default defineAgent({
  entry: async (ctx: JobContext) => {
    const env = parseAgentEnv(process.env);
    await ctx.connect();
    const participant = await ctx.waitForParticipant();

    const roomName = ctx.room.name || 'soma-mvp-demo';

    await postAgentEvent(env.API_BASE_URL, {
      sessionId: roomName,
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
        sessionId: args.sessionId,
        turnId: args.turnId,
        maxChars: args.maxChars,
      });
    }, { sessionId: roomName });

    const isPhilosophyMode = env.MENTOR_MODE === 'philosophy';

    // Parse and sanitize participant metadata for lesson context
    const lessonContext = sanitizeLessonContext(participant.metadata);

    let instructions = isPhilosophyMode ? PHILOSOPHY_MENTOR_PROMPT : RAMS_SYSTEM_PROMPT;
    let initialGreeting = isPhilosophyMode
      ? 'Greet the user, explain that you are now in philosophy mentor mode, and invite them to present a philosophical claim or question for examination.'
      : 'Greet the user, explain that they should write a tiny JS function and you will inspect the live sandbox when they make code claims.';

    if (lessonContext) {
      const contextBlock = `
[LESSON CONTEXT]
Topic: ${lessonContext.topic}
Curriculum: ${lessonContext.curriculum}
${lessonContext.socraticQuestion ? `Socratic Question: ${lessonContext.socraticQuestion}` : ''}
`;
      instructions = `${instructions}\n\n${contextBlock}`;
      initialGreeting = isPhilosophyMode
        ? `Greet the user, explain that you are now in philosophy mentor mode. Naturally mention that we are examining the topic "${lessonContext.topic}" from the curriculum. Ask them to address the question: "${lessonContext.socraticQuestion || 'their perspective on this topic'}" to begin.`
        : `Greet the user, welcome them to the session, and explain that you will mentor them on the topic "${lessonContext.topic}". Mention the curriculum "${lessonContext.curriculum}". Explain that they should write a tiny JS function in their sandbox, and you will inspect the live sandbox when they make code claims. Ask them if they are ready to discuss "${lessonContext.topic}".`;
    }

    const agent = new voice.Agent({
      instructions,
      tools: isPhilosophyMode
        ? {}
        : {
            readSandboxState,
          },
    });

    const session = new voice.AgentSession({
      llm: createAzureRealtimeModel(env),
      turnHandling: buildTurnHandlingOptions(env),
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    await session.generateReply({
      instructions: initialGreeting,
    });
  },
});

cli.runApp(new WorkerOptions({
  agent: fileURLToPath(import.meta.url),
}));

