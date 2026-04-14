import { useDraggable } from '@dnd-kit/core';
import styles from './NumberPanel.module.css';

function NumberChip({ num }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `number-chip-${num.id}`,
    data: { type: 'number', number: num },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`${styles.chip} ${isDragging ? styles.chipDragging : ''}`}
    >
      {num.label}
    </div>
  );
}

export default function NumberPanel({ mode, numberPool = [] }) {
  if (mode !== 'numbers') {
    return (
      <div className={`${styles.panel} ${styles.panelInactive}`}>
        <span className={styles.label}>Numbers</span>
        <span className={styles.hint}>Switch to Numbers mode to place values</span>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <span className={styles.label}>Numbers</span>
      <div className={styles.chips}>
        {numberPool.map((num) => (
          <NumberChip key={num.id} num={num} />
        ))}
      </div>
      <span className={styles.hint}>Drag into the # slots</span>
    </div>
  );
}
