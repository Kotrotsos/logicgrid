import React, { useRef, useEffect, useState } from 'react';
import { Category, GridState, CellValue, GridSettings, DEFAULT_GRID_SETTINGS } from '../types';

interface LogicGridProps {
  categories: Category[];
  gridState: GridState;
  gridSettings?: GridSettings;
  onCellClick: (cat1: string, item1: string, cat2: string, item2: string, type: 'left' | 'right') => void;
}

// Describes a sub-grid block in the L-shaped layout
interface SubGridBlock {
  blockRow: number;   // Row position in the block grid
  blockCol: number;   // Column position in the block grid
  leftCat: Category;  // Category on the left axis
  topCat: Category;   // Category on the top axis
}

/**
 * Computes the L-shaped layout for N categories.
 *
 * For N categories (indexed 0..N-1):
 * - Top axis: categories 1..N-1 (left to right)
 * - Left axis row 0: category 0 (spans full width, N-1 blocks)
 * - Left axis row r (r=1..N-2): category N-1-r+1 = N-r, spans N-1-r blocks
 *
 * This produces all C(N,2) unique pairings in an L-shape.
 */
function computeLShapeLayout(categories: Category[]): {
  blocks: SubGridBlock[];
  blockRowCount: number;
  blockColCount: number;
  leftCats: Category[];
  topCats: Category[];
} {
  const n = categories.length;
  const topCats = categories.slice(1);      // cats 1..N-1
  const blockColCount = n - 1;

  // Left categories: row 0 = cat[0], then cat[N-1], cat[N-2], ..., cat[2]
  const leftCats: Category[] = [categories[0]];
  for (let i = n - 1; i >= 2; i--) {
    leftCats.push(categories[i]);
  }
  const blockRowCount = leftCats.length; // = N-1

  const blocks: SubGridBlock[] = [];

  for (let r = 0; r < blockRowCount; r++) {
    // Row 0 spans all columns (N-1 blocks)
    // Row 1 spans N-2 blocks
    // Row r spans N-1-r blocks
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

export const LogicGrid: React.FC<LogicGridProps> = ({ categories, gridState, gridSettings, onCellClick }) => {
  const gs = gridSettings || DEFAULT_GRID_SETTINGS;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverCell, setHoverCell] = useState<{
    blockRow: number; blockCol: number; cellRow: number; cellCol: number;
  } | null>(null);

  // Transform State
  const [transform, setTransform] = useState({ x: 40, y: 40, k: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const dragStart = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  if (categories.length < 3) return <div className="p-4">Grid requires at least 3 categories.</div>;

  const ITEM_COUNT = categories[0].items.length;
  const HEADER_HEIGHT = 40;
  const FONT = '11px Inter, sans-serif';
  const BOLD_FONT = 'bold 11px Inter, sans-serif';

  const layout = computeLShapeLayout(categories);
  const { blocks, blockRowCount, blockColCount, leftCats, topCats } = layout;

  const measureText = (text: string, font: string): number => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * 7;
    ctx.font = font;
    return ctx.measureText(text).width;
  };

  // Measure using ALL categories for sizing
  const leftCatLabelWidth = 32;
  const allLeftItems = leftCats.flatMap(c => c.items);
  const maxLeftItemWidth = Math.max(...allLeftItems.map(item => measureText(item, BOLD_FONT)));
  const LABEL_SIZE = Math.max(150, leftCatLabelWidth + maxLeftItemWidth + 28);

  const allTopItems = topCats.flatMap(c => c.items);
  const maxTopItemWidth = Math.max(...allTopItems.map(item => measureText(item, BOLD_FONT)));
  const TOP_LABEL_HEIGHT = Math.max(120, maxTopItemWidth + 24);

  const CELL_SIZE = Math.max(34, Math.ceil(maxLeftItemWidth / 5));
  const GROUP_SIZE = CELL_SIZE * ITEM_COUNT;

  // Total content dimensions
  const CONTENT_WIDTH = LABEL_SIZE + (blockColCount * GROUP_SIZE);
  const CONTENT_HEIGHT = HEADER_HEIGHT + TOP_LABEL_HEIGHT + (blockRowCount * GROUP_SIZE);

  // Build a set for quick block existence checks
  const blockSet = new Set<string>();
  for (const b of blocks) {
    blockSet.add(`${b.blockRow},${b.blockCol}`);
  }

  const getBlock = (br: number, bc: number): SubGridBlock | undefined => {
    return blocks.find(b => b.blockRow === br && b.blockCol === bc);
  };

  // Resize Observer
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setCanvasSize({ w: width, h: height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas DOM size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && canvasSize.w > 0 && canvasSize.h > 0) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasSize.w * dpr;
      canvas.height = canvasSize.h * dpr;
      canvas.style.width = `${canvasSize.w}px`;
      canvas.style.height = `${canvasSize.h}px`;
    }
  }, [canvasSize]);

  // Main Drawing Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transform
    ctx.setTransform(dpr * transform.k, 0, 0, dpr * transform.k, transform.x * dpr, transform.y * dpr);

    ctx.textBaseline = 'middle';

    const gridOffsetX = LABEL_SIZE;
    const gridOffsetY = HEADER_HEIGHT + TOP_LABEL_HEIGHT;

    // 1. Fill entire background with neutral color for the staircase area
    ctx.fillStyle = gs.backgroundColor;
    ctx.fillRect(0, 0, CONTENT_WIDTH, CONTENT_HEIGHT);

    // 2. Top-left logo area
    if (gs.showLogo) {
      ctx.fillStyle = '#10221a';
      ctx.fillRect(0, 0, LABEL_SIZE, HEADER_HEIGHT);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText('LOGICGRID', LABEL_SIZE / 2, HEADER_HEIGHT / 2);
    } else {
      ctx.fillStyle = gs.backgroundColor;
      ctx.fillRect(0, 0, LABEL_SIZE, HEADER_HEIGHT);
    }

    // 3. Top category headers
    topCats.forEach((cat, i) => {
      const x = gridOffsetX + (i * GROUP_SIZE);
      ctx.fillStyle = gs.headerColor;
      ctx.fillRect(x, 0, GROUP_SIZE, HEADER_HEIGHT);

      ctx.strokeStyle = gs.borderColor;
      ctx.lineWidth = gs.borderThickness;
      ctx.strokeRect(x, 0, GROUP_SIZE, HEADER_HEIGHT);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cat.name.toUpperCase(), x + GROUP_SIZE / 2, HEADER_HEIGHT / 2);
    });

    // 4. Top item labels (rotated)
    topCats.forEach((cat, catIdx) => {
      cat.items.forEach((item, itemIdx) => {
        const colIndex = (catIdx * ITEM_COUNT) + itemIdx;
        const x = gridOffsetX + (colIndex * CELL_SIZE);
        const y = HEADER_HEIGHT;

        ctx.fillStyle = gs.cellColor;
        ctx.fillRect(x, y, CELL_SIZE, TOP_LABEL_HEIGHT);

        ctx.save();
        ctx.translate(x + CELL_SIZE / 2, y + TOP_LABEL_HEIGHT - 12);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = BOLD_FONT;
        ctx.fillText(item, 0, 0);
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(x + CELL_SIZE, y);
        ctx.lineTo(x + CELL_SIZE, y + TOP_LABEL_HEIGHT);
        ctx.lineWidth = 1;
        ctx.strokeStyle = gs.cellBorderColor;
        ctx.stroke();
      });

      const groupX = gridOffsetX + (catIdx * GROUP_SIZE);
      ctx.strokeStyle = gs.borderColor;
      ctx.lineWidth = gs.borderThickness;
      ctx.strokeRect(groupX, HEADER_HEIGHT, GROUP_SIZE, TOP_LABEL_HEIGHT);
    });

    // 5. Fill the top-left blank area below headers but above grid
    ctx.fillStyle = gs.backgroundColor;
    ctx.fillRect(0, HEADER_HEIGHT, LABEL_SIZE, TOP_LABEL_HEIGHT);

    // 6. Left category headers + item labels
    leftCats.forEach((cat, catIdx) => {
      const catY = gridOffsetY + (catIdx * GROUP_SIZE);

      // Check if this row has any blocks
      const colsInRow = blockColCount - catIdx;
      if (colsInRow <= 0) return;

      // Category label (vertical)
      ctx.fillStyle = gs.headerColor;
      ctx.fillRect(0, catY, leftCatLabelWidth, GROUP_SIZE);

      ctx.save();
      ctx.translate(leftCatLabelWidth / 2, catY + GROUP_SIZE / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = BOLD_FONT;
      ctx.fillText(cat.name.toUpperCase(), 0, 0);
      ctx.restore();

      ctx.strokeStyle = gs.borderColor;
      ctx.lineWidth = gs.borderThickness;
      ctx.strokeRect(0, catY, leftCatLabelWidth, GROUP_SIZE);

      // Item labels
      cat.items.forEach((item, itemIdx) => {
        const itemY = catY + (itemIdx * CELL_SIZE);
        const itemX = leftCatLabelWidth;
        const itemWidth = LABEL_SIZE - leftCatLabelWidth;

        ctx.fillStyle = gs.cellColor;
        ctx.fillRect(itemX, itemY, itemWidth, CELL_SIZE);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#475569';
        ctx.font = BOLD_FONT;
        ctx.fillText(item, itemX + itemWidth - 12, itemY + CELL_SIZE / 2);

        ctx.beginPath();
        ctx.moveTo(itemX, itemY + CELL_SIZE);
        ctx.lineTo(itemX + itemWidth, itemY + CELL_SIZE);
        ctx.lineWidth = 1;
        ctx.strokeStyle = gs.cellBorderColor;
        ctx.stroke();
      });

      ctx.strokeStyle = gs.borderColor;
      ctx.lineWidth = gs.borderThickness;
      ctx.strokeRect(leftCatLabelWidth, catY, LABEL_SIZE - leftCatLabelWidth, GROUP_SIZE);
    });

    // 7. Hover highlight
    if (hoverCell) {
      const block = getBlock(hoverCell.blockRow, hoverCell.blockCol);
      if (block) {
        const hX = gridOffsetX + hoverCell.blockCol * GROUP_SIZE + hoverCell.cellCol * CELL_SIZE;
        const hY = gridOffsetY + hoverCell.blockRow * GROUP_SIZE + hoverCell.cellRow * CELL_SIZE;

        ctx.fillStyle = 'rgba(43, 238, 157, 0.25)';
        ctx.fillRect(hX, hY, CELL_SIZE, CELL_SIZE);

        // Highlight top label
        const topColIdx = hoverCell.blockCol * ITEM_COUNT + hoverCell.cellCol;
        ctx.fillStyle = 'rgba(43, 238, 157, 0.1)';
        ctx.fillRect(gridOffsetX + topColIdx * CELL_SIZE, HEADER_HEIGHT, CELL_SIZE, TOP_LABEL_HEIGHT);

        // Highlight left label
        ctx.fillRect(leftCatLabelWidth, gridOffsetY + hoverCell.blockRow * GROUP_SIZE + hoverCell.cellRow * CELL_SIZE, LABEL_SIZE - leftCatLabelWidth, CELL_SIZE);
      }
    }

    // 8. Draw sub-grid blocks (cells, values, borders)
    for (const block of blocks) {
      const blockX = gridOffsetX + block.blockCol * GROUP_SIZE;
      const blockY = gridOffsetY + block.blockRow * GROUP_SIZE;

      // Block background
      ctx.fillStyle = gs.cellColor;
      ctx.fillRect(blockX, blockY, GROUP_SIZE, GROUP_SIZE);

      // Draw cells
      for (let cr = 0; cr < ITEM_COUNT; cr++) {
        for (let cc = 0; cc < ITEM_COUNT; cc++) {
          const x = blockX + cc * CELL_SIZE;
          const y = blockY + cr * CELL_SIZE;

          // Cell border
          ctx.strokeStyle = gs.cellBorderColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

          // Cell value
          const leftItem = block.leftCat.items[cr];
          const topItem = block.topCat.items[cc];

          const keys = [`${block.leftCat.name}:${leftItem}`, `${block.topCat.name}:${topItem}`].sort();
          const key = keys.join('|');
          const val = gridState[key];

          const cx = x + CELL_SIZE / 2;
          const cy = y + CELL_SIZE / 2;

          if (val === 'true') {
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE * 0.25, 0, 2 * Math.PI);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#2bee9d';
            ctx.stroke();
            ctx.fillStyle = '#2bee9d';
            ctx.beginPath();
            ctx.arc(cx, cy, CELL_SIZE * 0.12, 0, 2 * Math.PI);
            ctx.fill();
          } else if (val === 'false') {
            ctx.beginPath();
            const size = CELL_SIZE * 0.2;
            ctx.moveTo(cx - size, cy - size);
            ctx.lineTo(cx + size, cy + size);
            ctx.moveTo(cx + size, cy - size);
            ctx.lineTo(cx - size, cy + size);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ef4444';
            ctx.stroke();
          }
        }
      }

      // Thick block border
      ctx.strokeStyle = gs.borderColor;
      ctx.lineWidth = gs.borderThickness;
      ctx.strokeRect(blockX, blockY, GROUP_SIZE, GROUP_SIZE);
    }

  }, [categories, gridState, gridSettings, hoverCell, transform, canvasSize, CONTENT_WIDTH, CONTENT_HEIGHT, LABEL_SIZE, TOP_LABEL_HEIGHT, CELL_SIZE]);


  // --- Event Handling ---

  const getEventCoords = (e: React.MouseEvent | React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const hitTest = (mouseX: number, mouseY: number): {
    blockRow: number; blockCol: number; cellRow: number; cellCol: number;
  } | null => {
    const worldX = (mouseX - transform.x) / transform.k;
    const worldY = (mouseY - transform.y) / transform.k;

    const gridOffsetX = LABEL_SIZE;
    const gridOffsetY = HEADER_HEIGHT + TOP_LABEL_HEIGHT;

    const relX = worldX - gridOffsetX;
    const relY = worldY - gridOffsetY;

    if (relX < 0 || relY < 0) return null;

    const blockCol = Math.floor(relX / GROUP_SIZE);
    const blockRow = Math.floor(relY / GROUP_SIZE);

    if (blockRow < 0 || blockRow >= blockRowCount || blockCol < 0 || blockCol >= blockColCount) return null;
    if (!blockSet.has(`${blockRow},${blockCol}`)) return null;

    const cellCol = Math.floor((relX - blockCol * GROUP_SIZE) / CELL_SIZE);
    const cellRow = Math.floor((relY - blockRow * GROUP_SIZE) / CELL_SIZE);

    if (cellRow < 0 || cellRow >= ITEM_COUNT || cellCol < 0 || cellCol >= ITEM_COUNT) return null;

    return { blockRow, blockCol, cellRow, cellCol };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
    e.preventDefault();

    const { x: mouseX, y: mouseY } = getEventCoords(e);
    const scaleAmount = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, transform.k * (1 + scaleAmount)), 4);

    const worldX = (mouseX - transform.x) / transform.k;
    const worldY = (mouseY - transform.y) / transform.k;

    const newX = mouseX - worldX * newScale;
    const newY = mouseY - worldY * newScale;

    setTransform({ x: newX, y: newY, k: newScale });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { x: e.clientX, y: e.clientY };
    hasMoved.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: mouseX, y: mouseY } = getEventCoords(e);

    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMoved.current = true;
      }

      setTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));

      dragStart.current = { x: e.clientX, y: e.clientY };
      setHoverCell(null);
    } else {
      const hit = hitTest(mouseX, mouseY);
      setHoverCell(hit);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);

    if (!hasMoved.current) {
      const { x: mouseX, y: mouseY } = getEventCoords(e);
      const hit = hitTest(mouseX, mouseY);

      if (hit) {
        const block = getBlock(hit.blockRow, hit.blockCol);
        if (block) {
          const leftItem = block.leftCat.items[hit.cellRow];
          const topItem = block.topCat.items[hit.cellCol];
          const type = e.button === 2 ? 'right' : 'left';
          onCellClick(block.leftCat.name, leftItem, block.topCat.name, topItem, type);
        }
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-100 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
    >
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          className="bg-white p-2 rounded shadow text-slate-600 hover:text-primary transition-colors"
          onClick={() => setTransform({ x: 50, y: 50, k: 1 })}
          title="Reset View"
        >
          <span className="material-symbols-outlined">center_focus_strong</span>
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onMouseLeave={() => { setIsDragging(false); setHoverCell(null); }}
        className="block touch-none"
      />
    </div>
  );
};
