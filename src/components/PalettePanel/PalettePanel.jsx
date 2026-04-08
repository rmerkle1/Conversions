import { useDraggable } from '@dnd-kit/core';
import { UNITS, CONVERSION_FACTORS } from '../../constants/units';
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

const UNIT_GROUPS = ['Metric', 'Moles', 'Volume', 'Particles'];

export default function PalettePanel() {
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Palette</h3>
      <div className={styles.columns}>
        {/* Column 1: Units */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>Units</div>
          {UNIT_GROUPS.map((group) => (
            <div key={group} className={styles.group}>
              <div className={styles.groupLabel}>{group}</div>
              {UNITS.filter((u) => u.group === group).map((unit) => (
                <DraggableUnit key={unit.id} unit={unit} />
              ))}
            </div>
          ))}
        </div>

        {/* Column 2: Conversion Factor Names */}
        <div className={styles.column}>
          <div className={styles.columnHeader}>Conversion Factors</div>
          {CONVERSION_FACTORS.map((cf) => (
            <DraggableConversionFactor key={cf.id} cf={cf} />
          ))}
        </div>
      </div>
    </div>
  );
}
