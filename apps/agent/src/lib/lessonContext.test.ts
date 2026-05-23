import { describe, expect, it } from 'vitest';
import { sanitizeLessonContext } from './lessonContext';

describe('sanitizeLessonContext', () => {
  it('accepts valid lessonContext and trims whitespace', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: '  Rust Programming  ',
        curriculum: 'Learn about ownership and borrowing.  ',
        socraticQuestion: '  What is a reference? ',
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toEqual({
      topic: 'Rust Programming',
      curriculum: 'Learn about ownership and borrowing.',
      socraticQuestion: 'What is a reference?',
    });
  });

  it('accepts valid lessonContext without optional socraticQuestion', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 'Rust Programming',
        curriculum: 'Learn about ownership and borrowing.',
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toEqual({
      topic: 'Rust Programming',
      curriculum: 'Learn about ownership and borrowing.',
      socraticQuestion: undefined,
    });
  });

  it('rejects lessonContext if topic is longer than 256 characters', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 'A'.repeat(257),
        curriculum: 'Valid curriculum',
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toBeUndefined();
  });

  it('rejects lessonContext if curriculum is longer than 512 characters', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 'Valid topic',
        curriculum: 'B'.repeat(513),
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toBeUndefined();
  });

  it('rejects lessonContext if socraticQuestion is longer than 512 characters', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 'Valid topic',
        curriculum: 'Valid curriculum',
        socraticQuestion: 'C'.repeat(513),
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toBeUndefined();
  });

  it('rejects lessonContext with extra keys', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 'Valid topic',
        curriculum: 'Valid curriculum',
        extraKey: 'not allowed',
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toBeUndefined();
  });

  it('rejects lessonContext with invalid types', () => {
    const metadata = JSON.stringify({
      lessonContext: {
        topic: 123, // should be string
        curriculum: 'Valid curriculum',
      },
    });

    const result = sanitizeLessonContext(metadata);
    expect(result).toBeUndefined();
  });

  it('ignores invalid JSON/malformed metadata without throwing', () => {
    const result = sanitizeLessonContext('{ invalid json');
    expect(result).toBeUndefined();
  });

  it('returns undefined if lessonContext is missing', () => {
    const result = sanitizeLessonContext(JSON.stringify({ otherKey: 'val' }));
    expect(result).toBeUndefined();
  });
});
