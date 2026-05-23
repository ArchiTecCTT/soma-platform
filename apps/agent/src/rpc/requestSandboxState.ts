import { ReadSandboxStateRequestSchema, SandboxStateSchema, type ReadSandboxStateRequest, type SandboxState } from '@soma/shared';
import { type JobContext } from '@livekit/agents';

/**
 * Checks if the sandbox state's turnId does not match the expectedTurnId.
 */
export function isStaleSandboxState(expectedTurnId: string, snapshot: SandboxState): boolean {
  return snapshot.turnId !== expectedTurnId;
}

/**
 * Requests the sandbox state from a remote participant (the browser) using the 'read_sandbox_state' RPC method.
 */
export async function requestSandboxState(
  ctx: JobContext,
  participant: { identity: string },
  request: ReadSandboxStateRequest
): Promise<SandboxState> {
  const payload = ReadSandboxStateRequestSchema.parse(request);

  if (!ctx.room.localParticipant) {
    throw new Error('Local participant is not available');
  }

  const response = await ctx.room.localParticipant.performRpc({
    destinationIdentity: participant.identity,
    method: 'read_sandbox_state',
    payload: JSON.stringify(payload),
  });

  let snapshotObj: unknown;
  try {
    snapshotObj = JSON.parse(response);
  } catch (err: any) {
    const ctxError = new Error(
      `Failed to parse sandbox state response for participant '${participant.identity}' turn '${payload.turnId}'`
    );
    ctxError.cause = err;
    throw ctxError;
  }

  let snapshot: SandboxState;
  try {
    snapshot = SandboxStateSchema.parse(snapshotObj);
  } catch (err: any) {
    const ctxError = new Error(
      `Sandbox state validation failed for participant '${participant.identity}' turn '${payload.turnId}'`
    );
    ctxError.cause = err;
    throw ctxError;
  }

  if (isStaleSandboxState(payload.turnId, snapshot)) {
    throw new Error(`Stale sandbox state for turn ${payload.turnId}`);
  }

  return snapshot;
}
