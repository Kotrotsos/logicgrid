import { PuzzleData, Category, GridState, GridSettings, DEFAULT_GRID_SETTINGS } from '../types';

// --- Download Helper ---

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Markdown Generation ---

export function generateMarkdown(puzzle: PuzzleData): string {
  const lines: string[] = [];

  lines.push(`# ${puzzle.title}`);
  lines.push('');
  lines.push(puzzle.story);
  lines.push('');
  lines.push(`> ${puzzle.goal}`);
  lines.push('');
  lines.push('## Clues');
  lines.push('');
  puzzle.clues.forEach((clue, i) => {
    lines.push(`${i + 1}. ${clue}`);
  });
  lines.push('');
  lines.push('## Categories');
  lines.push('');
  lines.push('| Category | Items |');
  lines.push('|----------|-------|');
  puzzle.categories.forEach(cat => {
    lines.push(`| ${cat.name} | ${cat.items.join(', ')} |`);
  });
  lines.push('');

  return lines.join('\n');
}

// --- L-Shape Layout (duplicated from LogicGrid.tsx to avoid coupling) ---

interface SubGridBlock {
  blockRow: number;
  blockCol: number;
  leftCat: Category;
  topCat: Category;
}

function computeLShapeLayout(categories: Category[]) {
  const n = categories.length;
  const topCats = categories.slice(1);
  const blockColCount = n - 1;

  const leftCats: Category[] = [categories[0]];
  for (let i = n - 1; i >= 2; i--) {
    leftCats.push(categories[i]);
  }
  const blockRowCount = leftCats.length;

  const blocks: SubGridBlock[] = [];
  for (let r = 0; r < blockRowCount; r++) {
    const colsInRow = blockColCount - r;
    for (let c = 0; c < colsInRow; c++) {
      blocks.push({
        blockRow: r,
        blockCol: c,
        leftCat: leftCats[r],
        topCat: topCats[c],
      });
    }
  }

  return { blocks, blockRowCount, blockColCount, leftCats, topCats };
}

// --- SVG Generation ---

