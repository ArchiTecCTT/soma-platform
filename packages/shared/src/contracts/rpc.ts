import { z } from 'zod';

export const SandboxFileSchema = z.object({
  path: z.string().min(1),
  content: z.string(),
});

export const SandboxStateSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1).optional(),
  activeFilePath: z.string().min(1).optional(),
  files: z.array(SandboxFileSchema).default([]),
  stdoutTail: z.string().default(''),
  stderrTail: z.string().default(''),
  lastCommand: z.string().optional(),
  exitCode: z.number().int().nullable().optional(),
  status: z.enum(['idle', 'running', 'completed', 'failed']),
  capturedAt: z.string().datetime(),
});

export const ReadSandboxStateRequestSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  maxChars: z.number().int().positive().max(8000).default(4000),
});

// RPC method constants
export const RPC_METHODS = {
  SANDBOX_GET_STATE: 'sandbox.getState',
  SANDBOX_RUN_COMMAND: 'sandbox.runCommand',
} as const;

export type SandboxState = z.infer<typeof SandboxStateSchema>;
export type ReadSandboxStateRequest = z.infer<typeof ReadSandboxStateRequestSchema>;
export type SandboxFile = z.infer<typeof SandboxFileSchema>;