/**
 * 本地日期文本工具。
 *
 * <p>`new Date().toISOString()` 返回的是 UTC 时间，在 UTC+8 时区每天 00:00–07:59
 * 取到的是「昨天」，用 `new Date(y, m, 1).toISOString()` 取月份还会在跨月首日退到上月。
 * 需要「用户看到的今天」时一律用这里的本地格式化函数。</p>
 */

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalMonth(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** 在 `yyyy-MM` 上加减月份，纯算术运算，不经过时区转换。 */
export function shiftLocalMonth(monthText: string, delta: number): string {
  const [year, month] = monthText.split('-').map(Number);
  const total = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(total / 12);
  const nextMonth = (total % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}
