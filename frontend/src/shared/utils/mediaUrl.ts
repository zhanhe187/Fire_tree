export function resolveMediaUrl(value?: string) {
  const normalized = value?.trim().replace(/\\/g, '/') ?? '';
  if (!normalized) return '';
  if (/^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(normalized) || normalized.startsWith('data:') || normalized.startsWith('blob:')) {
    return normalized;
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
