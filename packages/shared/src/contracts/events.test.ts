import { describe, expect, it } from 'vitest';
import { RawSessionEventSchema, SessionEventSchema } from './events';

describe('RawSessionEventSchema', () => {
  it('accepts non-empty type', () => {
    const valid = {
      sessionId: 'session-1',
      timestamp: new Date().toISOString(),
      type: 'test-event-type',
      payload: { foo: 'bar' },
    };
    expect(RawSessionEventSchema.parse(valid)).toEqual(valid);
  });

  it('rejects empty raw event type', () => {
    const invalid = {
      sessionId: 'session-1',
      timestamp: new Date().toISOString(),
      type: '',
      payload: { foo: 'bar' },
    };
    expect(() => RawSessionEventSchema.parse(invalid)).toThrow();
  });
});
