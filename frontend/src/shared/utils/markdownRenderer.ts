function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderCodeBlock(code: string, language?: string) {
  const escaped = escapeHtml(code);
  const langClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  return `<pre><code${langClass}>${escaped}</code></pre>`;
}

function parseTableLines(lines: string[]): string | null {
  if (lines.length < 2) return null;
  const headerCells = lines[0].split('|').map((cell) => cell.trim()).filter(Boolean);
  const separatorCells = lines[1].split('|').map((cell) => cell.trim()).filter(Boolean);
  if (separatorCells.some((cell) => !/^[-:]+$/.test(cell.replace(/\s/g, '')))) return null;
  if (headerCells.length !== separatorCells.length) return null;

  const renderRow = (cells: string[], tag: string) => {
    const validCells = cells.slice(0, headerCells.length);
    while (validCells.length < headerCells.length) validCells.push('');
    return `<tr>${validCells.map((cell) => `<${tag}>${inlineMarkdown(cell.trim())}</${tag}>`).join('')}</tr>`;
  };

  const bodyRows = lines.slice(2)
    .filter((line) => line.trim())
    .map((line) => line.split('|').map((cell) => cell.trim()));

  return `<table class="markdown-table"><thead>${renderRow(headerCells, 'th')}</thead><tbody>${bodyRows.map((row) => renderRow(row, 'td')).join('')}</tbody></table>`;
}

export function renderMarkdown(markdown?: string) {
  const source = markdown?.trim() ?? '';
  if (!source) return '';

  const blocks: string[] = [];
  const lines = source.split(/\r?\n/);
  let paragraph: string[] = [];
  let list: string[] = [];
  let orderedList: string[] = [];
  let blockquote: string[] = [];
  let codeBlockLines: string[] = [];
  let codeBlockLanguage = '';
  let tableLines: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join('<br />'))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  const flushOrderedList = () => {
    if (!orderedList.length) return;
    blocks.push(`<ol>${orderedList.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
    orderedList = [];
  };

  const flushBlockquote = () => {
    if (!blockquote.length) return;
    blocks.push(`<blockquote>${blockquote.map((item) => `<p>${inlineMarkdown(item)}</p>`).join('')}</blockquote>`);
    blockquote = [];
  };

  const flushCodeBlock = () => {
    if (!codeBlockLines.length) return;
    blocks.push(renderCodeBlock(codeBlockLines.join('\n'), codeBlockLanguage));
    codeBlockLines = [];
    codeBlockLanguage = '';
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines = [];
      return;
    }
    const table = parseTableLines(tableLines);
    if (table) {
      blocks.push(table);
    } else {
      paragraph.push(...tableLines);
    }
    tableLines = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
    flushOrderedList();
    flushBlockquote();
    flushCodeBlock();
    flushTable();
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (codeBlockLines.length || /^```/.test(rawLine)) {
      const fence = /^```(\w*)/.exec(rawLine);
      if (codeBlockLines.length === 0 && fence) {
        codeBlockLanguage = fence[1] || '';
        continue;
      }
      if (codeBlockLines.length > 0 && /^```$/.test(rawLine.trim())) {
        flushCodeBlock();
        continue;
      }
      codeBlockLines.push(rawLine);
      continue;
    }

    if (!line) {
      flushAll();
      continue;
    }

    if (line.includes('|')) {
      tableLines.push(line);
      continue;
    } else if (tableLines.length) {
      flushTable();
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length + 2;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const quote = /^>\s+(.+)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      flushOrderedList();
      blockquote.push(quote[1]);
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushOrderedList();
      flushBlockquote();
      list.push(bullet[1]);
      continue;
    }
    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushList();
      flushBlockquote();
      orderedList.push(ordered[1]);
      continue;
    }
    flushList();
    flushOrderedList();
    flushBlockquote();
    paragraph.push(line);
  }

  flushAll();
  return blocks.join('');
}
