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
  if (event.sessionId.length > 128) {
    throw new Error(`Invalid sessionId: exceeds maximum length of 128 characters`);
  }

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(event.sessionId)) {
    throw new Error(`Invalid sessionId: path traversal or unsafe characters detected`);
  }
  
  // Ensure the directory exists recursively with restrictive permissions (0o700)
  // Note: mode is ignored on Windows but this is best-effort hardening
  await fs.mkdir(eventsDir, { recursive: true, mode: 0o700 });

  const filePath = path.join(eventsDir, `${event.sessionId}.jsonl`);
  const logLine = JSON.stringify(event) + '\n';

  // Append event with restrictive file permissions (0o600)
  // On Windows, mode is ignored but file is created with default ACLs
  await fs.appendFile(filePath, logLine, { encoding: 'utf-8', mode: 0o600 });
  return filePath;
}
