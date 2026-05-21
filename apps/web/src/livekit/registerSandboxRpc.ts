import { Room } from 'livekit-client';
import { SandboxClient } from '../sandbox/client';
import { ReadSandboxStateRequestSchema } from '@soma/shared';

/**
 * Registers the 'read_sandbox_state' RPC method on the local participant in the Room.
 */
export function registerSandboxRpc(room: Room, sandbox: SandboxClient) {
  if (!room.localParticipant) {
    throw new Error('Local participant is not available in the room.');
  }

  room.localParticipant.registerRpcMethod('read_sandbox_state', async (invocation) => {
    try {
      const payloadObj = JSON.parse(invocation.payload);
      const parsed = ReadSandboxStateRequestSchema.parse(payloadObj);
      
      const snapshot = sandbox.snapshot(parsed);
      return JSON.stringify(snapshot);
    } catch (error) {
      console.error('Error handling read_sandbox_state RPC method:', error);
      throw error;
    }
  });
}
