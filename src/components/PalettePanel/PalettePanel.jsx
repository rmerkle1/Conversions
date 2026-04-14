import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { UNITS, CONVERSION_FACTORS, UNIT_COLORS } from '../../constants/units';
import styles from './PalettePanel.module.css';

function DraggableUnit({ unit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-unit-${unit.id}`,
    data: { type: 'unit', unit },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 1000 }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={{ backgroundColor: unit.color, opacity: isDragging ? 0.4 : 1, ...style }}
      className={styles.unitPill}
      {...listeners}
      {...attributes}
    >
      {unit.label}
    </div>
  );
}

function DraggableConversionFactor({ cf }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-cf-${cf.id}`,
    data: { type: 'conversionFactor', conversionFactor: cf },
  });

  const style = {
    background: `linear-gradient(135deg, ${cf.colorA}, ${cf.colorB})`,
    opacity: isDragging ? 0.4 : 1,
    ...(transform
      ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 1000 }
      : {}),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.cfPill}
      {...listeners}
      {...attributes}
    >
      {cf.label}
    </div>
  );
}

const UNIT_GROUPS = [
  { key: 'Metric',    label: 'Mass',      bg: 'rgba(0,   173, 219, 0.18)' },
  { key: 'Moles',     label: 'Moles',     bg: 'rgba(23,  178, 158, 0.18)' },
  { key: 'Volume',    label: 'Volume',    bg: 'rgba(116, 138, 197, 0.18)' },
  { key: 'Particles', label: 'Particles', bg: 'rgba(233,  23, 122, 0.18)' },
];

// Units that are always generated dynamically from problem compounds
const DYNAMIC_IDS = new Set(['mol', 'mol_A', 'mol_B', 'g', 'kg', 'L']);
const BASE_UNITS  = UNITS.filter((u) => !DYNAMIC_IDS.has(u.id));
// BASE_UNITS: mg, mL, mlcls, atoms, ions

export default function PalettePanel({ difficulty = 'easy', problem, open, onToggle, glow }) {
  const isHard = difficulty === 'hard';

  // Build compound-specific g, L, and mol units based on the current problem
  const dynamicUnits = useMemo(() => {
    const cpds = problem?.compounds ?? [];
    const units = [];

    // ── Mass: g (compound-specific) + kg (easy/medium only) ──────────────────
    if (!isHard) {
      const gLabel = cpds.length > 0 ? `g ${cpds[0].formula}` : 'g';
      units.push({ id: 'g', label: gLabel, group: 'Metric', color: UNIT_COLORS.g });
      // kg only for easy/medium
      units.push({ id: 'kg', label: 'kg', group: 'Metric', color: UNIT_COLORS.kg });
    } else if (cpds.length >= 2) {
      // Hard: two compound-specific g units, no kg
      units.push(
        { id: 'g_pending_0', label: `g ${cpds[0].formula}`, resolvedId: 'g', isPendingUnit: true, group: 'Metric', color: UNIT_COLORS.g },
        { id: 'g_pending_1', label: `g ${cpds[1].formula}`, resolvedId: 'g', isPendingUnit: true, group: 'Metric', color: UNIT_COLORS.g },
      );
    } else {
      units.push({ id: 'g', label: 'g', group: 'Metric', color: UNIT_COLORS.g });
    }

    // ── Moles: mol/mol_A/mol_B (compound-specific) ───────────────────────────
    if (!isHard) {
      const molLabel = cpds.length > 0 ? `mol ${cpds[0].formula}` : 'mol';
      units.push({ id: 'mol', label: molLabel, group: 'Moles', color: UNIT_COLORS.mol });
    } else if (cpds.length >= 2) {
      units.push(
        { id: 'mol_pending_0', label: `mol ${cpds[0].formula}`, group: 'Moles', color: UNIT_COLORS.mol_A, isPendingMol: true },
        { id: 'mol_pending_1', label: `mol ${cpds[1].formula}`, group: 'Moles', color: UNIT_COLORS.mol_B, isPendingMol: true },
      );
    } else {
      units.push(
        { id: 'mol_A', label: 'mol A', group: 'Moles', color: UNIT_COLORS.mol_A },
        { id: 'mol_B', label: 'mol B', group: 'Moles', color: UNIT_COLORS.mol_B },
      );
    }

    // ── Volume: L (compound-specific) ────────────────────────────────────────
    if (!isHard) {
      const lLabel = cpds.length > 0 ? `L ${cpds[0].formula}` : 'L';
      units.push({ id: 'L', label: lLabel, group: 'Volume', color: UNIT_COLORS.L });
    } else if (cpds.length >= 2) {
      units.push(
        { id: 'L_pending_0', label: `L ${cpds[0].formula}`, resolvedId: 'L', isPendingUnit: true, group: 'Volume', color: UNIT_COLORS.L },
        { id: 'L_pending_1', label: `L ${cpds[1].formula}`, resolvedId: 'L', isPendingUnit: true, group: 'Volume', color: UNIT_COLORS.L },
      );
    } else {
      units.push({ id: 'L', label: 'L', group: 'Volume', color: UNIT_COLORS.L });
    }

    return units;
  }, [isHard, problem?.compounds]);

  const visibleUnits = [...BASE_UNITS, ...dynamicUnits];

  const visibleCFs = CONVERSION_FACTORS.filter((cf) => {
    if (!isHard && cf.id === 'molar_ratio') return false;
    return true;
  });

  if (!open) {
    return (
      <div
        data-tutorial="palette-toggle"
        className={`${styles.collapsed} ${glow ? styles.collapsedGlow : ''}`}
        onClick={onToggle}
        title="Open Units & Conversion Factors"
      >
        <span className={styles.collapsedIcon}>›</span>
        <span className={styles.collapsedLabel}>Units &amp; CFs</span>
        {glow && <span className={styles.glowDot} />}
      </div>
    );
  }

  return (
    <div data-tutorial="palette-panel" className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>Units &amp; Factors</span>
        <button className={styles.collapseBtn} onClick={onToggle} title="Collapse">‹</button>
      </div>
      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.columnHeader}>Units</div>
          {UNIT_GROUPS.map(({ key, label, bg }) => {
            const groupUnits = visibleUnits.filter((u) => u.group === key);
            if (groupUnits.length === 0) return null;
            return (
              <div key={key} className={styles.group}>
                <div className={styles.groupLabelVertical} style={{ background: bg }}>
                  <span>{label}</span>
                </div>
                <div className={styles.groupUnits}>
                  {groupUnits.map((unit) => (
                    <DraggableUnit key={unit.id} unit={unit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.column}>
          <div className={styles.columnHeader}>Conversion Factors</div>
          {visibleCFs.map((cf) => (
            <DraggableConversionFactor key={cf.id} cf={cf} />
          ))}
        </div>
      </div>
    </div>
  );
}
