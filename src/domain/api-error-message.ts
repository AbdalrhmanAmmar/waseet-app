// Read only documented message fields; never stringify request data or credentials.
export function apiErrorMessage(data: unknown, fallback: string): string {
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  if (typeof data === 'string') return text(data) || fallback;
  if (!data || typeof data !== 'object') return fallback;
  const body = data as Record<string, unknown>;
  const details: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) details.push(value.trim());
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      const error = value as Record<string, unknown>;
      const description = text(error.description) || text(error.message);
      if (description) details.push(description);
    }
  };
  if (Array.isArray(body.errors)) body.errors.forEach(add);
  else if (body.errors && typeof body.errors === 'object') {
    Object.values(body.errors).forEach((value) =>
      Array.isArray(value) ? value.forEach(add) : add(value),
    );
  }
  const summary =
    text(body.message) || text(body.detail) || (details.length ? '' : text(body.title));
  return [...new Set([summary, ...details].filter(Boolean))].join('\n') || fallback;
}
