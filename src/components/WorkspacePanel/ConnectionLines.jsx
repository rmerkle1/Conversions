import { useEffect, useState } from 'react';

/**
 * Draws colored SVG curves between unit slots that share the same unit.
 * Runs after every render so positions are always current.
 */
export default function ConnectionLines({ steps, stepRefs }) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    // Collect all filled slots: { key, unit, el }
    const slots = [];

    steps.forEach((step) => {
      if (step.type === 'given' && step.unit) {
        const key = `${step.id}-given`;
        if (stepRefs.current[key]) slots.push({ key, unit: step.unit, el: stepRefs.current[key] });
      }
      if (step.type === 'factor') {
        if (step.numeratorUnit) {
          const key = `${step.id}-numerator`;
          if (stepRefs.current[key]) slots.push({ key, unit: step.numeratorUnit, el: stepRefs.current[key] });
        }
        if (step.denominatorUnit) {
          const key = `${step.id}-denominator`;
          if (stepRefs.current[key]) slots.push({ key, unit: step.denominatorUnit, el: stepRefs.current[key] });
        }
      }
      if (step.type === 'equals' && step.unit) {
        const key = `${step.id}-equals`;
        if (stepRefs.current[key]) slots.push({ key, unit: step.unit, el: stepRefs.current[key] });
      }
    });

    // Group by unit id
    const byUnit = {};
    slots.forEach((s) => {
      if (!byUnit[s.unit.id]) byUnit[s.unit.id] = [];
      byUnit[s.unit.id].push(s);
    });

    // Find the SVG container (the .canvas div's parent for coordinate offset)
    const svgEl = document.getElementById('connection-svg');
    if (!svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();

    const newLines = [];
    Object.values(byUnit).forEach((group) => {
      if (group.length < 2) return;
      for (let i = 0; i < group.length - 1; i++) {
        const a = group[i].el.getBoundingClientRect();
        const b = group[i + 1].el.getBoundingClientRect();

        const x1 = a.left + a.width / 2 - svgRect.left;
        const y1 = a.top + a.height / 2 - svgRect.top;
        const x2 = b.left + b.width / 2 - svgRect.left;
        const y2 = b.top + b.height / 2 - svgRect.top;

        // Cubic bezier: control points arc upward/downward
        const cy = Math.min(y1, y2) - 40;
        const d = `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`;

        newLines.push({ d, color: group[i].unit.color, key: `${group[i].key}-${group[i+1].key}` });
      }
    });

    setLines(newLines);
  }, [steps, stepRefs]);

  return (
    <svg
      id="connection-svg"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        {lines.map((l) => (
          <marker
            key={`arrow-${l.key}`}
            id={`arrow-${l.key}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L8,3 z" fill={l.color} />
          </marker>
        ))}
      </defs>
      {lines.map((l) => (
        <path
          key={l.key}
          d={l.d}
          fill="none"
          stroke={l.color}
          strokeWidth={2.5}
          strokeDasharray="6 3"
          markerEnd={`url(#arrow-${l.key})`}
          opacity={0.85}
        />
      ))}
    </svg>
  );
}
