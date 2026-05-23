export function sanitizeLessonContext(
  metadataStr: string | undefined
): { topic: string; curriculum: string; socraticQuestion?: string } | undefined {
  if (!metadataStr) {
    return undefined;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(metadataStr);
  } catch (err) {
    // Do not throw on malformed metadata
    return undefined;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return undefined;
  }

  if (!('lessonContext' in parsed)) {
    return undefined;
  }

  const lc = parsed.lessonContext;
  if (!lc || typeof lc !== 'object' || Array.isArray(lc)) {
    return undefined;
  }

  // Accept only string topic and curriculum
  if (typeof lc.topic !== 'string' || typeof lc.curriculum !== 'string') {
    return undefined;
  }

  // Reject extra keys or invalid types by ignoring lessonContext
  const allowedKeys = ['topic', 'curriculum', 'socraticQuestion'];
  const actualKeys = Object.keys(lc);
  const hasExtraKeys = actualKeys.some((k) => !allowedKeys.includes(k));
  if (hasExtraKeys) {
    return undefined;
  }

  if ('socraticQuestion' in lc && lc.socraticQuestion !== undefined) {
    if (typeof lc.socraticQuestion !== 'string') {
      return undefined;
    }
  }

  const topic = lc.topic.trim();
  const curriculum = lc.curriculum.trim();
  const socraticQuestion = lc.socraticQuestion ? lc.socraticQuestion.trim() : undefined;

  // Max lengths (topic 256, curriculum 512, socraticQuestion 512)
  if (topic.length > 256 || curriculum.length > 512) {
    return undefined;
  }
  if (socraticQuestion && socraticQuestion.length > 512) {
    return undefined;
  }

  return {
    topic,
    curriculum,
    socraticQuestion: socraticQuestion || undefined,
  };
}
