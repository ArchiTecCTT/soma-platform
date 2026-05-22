import * as crypto from 'crypto';
import { handoffHeaderSchema, handoffPayloadSchema, type HandoffPayload } from './types';

/**
 * Decodes and verifies a HS256 JWT-like handoff token from Ornyx.
 * Throws an error if validation or signature check fails.
 */
export function verifyHandoffToken(token: string, secret: string): HandoffPayload {
  if (!token) {
    throw new Error('Handoff token is required');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Decode & parse header
  let headerObj: unknown;
  try {
    const headerStr = Buffer.from(headerB64, 'base64url').toString('utf8');
    headerObj = JSON.parse(headerStr);
  } catch (err) {
    throw new Error('Failed to parse token header');
  }

  const header = handoffHeaderSchema.parse(headerObj);

  // 2. Decode & parse payload
  let payloadObj: unknown;
  try {
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payloadObj = JSON.parse(payloadStr);
  } catch (err) {
    throw new Error('Failed to parse token payload');
  }

  const payload = handoffPayloadSchema.parse(payloadObj);

  // 3. Verify signature
  const calculatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();

  let actualSignature: Buffer;
  try {
    actualSignature = Buffer.from(signatureB64, 'base64url');
  } catch (err) {
    throw new Error('Invalid signature encoding');
  }

  if (
    calculatedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(calculatedSignature, actualSignature)
  ) {
    throw new Error('Invalid token signature');
  }

  // 4. Verify expiration
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp < nowInSeconds) {
    throw new Error('Token has expired');
  }

  return payload;
}
