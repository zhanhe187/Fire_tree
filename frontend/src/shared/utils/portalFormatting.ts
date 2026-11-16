export function formatChinaDate(value?: string) {
  if (!value) return '日期待定';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatChinaDateTime(value?: string) {
  if (!value) return '时间待定';
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateBadge(value?: string) {
  if (!value) {
    return {
      day: '--',
      month: '待定',
      year: '',
    };
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return {
      day: '--',
      month: value,
      year: '',
    };
  }

  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: `${date.getMonth() + 1}月`,
    year: String(date.getFullYear()),
  };
}

export function excerptText(value?: string, limit = 96) {
  const source = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!source) return '';
  return source.length > limit ? `${source.slice(0, limit)}...` : source;
}

export function joinPresent(parts: Array<string | number | null | undefined>, separator = ' / ') {
  return parts
    .map((part) => (part === null || part === undefined ? '' : String(part).trim()))
    .filter(Boolean)
    .join(separator);
}
