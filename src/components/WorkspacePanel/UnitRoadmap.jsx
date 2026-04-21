import { useMemo } from 'react';
import { UNIT_COLORS } from '../../constants/units';
import styles from './UnitRoadmap.module.css';

// ── Geometry constants ────────────────────────────────────────────────────────
const R         = 34;
const NR        = 4.5;
const CANVAS_BG = '#fff';

const CX = { mass: 58,  moles: 182, parts: 306 };
const CY = { top:  86,  vol:   214 };

const N = {
  kgmg:     { x: CX.mass  - R, y: CY.top },
  g:        { x: CX.mass  + R, y: CY.top },
  molA:     { x: CX.moles - R, y: CY.top },
  mol:      { x: CX.moles,     y: CY.top },
  molB:     { x: CX.moles + R, y: CY.top },
  mlcls:    { x: CX.parts - R, y: CY.top },
  atoms:    { x: CX.parts + R, y: CY.top },
  L:        { x: CX.moles,     y: CY.vol - R },
  mL:       { x: CX.moles,     y: CY.vol + R },
  molesBot: { x: CX.moles,     y: CY.top + R },
};

const CC = {
  mass:  'rgba(0,   173, 219, 0.18)',   // blue   #00addb
  moles: 'rgba(23,  178, 158, 0.18)',   // teal   #17b29e
  parts: 'rgba(233,  23, 122, 0.18)',   // pink   #e9177a
  vol:   'rgba(116, 138, 197, 0.18)',   // purple #748ac5
  ring:  '#4f5b6f',
  line:  '#4f5b6f',
};

// ── Arc path strings ──────────────────────────────────────────────────────────
// Molar Ratio: molA → molB sweeping clockwise (over the top of moles circle)
// In SVG y-down coords, sweep=1 (positive/clockwise) goes from 180° → 270° → 0°,
// passing through 270° = the upward direction = the TOP of the circle.
const MOLAR_RATIO_ARC = `M ${N.molA.x} ${N.molA.y} A ${R} ${R} 0 0 1 ${N.molB.x} ${N.molB.y}`;

// molB → molesBot: clockwise quarter-arc down the right side of moles circle
// sweep=1 = clockwise = right-side descent (3 o'clock → 6 o'clock)
const MOL_B_TO_BOT_ARC = `M ${N.molB.x} ${N.molB.y} A ${R} ${R} 0 0 1 ${N.molesBot.x} ${N.molesBot.y}`;

// Atomic Ratio: arc over the TOP of the particles circle (mlcls → atoms), clockwise
const ATOMIC_RATIO_ARC = `M ${N.mlcls.x} ${N.mlcls.y} A ${R} ${R} 0 0 1 ${N.atoms.x} ${N.atoms.y}`;

// Same-circle bottom arc: molA → molB going UNDER the moles circle (counterclockwise)
// Used when given and equals are in the same roadmap circle (full-circle highlight)
const MOLAR_RATIO_BOTTOM_ARC = `M ${N.molA.x} ${N.molA.y} A ${R} ${R} 0 0 0 ${N.molB.x} ${N.molB.y}`;

// L → mL: counterclockwise semicircle around the left side of the volume circle
// sweep=0 = counterclockwise = 12 o'clock → 9 o'clock → 6 o'clock (left side)
const VOLUME_METRIC_ARC = `M ${N.L.x} ${N.L.y} A ${R} ${R} 0 0 0 ${N.mL.x} ${N.mL.y}`;

