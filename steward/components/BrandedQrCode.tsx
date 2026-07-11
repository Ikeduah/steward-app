import { useMemo } from "react";
import QRCode from "qrcode";

const INK = "#06140E";
const ACCENT = "#059669";

interface BrandedQrCodeProps {
  id?: string;
  value: string;
  size?: number;
}

// Finder patterns (with separators) sit in the three 9x9 corners; the timing
// pattern runs along row/col 6. Keep accent modules out of all of it so the
// scanner-critical structure never gets recolored.
function isStructural(row: number, col: number, matrixSize: number) {
  const inTopLeft = row < 9 && col < 9;
  const inTopRight = row < 9 && col >= matrixSize - 9;
  const inBottomLeft = row >= matrixSize - 9 && col < 9;
  const onTimingLine = row === 6 || col === 6;
  return inTopLeft || inTopRight || inBottomLeft || onTimingLine;
}

export default function BrandedQrCode({ id, value, size = 128 }: BrandedQrCodeProps) {
  const { modules, accentIndices } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
    const matrix = qr.modules;
    const n = matrix.size;
    const center = (n - 1) / 2;

    const candidates: { index: number; row: number; col: number; dist: number }[] = [];
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (!matrix.get(row, col) || isStructural(row, col, n)) continue;
        candidates.push({ index: row * n + col, row, col, dist: Math.hypot(row - center, col - center) });
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);

    const accents: number[] = [];
    if (candidates[0]) accents.push(candidates[0].index);
    const first = candidates[0];
    const second = first && candidates.find((c) => Math.hypot(c.row - first.row, c.col - first.col) >= 3);
    if (second) accents.push(second.index);

    return { modules: matrix, accentIndices: accents };
  }, [value]);

  const n = modules.size;
  const rects = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!modules.get(row, col)) continue;
      const index = row * n + col;
      rects.push(
        <rect
          key={index}
          x={col}
          y={row}
          width={1}
          height={1}
          fill={accentIndices.includes(index) ? ACCENT : INK}
        />
      );
    }
  }

  return (
    <svg id={id} width={size} height={size} viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges">
      <rect x={0} y={0} width={n} height={n} fill="#ffffff" />
      {rects}
    </svg>
  );
}
