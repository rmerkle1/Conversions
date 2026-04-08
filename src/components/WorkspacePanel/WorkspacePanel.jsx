import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useDroppable } from '@dnd-kit/core';
import ConversionStep from './ConversionStep';
import ConnectionLines from './ConnectionLines';
import styles from './WorkspacePanel.module.css';

// A single workspace item can be:
//   { type: 'given',   id, unit }
//   { type: 'factor',  id, numeratorUnit, denominatorUnit, cfLabel, cfColor }
//   { type: 'equals',  id, unit }

let nextId = 1;
function makeId() { return nextId++; }

const WorkspacePanel = forwardRef(function WorkspacePanel(props, ref) {
  const [steps, setSteps] = useState([]);
  // stepRefs holds DOM refs keyed by `${stepId}-${slot}` for line drawing
  const stepRefs = useRef({});

  const { setNodeRef, isOver } = useDroppable({ id: 'workspace-canvas' });

  const registerRef = useCallback((key, el) => {
    if (el) stepRefs.current[key] = el;
    else delete stepRefs.current[key];
  }, []);

  useImperativeHandle(ref, () => ({ handleSlotDrop, handleLabelDrop }), [handleSlotDrop, handleLabelDrop]);

  // Called by App when a unit is dropped onto a workspace slot
  const handleSlotDrop = useCallback((stepId, slot, unit) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        if (s.type === 'given') return { ...s, unit };
        if (s.type === 'equals') return { ...s, unit };
        if (s.type === 'factor') {
          return slot === 'numerator'
            ? { ...s, numeratorUnit: unit }
            : { ...s, denominatorUnit: unit };
        }
        return s;
      })
    );
  }, []);

  const handleLabelDrop = useCallback((stepId, slot, cf) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, cfLabel: cf.label, cfColor: { a: cf.colorA, b: cf.colorB } } : s
      )
    );
  }, []);

  const addGiven = () =>
    setSteps((prev) => [...prev, { type: 'given', id: makeId(), unit: null }]);

  const addFactor = () =>
    setSteps((prev) => [
      ...prev,
      { type: 'factor', id: makeId(), numeratorUnit: null, denominatorUnit: null, cfLabel: null, cfColor: null },
    ]);

  const addEquals = () =>
    setSteps((prev) => [...prev, { type: 'equals', id: makeId(), unit: null }]);

  const removeStep = (id) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <span className={styles.panelTitle}>Roadmap</span>
        <button className={styles.toolBtn} onClick={addGiven}>+ Given</button>
        <button className={styles.toolBtn} onClick={addFactor}>+ Factor</button>
        <button className={styles.toolBtn} onClick={addEquals}>= Equals</button>
      </div>

      <div
        ref={setNodeRef}
        className={`${styles.canvas} ${isOver ? styles.canvasOver : ''}`}
      >
        {steps.length === 0 && (
          <p className={styles.empty}>
            Click <strong>+ Given</strong> to start, then add conversion factors.
          </p>
        )}

        <div className={styles.stepsRow}>
          {steps.map((step, idx) => (
            <ConversionStep
              key={step.id}
              step={step}
              onSlotDrop={handleSlotDrop}
              onLabelDrop={handleLabelDrop}
              onRemove={removeStep}
              registerRef={registerRef}
            />
          ))}
        </div>

        {/* SVG overlay for connection lines */}
        <ConnectionLines steps={steps} stepRefs={stepRefs} />
      </div>
    </div>
  );
});

export default WorkspacePanel;
