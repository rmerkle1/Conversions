import { useEffect, useState } from 'react';

/**
 * Draws solid colored SVG lines connecting unit slots that share the same unit.
 * Queries the DOM via data-slot-id attributes after a requestAnimationFrame so
 * getBoundingClientRect() is guaranteed to return the freshly-painted layout.
 * Also draws a live dashed line from the source slot to the cursor during pairing mode.
 */
export default function ConnectionLines({ steps, canvasRef, pairingUnit, mouseCanvas, mode }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    let rafId;

    rafId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Build a map of unit id → list of {key, unit, el} for every filled slot
      const byUnit = {};

      const addSlot = (stepId, slotName, unit) => {
        if (!unit) return;
        const el = canvas.querySelector(`[data-slot-id="${stepId}-${slotName}"]`);
        if (!el) return;
        // Group by label, not id — compound-specific units like "g H₂" and "g H₂O"
        // share the same id but are different units and must not be connected.
        const groupKey = unit.label ?? unit.id;
        if (!byUnit[groupKey]) byUnit[groupKey] = [];
        byUnit[groupKey].push({ key: `${stepId}-${slotName}`, unit, el });
      };

      steps.forEach((step) => {
        if (step.type === 'given')  addSlot(step.id, 'given',       step.unit);
        if (step.type === 'equals') addSlot(step.id, 'equals',      step.unit);
        if (step.type === 'factor') {
          addSlot(step.id, 'numerator',   step.numeratorUnit);
          addSlot(step.id, 'denominator', step.denominatorUnit);
        }
      });

      const canvasRect = canvas.getBoundingClientRect();
      const scrollLeft = canvas.scrollLeft;
      const newLines = [];

      Object.values(byUnit).forEach((group) => {
        if (group.length < 2) return;
        for (let i = 0; i < group.length - 1; i++) {
          const a = group[i].el.getBoundingClientRect();
          const b = group[i + 1].el.getBoundingClientRect();

          const x1 = a.right - canvasRect.left + scrollLeft;
          const y1 = (a.top + a.bottom) / 2 - canvasRect.top;
          const x2 = b.left  - canvasRect.left + scrollLeft;
          const y2 = (b.top + b.bottom) / 2 - canvasRect.top;

          newLines.push({
            d: `M ${x1} ${y1} L ${x2} ${y2}`,
            color: group[i].unit.color,
            key: `${group[i].key}-${group[i + 1].key}`,
          });
        }
      });

      setLines(newLines);
    });

    return () => cancelAnimationFrame(rafId);
  }, [steps, canvasRef, pairingUnit, mode]);

  // Live pairing line — computed during render so it updates on every mouse move.
  // Reads positions from the already-committed DOM (previous render's layout).
  let liveLine = null;
  if (pairingUnit && mouseCanvas && canvasRef.current) {
    const canvas = canvasRef.current;
    const sourceEl = canvas.querySelector(
      `[data-slot-id="${pairingUnit.sourceStepId}-${pairingUnit.sourceSlot}"]`
    );
    if (sourceEl) {
      const canvasRect = canvas.getBoundingClientRect();
      const a = sourceEl.getBoundingClientRect();
      const x1 = a.right - canvasRect.left + canvas.scrollLeft;
      const y1 = (a.top + a.bottom) / 2 - canvasRect.top;
      liveLine = (
        <path
          d={`M ${x1} ${y1} L ${mouseCanvas.x} ${mouseCanvas.y}`}
          fill="none"
          stroke={pairingUnit.unit.color}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          opacity={0.85}
        />
      );
    }
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 10,
      }}
    >
      {lines.map((l) => (
        <path
          key={l.key}
          d={l.d}
          fill="none"
          stroke={l.color}
          strokeWidth={2.5}
          opacity={0.9}
        />
      ))}
      {liveLine}
    </svg>
  );
}
