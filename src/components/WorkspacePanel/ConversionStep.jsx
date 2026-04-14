import { useDroppable } from '@dnd-kit/core';
import styles from './ConversionStep.module.css';

const AVOGADRO = 6.022e23;

function fmtVal(v) {
  if (Math.abs(v - AVOGADRO) < 1e18) return '6.022×10²³';
  if (Math.abs(v) >= 1e15) return v.toExponential(3);
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return parseFloat(v.toPrecision(4)).toString();
}

function UnitSlot({ stepId, slot, unit, highlighted, onUnitClick }) {
  const droppableId = `${stepId}-${slot}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { stepId, slot, accepts: 'unit' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.unitSlot} ${isOver ? styles.slotOver : ''} ${highlighted && !unit ? styles.highlighted : ''} ${unit && onUnitClick ? styles.unitSlotClickable : ''}`}
      style={unit ? { backgroundColor: unit.color, borderColor: unit.color } : {}}
      data-slot-id={droppableId}
      onClick={unit && onUnitClick ? () => onUnitClick(unit, stepId, slot) : undefined}
    >
      {unit ? (
        <span className={styles.unitLabel}>{unit.label}</span>
      ) : (
        <span className={styles.placeholder}>drop unit</span>
      )}
    </div>
  );
}

function ValueSlot({ stepId, slot, value }) {
  const droppableId = `${stepId}-value-${slot}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { stepId, slot: `value-${slot}`, accepts: 'value' },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.valueSlot} ${isOver ? styles.valueSlotOver : ''}`}
      data-slot-id={droppableId}
    >
      {value != null ? (
        <span className={styles.valueLabel}>{fmtVal(value)}</span>
      ) : (
        <span className={styles.valuePlaceholder}>#</span>
      )}
    </div>
  );
}

function LabelSlot({ stepId, slot, label, cfColor, glow }) {
  const droppableId = `${stepId}-${slot}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { stepId, slot, accepts: 'conversionFactor' },
  });

  const bgStyle = cfColor
    ? { background: `linear-gradient(135deg, ${cfColor.a}, ${cfColor.b})` }
    : {};

  return (
    <div
      ref={setNodeRef}
      className={`${styles.labelSlot} ${isOver ? styles.slotOver : ''} ${glow && !label ? styles.labelGlow : ''}`}
      style={label ? bgStyle : {}}
    >
      {label ? (
        <span className={styles.labelText}>{label}</span>
      ) : (
        <span className={styles.placeholder}>drop label</span>
      )}
    </div>
  );
}

export default function ConversionStep({ step, mode, onSlotDrop, onLabelDrop, onRemove, highlighted, removable = true, onUnitClick }) {
  if (step.type === 'given') {
    return (
      <div className={styles.stepWrap}>
        {removable && <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>}
        <div className={styles.stepBox}>
          <div className={styles.stepHeader}>Given</div>
          <div className={styles.slotRow}>
            {mode === 'numbers' && (
              <ValueSlot stepId={step.id} slot="given" value={step.givenValue} />
            )}
            <UnitSlot stepId={step.id} slot="given" unit={step.unit} highlighted={highlighted} onUnitClick={onUnitClick} />
          </div>
        </div>
      </div>
    );
  }

  if (step.type === 'equals') {
    return (
      <div className={styles.stepWrap}>
        {removable && <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>}
        <div className={styles.stepBox}>
          <div className={styles.stepHeader}>Final</div>
          <div className={styles.slotRow}>
            <UnitSlot stepId={step.id} slot="equals" unit={step.unit} highlighted={highlighted} onUnitClick={onUnitClick} />
          </div>
        </div>
      </div>
    );
  }

  // type === 'factor'
  return (
    <div className={styles.stepWrap}>
      {removable && <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>}
      <div className={styles.stepBox}>
        <LabelSlot
          stepId={step.id}
          slot="label-top"
          label={step.cfLabelTop}
          cfColor={step.cfColorTop}
          glow={!step.cfLabelTop && (!!step.numeratorUnit || !!step.denominatorUnit)}
        />
        <div className={styles.fraction}>
          <div className={styles.slotRow}>
            {mode === 'numbers' && (
              <ValueSlot stepId={step.id} slot="numerator" value={step.numeratorValue} />
            )}
            <UnitSlot stepId={step.id} slot="numerator" unit={step.numeratorUnit} onUnitClick={onUnitClick} />
          </div>
          <div className={styles.dividerLine} />
          <div className={styles.slotRow}>
            {mode === 'numbers' && (
              <ValueSlot stepId={step.id} slot="denominator" value={step.denominatorValue} />
            )}
            <UnitSlot stepId={step.id} slot="denominator" unit={step.denominatorUnit} onUnitClick={onUnitClick} />
          </div>
        </div>
      </div>
    </div>
  );
}
