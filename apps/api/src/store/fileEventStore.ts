import { promises as fs } from 'fs';
import * as path from 'path';
import { SessionEvent, SessionEventSchema } from '@soma/shared';

export async function appendSessionEvent(
  eventsDir: string,
  rawEvent: SessionEvent
): Promise<string> {
  // Parse event to validate it conform to SessionEventSchema
  const event = SessionEventSchema.parse(rawEvent);

  // Validate and sanitize sessionId to prevent directory/path traversal
  // Strict regex: letters, numbers, underscore, hyphen, dot only
  if (!/^[a-zA-Z0-9_\-\.]+$/.test(event.sessionId)) {
    throw new Error(`Invalid sessionId: path traversal or unsafe characters detected`);
  }
  
  // Ensure the directory exists recursively
  await fs.mkdir(eventsDir, { recursive: true });

  const filePath = path.join(eventsDir, `${event.sessionId}.jsonl`);
  const logLine = JSON.stringify(event) + '\n';

  await fs.appendFile(filePath, logLine, 'utf-8');
  return filePath;
}