// kg/mg → g: counterclockwise semicircle around the BOTTOM of the mass circle
// sweep=0 from 9 o'clock (kgmg, left) → 6 o'clock (bottom) → 3 o'clock (g, right)
const MASS_METRIC_ARC = `M ${N.kgmg.x} ${N.kgmg.y} A ${R} ${R} 0 0 0 ${N.g.x} ${N.g.y}`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Node({ x, y, color, label, lx, ly, anchor = 'middle', active = false }) {
  return (
    <g filter={active ? 'url(#nodeGlow)' : undefined}>
      <circle
        cx={x} cy={y} r={NR}
        fill={active ? color : CANVAS_BG}
        stroke={active ? color : CC.ring}
        strokeWidth={1.2}
      />
      {label && (
        <text
          x={lx ?? x} y={ly ?? y - 7}
          textAnchor={anchor}
          className={styles.nodeLabel}
          style={active ? { fill: color } : {}}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function CfLabel({ x, y, anchor = 'middle', children }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={styles.cfLabel}>{children}</text>
  );
}

// Straight line — always visible; grey when inactive, colored + glowing when active
function Line({ x1, y1, x2, y2, active, color }) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={active ? color : CC.line}
      strokeWidth={active ? 3 : 1.2}
      filter={active ? 'url(#lineGlow)' : undefined}
    />
  );
}

// Arc along a circle outline — only rendered when active
function Arc({ d, color }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={3}
      filter="url(#lineGlow)"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function UnitRoadmap({ steps = [], difficulty = 'easy' }) {
  const showMolAB = difficulty === 'hard';
  // Unit IDs present anywhere in the workspace — drives node highlighting
  const activeIds = useMemo(() => {
    const ids = new Set();
    steps.forEach((s) => {
      if (s.unit?.id)            ids.add(s.unit.id);
      if (s.numeratorUnit?.id)   ids.add(s.numeratorUnit.id);
      if (s.denominatorUnit?.id) ids.add(s.denominatorUnit.id);
    });
    return ids;
  }, [steps]);

  // CF labels applied to any factor step — drives line/arc highlighting
  const activeCFLabels = useMemo(() => {
    const labels = new Set();
    steps.forEach((s) => {
      if (s.type === 'factor' && s.cfLabelTop) labels.add(s.cfLabelTop);
    });
    return labels;
  }, [steps]);

  const has   = (id)    => activeIds.has(id);
  const hasCF = (label) => activeCFLabels.has(label);

  // Detect same-circle case: given and equals are both in the same roadmap circle
  const sameCircle = useMemo(() => {
    if (!showMolAB) return false;
    const givenId  = steps.find((s) => s.type === 'given')?.unit?.id;
    const equalsId = steps.find((s) => s.type === 'equals')?.unit?.id;
    if (!givenId || !equalsId) return false;
    const inSame = (set) => set.has(givenId) && set.has(equalsId);
    return inSame(new Set(['kg', 'g', 'mg']))
        || inSame(new Set(['mlcls', 'atoms', 'ions']))
        || inSame(new Set(['L', 'mL']));
  }, [steps, showMolAB]);

  // ── Line / arc active states (CF-label driven) ──────────────────────────────
  const molarRatioActive   = hasCF('Molar Ratio');
  const molarMassActive    = hasCF('Molar Mass');
  const avogadroActive     = hasCF("Avogadro's #");
  const molarityActive     = hasCF('Molarity');
  const metricVolumeActive = hasCF('Metric') && (has('L') || has('mL'));
  const metricMassActive   = hasCF('Metric') && (has('kg') || has('g') || has('mg'));
  const atomicRatioActive  = hasCF('Atomic Ratio');

  // Hard problems (showMolAB) always route through outer molA/molB nodes.
  // Easy/medium route through the center mol node unless molar ratio is somehow active.
  const molarMassEnd  = (showMolAB || molarRatioActive) ? N.molA : N.mol;
  const avogadroStart = (showMolAB || molarRatioActive) ? N.molB : N.mol;

  // Center mol node only lights up on easy/medium — hard problems exclusively use outer nodes
  const molCenterActive = !showMolAB && !molarRatioActive && (has('mol_A') || has('mol_B') || has('mol'));
  const molCenterColor  = has('mol_A') ? UNIT_COLORS.mol_A
                        : has('mol_B') ? UNIT_COLORS.mol_B
                        : UNIT_COLORS.mol;

  // molesBot junction lights up whenever molarity path is active
  const molesBotActive  = molarityActive;
  // When molar ratio IS used with molarity, the arc from molB → molesBot handles that
  // leg; the internal vertical stem (mol → molesBot) is only for the non-ratio path
  const stemActive      = molarityActive && !molarRatioActive;

  return (
    <div className={styles.wrap}>
      <svg viewBox="0 0 360 262" className={styles.svg}>

        <defs>
          <filter id="nodeGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* userSpaceOnUse prevents zero-area clipping on horizontal/vertical lines */}
          <filter id="lineGlow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="400" height="302">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Circle fills ── */}
        <circle cx={CX.mass}  cy={CY.top} r={R} fill={CC.mass}  stroke={CC.ring} strokeWidth={1.2} />
        <circle cx={CX.moles} cy={CY.top} r={R} fill={CC.moles} stroke={CC.ring} strokeWidth={1.2} />
        <circle cx={CX.parts} cy={CY.top} r={R} fill={CC.parts} stroke={CC.ring} strokeWidth={1.2} />
        <circle cx={CX.moles} cy={CY.vol} r={R} fill={CC.vol}   stroke={CC.ring} strokeWidth={1.2} />

        {/* ── Circle titles ── */}
        <text x={CX.mass}  y={CY.top - 14} textAnchor="middle" className={styles.circleTitle}>Mass</text>
        <text x={CX.moles} y={CY.top - 14} textAnchor="middle" className={styles.circleTitle}>Moles</text>
        <text x={CX.parts} y={CY.top - 14} textAnchor="middle" className={styles.circleTitle}>Particles</text>
        <text x={CX.moles} y={CY.vol - 16} textAnchor="middle" className={styles.circleTitle}>Vol</text>

        {/* ── Moles internal lines (only when molar ratio path is NOT taken, mol A/B shown) ── */}
        {showMolAB && !molarRatioActive && (
          <Line x1={N.molA.x} y1={CY.top} x2={N.molB.x} y2={CY.top}
                active={false} color={UNIT_COLORS.mol_A} />
        )}
        {/* Vertical stem: mol center → molesBot (only when no molar ratio) */}
        <Line x1={N.molesBot.x} y1={N.molesBot.y} x2={N.mol.x} y2={N.mol.y}
              active={stemActive} color={UNIT_COLORS.L} />

        {/* ── Straight connector lines between circles ── */}
        <Line x1={N.g.x} y1={CY.top} x2={molarMassEnd.x} y2={molarMassEnd.y}
              active={molarMassActive} color={UNIT_COLORS.g} />
        <Line x1={avogadroStart.x} y1={avogadroStart.y} x2={N.mlcls.x} y2={CY.top}
              active={avogadroActive} color={UNIT_COLORS.mol_B} />
        <Line x1={N.L.x} y1={N.L.y} x2={N.molesBot.x} y2={N.molesBot.y}
              active={molarityActive} color={UNIT_COLORS.L} />

        {/* ── Active arcs along circle outlines ── */}
        {/* Molar Ratio: arc over the TOP of the moles circle (molA → molB) */}
        {showMolAB && molarRatioActive && (
          <Arc d={MOLAR_RATIO_ARC} color={UNIT_COLORS.mol_A} />
        )}
        {/* molB → molesBot: arc down the RIGHT side when molarity follows molar ratio */}
        {showMolAB && molarRatioActive && molarityActive && (
          <Arc d={MOL_B_TO_BOT_ARC} color={UNIT_COLORS.L} />
        )}
        {/* Same-circle bottom arc: molA → molB under the moles circle (full-circle highlight) */}
        {showMolAB && molarRatioActive && sameCircle && (
          <Arc d={MOLAR_RATIO_BOTTOM_ARC} color={UNIT_COLORS.mol_B} />
        )}
        {/* Metric Volume: arc around the LEFT side of the volume circle (L → mL) */}
        {metricVolumeActive && (
          <Arc d={VOLUME_METRIC_ARC} color={UNIT_COLORS.L} />
        )}
        {/* Metric Mass: arc around the BOTTOM of the mass circle (kg/mg ↔ g) */}
        {metricMassActive && (
          <Arc d={MASS_METRIC_ARC} color={UNIT_COLORS.g} />
        )}
        {/* Atomic Ratio: arc over the TOP of the particles circle (mlcls → atoms) */}
        {atomicRatioActive && (
          <Arc d={ATOMIC_RATIO_ARC} color={UNIT_COLORS.mlcls} />
        )}

        {/* ── Conversion factor labels ── */}
        <CfLabel x={(N.g.x + N.molA.x) / 2}       y={CY.top - 8}>Molar Mass</CfLabel>
        <CfLabel x={(N.molB.x + N.mlcls.x) / 2}  y={CY.top - 8}>Avogadro&apos;s #</CfLabel>
        {showMolAB && (
          <CfLabel x={CX.moles} y={CY.top + 22}>Molar Ratio</CfLabel>
        )}
        <CfLabel x={CX.parts} y={CY.top + 22}>Atomic Ratio</CfLabel>
        <CfLabel x={N.L.x + 7} y={(N.L.y + N.molesBot.y) / 2 + 4} anchor="start">Molarity</CfLabel>
        <CfLabel x={CX.mass}   y={CY.top + 22}>Metric</CfLabel>
        <CfLabel x={CX.moles}  y={CY.vol  + 22}>Metric</CfLabel>

        {/* ── Node dots & labels ── */}
        {/* Mass */}
        <Node x={N.kgmg.x} y={CY.top}
              color={has('kg') ? UNIT_COLORS.kg : UNIT_COLORS.mg}
              active={has('kg') || has('mg')}
              label="kg/mg" lx={N.kgmg.x} ly={CY.top + 13} />
        <Node x={N.g.x} y={CY.top}
              color={UNIT_COLORS.g} active={has('g')}
              label="g" lx={N.g.x} ly={CY.top + 13} />

        {/* Moles */}
        {showMolAB && (
          <Node x={N.molA.x} y={CY.top}
                color={UNIT_COLORS.mol_A} active={has('mol_A')}
                label="mol A" lx={N.molA.x} ly={CY.top + 13} />
        )}
        <Node x={N.mol.x} y={CY.top}
              color={molCenterColor} active={molCenterActive}
              label="mol" lx={N.mol.x + 7} ly={CY.top - 6} anchor="start" />
        {showMolAB && (
          <Node x={N.molB.x} y={CY.top}
                color={UNIT_COLORS.mol_B} active={has('mol_B')}
                label="mol B" lx={N.molB.x} ly={CY.top + 13} />
        )}

        {/* Particles */}
        <Node x={N.mlcls.x} y={CY.top}
              color={UNIT_COLORS.mlcls} active={has('mlcls')}
              label="mlcls" lx={N.mlcls.x} ly={CY.top + 13} />
        <Node x={N.atoms.x} y={CY.top}
              color={UNIT_COLORS.atoms} active={has('atoms')}
              label="atoms" lx={N.atoms.x} ly={CY.top + 13} />

        {/* Volume */}
        <Node x={N.L.x} y={N.L.y}
              color={UNIT_COLORS.L} active={has('L')}
              label="L" lx={N.L.x + 7} ly={N.L.y + 4} anchor="start" />
        <Node x={N.mL.x} y={N.mL.y}
              color={UNIT_COLORS.mL} active={has('mL')}
              label="mL" lx={N.mL.x + 7} ly={N.mL.y + 4} anchor="start" />

        {/* Moles-bottom junction dot */}
        <circle cx={N.molesBot.x} cy={N.molesBot.y} r={2.5}
                fill={molesBotActive ? UNIT_COLORS.L : CC.ring}
                filter={molesBotActive ? 'url(#nodeGlow)' : undefined} />

      </svg>
    </div>
  );
}
