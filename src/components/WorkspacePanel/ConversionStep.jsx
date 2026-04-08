import { useDroppable } from '@dnd-kit/core';
import styles from './ConversionStep.module.css';

function UnitSlot({ stepId, slot, unit, registerRef }) {
  const droppableId = `${stepId}-${slot}`;
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { stepId, slot, accepts: 'unit' },
  });

  const ref = (el) => {
    setNodeRef(el);
    registerRef(droppableId, el);
  };

  return (
    <div
      ref={ref}
      className={`${styles.unitSlot} ${isOver ? styles.slotOver : ''}`}
      style={unit ? { backgroundColor: unit.color, borderColor: unit.color } : {}}
      data-slot-id={droppableId}
    >
      {unit ? (
        <span className={styles.unitLabel}>{unit.label}</span>
      ) : (
        <span className={styles.placeholder}>drop unit</span>
      )}
    </div>
  );
}

function LabelSlot({ stepId, slot, label, cfColor }) {
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
      className={`${styles.labelSlot} ${isOver ? styles.slotOver : ''}`}
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

export default function ConversionStep({ step, onSlotDrop, onLabelDrop, onRemove, registerRef }) {
  // Wire up drops — App.jsx handles the DragEndEvent and calls these
  // The slot droppables above capture the drop targets; we expose handlers via props.

  if (step.type === 'given') {
    return (
      <div className={styles.stepWrap}>
        <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>
        <div className={styles.givenBox}>
          <span className={styles.givenLabel}>Given</span>
          <UnitSlot stepId={step.id} slot="given" unit={step.unit} registerRef={registerRef} />
        </div>
      </div>
    );
  }

  if (step.type === 'equals') {
    return (
      <div className={styles.stepWrap}>
        <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>
        <div className={styles.equalsBox}>
          <span className={styles.equalsSign}>=</span>
          <UnitSlot stepId={step.id} slot="equals" unit={step.unit} registerRef={registerRef} />
        </div>
      </div>
    );
  }

  // type === 'factor'
  return (
    <div className={styles.stepWrap}>
      <button className={styles.removeBtn} onClick={() => onRemove(step.id)}>×</button>
      <div className={styles.factorOuter}>
        <LabelSlot
          stepId={step.id}
          slot="label-top"
          label={step.cfLabel}
          cfColor={step.cfColor}
        />
        <div className={styles.fraction}>
          <UnitSlot stepId={step.id} slot="numerator" unit={step.numeratorUnit} registerRef={registerRef} />
          <div className={styles.dividerLine} />
          <UnitSlot stepId={step.id} slot="denominator" unit={step.denominatorUnit} registerRef={registerRef} />
        </div>
        <LabelSlot
          stepId={step.id}
          slot="label-bottom"
          label={step.cfLabel ? '' : null}
          cfColor={step.cfColor}
        />
      </div>
    </div>
  );
}