function measureText(text: string, font: string): number {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return text.length * 7;
  ctx.font = font;
  return ctx.measureText(text).width;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSVG(
  categories: Category[],
  gridState: GridState,
  settings: GridSettings = DEFAULT_GRID_SETTINGS,
): string {
  const { borderThickness, showLogo, backgroundColor, cellColor, headerColor, borderColor, cellBorderColor } = settings;

  const ITEM_COUNT = categories[0].items.length;
  const HEADER_HEIGHT = 40;
  const BOLD_FONT = 'bold 11px Inter, sans-serif';

  const layout = computeLShapeLayout(categories);
  const { blocks, blockRowCount, blockColCount, leftCats, topCats } = layout;

  const leftCatLabelWidth = 32;
  const allLeftItems = leftCats.flatMap(c => c.items);
  const maxLeftItemWidth = Math.max(...allLeftItems.map(item => measureText(item, BOLD_FONT)));
  const LABEL_SIZE = Math.max(150, leftCatLabelWidth + maxLeftItemWidth + 28);

  const allTopItems = topCats.flatMap(c => c.items);
  const maxTopItemWidth = Math.max(...allTopItems.map(item => measureText(item, BOLD_FONT)));
  const TOP_LABEL_HEIGHT = Math.max(120, maxTopItemWidth + 24);

  const CELL_SIZE = Math.max(34, Math.ceil(maxLeftItemWidth / 5));
  const GROUP_SIZE = CELL_SIZE * ITEM_COUNT;

  const bt = borderThickness;
  const PAD = Math.ceil(bt / 2);

  const CONTENT_WIDTH = 2 * PAD + LABEL_SIZE + (blockColCount * GROUP_SIZE);
  const CONTENT_HEIGHT = 2 * PAD + HEADER_HEIGHT + TOP_LABEL_HEIGHT + (blockRowCount * GROUP_SIZE);

  const gridOffsetX = PAD + LABEL_SIZE;
  const gridOffsetY = PAD + HEADER_HEIGHT + TOP_LABEL_HEIGHT;

  const els: string[] = [];

  els.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CONTENT_WIDTH} ${CONTENT_HEIGHT}" width="${CONTENT_WIDTH}" height="${CONTENT_HEIGHT}" font-family="Inter, sans-serif">`);

  // 1. Background
  els.push(`<rect x="0" y="0" width="${CONTENT_WIDTH}" height="${CONTENT_HEIGHT}" fill="${backgroundColor}"/>`);

  // 2. Logo box (conditional)
  if (showLogo) {
    els.push(`<rect x="${PAD}" y="${PAD}" width="${LABEL_SIZE}" height="${HEADER_HEIGHT}" fill="#10221a"/>`);
    els.push(`<text x="${PAD + LABEL_SIZE / 2}" y="${PAD + HEADER_HEIGHT / 2}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="12" font-weight="bold">LOGICGRID</text>`);
  } else {
    els.push(`<rect x="${PAD}" y="${PAD}" width="${LABEL_SIZE}" height="${HEADER_HEIGHT}" fill="${backgroundColor}"/>`);
  }

  // 3. Blank area below logo
  els.push(`<rect x="${PAD}" y="${PAD + HEADER_HEIGHT}" width="${LABEL_SIZE}" height="${TOP_LABEL_HEIGHT}" fill="${backgroundColor}"/>`);

  // 4. Top category headers
  topCats.forEach((cat, i) => {
    const x = gridOffsetX + i * GROUP_SIZE;
    els.push(`<rect x="${x}" y="${PAD}" width="${GROUP_SIZE}" height="${HEADER_HEIGHT}" fill="${headerColor}"/>`);
    els.push(`<rect x="${x}" y="${PAD}" width="${GROUP_SIZE}" height="${HEADER_HEIGHT}" fill="none" stroke="${borderColor}" stroke-width="${bt}"/>`);
    els.push(`<text x="${x + GROUP_SIZE / 2}" y="${PAD + HEADER_HEIGHT / 2}" text-anchor="middle" dominant-baseline="central" fill="#334155" font-size="12" font-weight="bold">${escapeXml(cat.name.toUpperCase())}</text>`);
  });

  // 5. Top item labels (rotated)
  topCats.forEach((cat, catIdx) => {
    cat.items.forEach((item, itemIdx) => {
      const colIndex = catIdx * ITEM_COUNT + itemIdx;
      const x = gridOffsetX + colIndex * CELL_SIZE;
      const y = PAD + HEADER_HEIGHT;

      els.push(`<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${TOP_LABEL_HEIGHT}" fill="${cellColor}"/>`);

      const tx = x + CELL_SIZE / 2;
      const ty = y + TOP_LABEL_HEIGHT - 12;
      els.push(`<text transform="rotate(-90 ${tx} ${ty})" x="${tx}" y="${ty}" text-anchor="start" dominant-baseline="central" fill="#475569" font-size="11" font-weight="bold">${escapeXml(item)}</text>`);

      els.push(`<line x1="${x + CELL_SIZE}" y1="${y}" x2="${x + CELL_SIZE}" y2="${y + TOP_LABEL_HEIGHT}" stroke="${cellBorderColor}" stroke-width="1"/>`);
    });

    const groupX = gridOffsetX + catIdx * GROUP_SIZE;
    els.push(`<rect x="${groupX}" y="${PAD + HEADER_HEIGHT}" width="${GROUP_SIZE}" height="${TOP_LABEL_HEIGHT}" fill="none" stroke="${borderColor}" stroke-width="${bt}"/>`);
  });

  // 6. Left category headers + item labels
  leftCats.forEach((cat, catIdx) => {
    const catY = gridOffsetY + catIdx * GROUP_SIZE;
    const colsInRow = blockColCount - catIdx;
    if (colsInRow <= 0) return;

    els.push(`<rect x="${PAD}" y="${catY}" width="${leftCatLabelWidth}" height="${GROUP_SIZE}" fill="${headerColor}"/>`);

    const cx = PAD + leftCatLabelWidth / 2;
    const cy = catY + GROUP_SIZE / 2;
    els.push(`<text transform="rotate(-90 ${cx} ${cy})" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-size="11" font-weight="bold">${escapeXml(cat.name.toUpperCase())}</text>`);

    els.push(`<rect x="${PAD}" y="${catY}" width="${leftCatLabelWidth}" height="${GROUP_SIZE}" fill="none" stroke="${borderColor}" stroke-width="${bt}"/>`);

    const svgItemX = PAD + leftCatLabelWidth;
    const svgItemWidth = LABEL_SIZE - leftCatLabelWidth;
    cat.items.forEach((item, itemIdx) => {
      const itemY = catY + itemIdx * CELL_SIZE;

      els.push(`<rect x="${svgItemX}" y="${itemY}" width="${svgItemWidth}" height="${CELL_SIZE}" fill="${cellColor}"/>`);
      els.push(`<text x="${svgItemX + svgItemWidth - 12}" y="${itemY + CELL_SIZE / 2}" text-anchor="end" dominant-baseline="central" fill="#475569" font-size="11" font-weight="bold">${escapeXml(item)}</text>`);
      els.push(`<line x1="${svgItemX}" y1="${itemY + CELL_SIZE}" x2="${svgItemX + svgItemWidth}" y2="${itemY + CELL_SIZE}" stroke="${cellBorderColor}" stroke-width="1"/>`);
    });

    els.push(`<rect x="${svgItemX}" y="${catY}" width="${svgItemWidth}" height="${GROUP_SIZE}" fill="none" stroke="${borderColor}" stroke-width="${bt}"/>`);
  });

  // 7. Sub-grid blocks
  for (const block of blocks) {
    const blockX = gridOffsetX + block.blockCol * GROUP_SIZE;
    const blockY = gridOffsetY + block.blockRow * GROUP_SIZE;

    els.push(`<rect x="${blockX}" y="${blockY}" width="${GROUP_SIZE}" height="${GROUP_SIZE}" fill="${cellColor}"/>`);

    for (let cr = 0; cr < ITEM_COUNT; cr++) {
      for (let cc = 0; cc < ITEM_COUNT; cc++) {
        const x = blockX + cc * CELL_SIZE;
        const y = blockY + cr * CELL_SIZE;

        els.push(`<rect x="${x}" y="${y}" width="${CELL_SIZE}" height="${CELL_SIZE}" fill="none" stroke="${cellBorderColor}" stroke-width="1"/>`);

        const leftItem = block.leftCat.items[cr];
        const topItem = block.topCat.items[cc];
        const keys = [`${block.leftCat.name}:${leftItem}`, `${block.topCat.name}:${topItem}`].sort();
        const key = keys.join('|');
        const val = gridState[key];

        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;

        if (val === 'true') {
          els.push(`<circle cx="${cx}" cy="${cy}" r="${CELL_SIZE * 0.25}" fill="none" stroke="#2bee9d" stroke-width="2.5"/>`);
          els.push(`<circle cx="${cx}" cy="${cy}" r="${CELL_SIZE * 0.12}" fill="#2bee9d"/>`);
        } else if (val === 'false') {
          const size = CELL_SIZE * 0.2;
          els.push(`<line x1="${cx - size}" y1="${cy - size}" x2="${cx + size}" y2="${cy + size}" stroke="#ef4444" stroke-width="3"/>`);
          els.push(`<line x1="${cx + size}" y1="${cy - size}" x2="${cx - size}" y2="${cy + size}" stroke="#ef4444" stroke-width="3"/>`);
        }
      }
    }

    els.push(`<rect x="${blockX}" y="${blockY}" width="${GROUP_SIZE}" height="${GROUP_SIZE}" fill="none" stroke="${borderColor}" stroke-width="${bt}"/>`);
  }

  els.push('</svg>');
  return els.join('\n');
}

// --- Export Entry Point ---

export function exportPuzzle(puzzle: PuzzleData, gridState: GridState, settings: GridSettings = DEFAULT_GRID_SETTINGS) {
  const base = sanitizeFilename(puzzle.title);

  const svg = generateSVG(puzzle.categories, gridState, settings);
  downloadFile(svg, `${base}.svg`, 'image/svg+xml');

  const md = generateMarkdown(puzzle);
  downloadFile(md, `${base}.md`, 'text/markdown');
}
