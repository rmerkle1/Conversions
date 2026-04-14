import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { UNITS, UNIT_COLORS } from '../../constants/units';
import { validateUnits, validateNumbers } from '../../utils/validateWorkspace';
import ConversionStep from './ConversionStep';
import ConnectionLines from './ConnectionLines';
import UnitRoadmap from './UnitRoadmap';
import ProblemPanel from './ProblemPanel';
import NumberPanel from '../NumberPanel/NumberPanel';
import styles from './WorkspacePanel.module.css';

// Circle membership for mol role auto-assignment
const MASS_CIRCLE      = new Set(['kg', 'g', 'mg']);
const PARTICLES_CIRCLE = new Set(['mlcls', 'atoms', 'ions']);
const VOLUME_CIRCLE    = new Set(['L', 'mL']);

// Determine whether a pending mol unit should become mol_A or mol_B based on context.
// Called before the drop is applied, so stepsRef.current reflects pre-drop state.
function determineMolRole(steps) {
  const placedA = steps.some((s) =>
    [s.unit, s.numeratorUnit, s.denominatorUnit].some((u) => u?.id === 'mol_A')
  );
  const placedB = steps.some((s) =>
    [s.unit, s.numeratorUnit, s.denominatorUnit].some((u) => u?.id === 'mol_B')
  );
  if (placedA && !placedB) return 'mol_B';
  if (placedB && !placedA) return 'mol_A';
  if (placedA && placedB)  return 'mol_A';

  // First mol placed — determine from given/equals circle membership
  const givenId  = steps.find((s) => s.type === 'given')?.unit?.id;
  const equalsId = steps.find((s) => s.type === 'equals')?.unit?.id;
  if (MASS_CIRCLE.has(givenId))      return 'mol_A';
  if (PARTICLES_CIRCLE.has(givenId)) return 'mol_B';
  if (VOLUME_CIRCLE.has(givenId)) {
    if (MASS_CIRCLE.has(equalsId))      return 'mol_B';
    if (PARTICLES_CIRCLE.has(equalsId)) return 'mol_A';
  }
  return 'mol_A';
}

let nextId = 1;
function makeId() { return nextId++; }

function freshSteps() {
  return [
    { type: 'given',  id: makeId(), unit: null, givenValue: null },
    { type: 'equals', id: makeId(), unit: null },
  ];
}

const WorkspacePanel = forwardRef(function WorkspacePanel(
  { problem, difficulty, onDifficultyChange, onNewProblem, mode, onModeChange, onReadyForFactors, tutorialStep, onTutorialAdvance },
  ref
) {
  const [steps, setSteps] = useState(freshSteps);
  const [pairingUnit, setPairingUnit] = useState(null);
  const [mouseCanvas, setMouseCanvas] = useState(null);
  const [mouseViewport, setMouseViewport] = useState(null);
  const [selectionPhase, setSelectionPhase] = useState('given');
  const [pendingPairing, setPendingPairing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [roadmapOpen, setRoadmapOpen] = useState(true);
  const [roadmapExpanded, setRoadmapExpanded] = useState(false);

  const selectedGivenRef = useRef({ unit: null, stepId: null });
  const stepsRef = useRef(steps);
  useEffect(() => { stepsRef.current = steps; }, [steps]);

  const canvasRef = useRef(null);
  const lastDropRef = useRef(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'workspace-canvas' });

  const readyForFactors = useMemo(() => {
    const given  = steps.find((s) => s.type === 'given');
    const equals = steps.find((s) => s.type === 'equals');
    return !!(given?.unit && equals?.unit);
  }, [steps]);

  useEffect(() => {
    onReadyForFactors?.(readyForFactors);
  }, [readyForFactors, onReadyForFactors]);

  useEffect(() => { setFeedback(null); }, [steps]);

  // ── Tutorial auto-advance hooks ──────────────────────────────────────
  // Step 1: given unit clicked → selectionPhase transitions to 'find'
  useEffect(() => {
    if (tutorialStep === 1 && selectionPhase === 'find') onTutorialAdvance?.();
  }, [selectionPhase, tutorialStep, onTutorialAdvance]);

  // Step 2: final unit clicked → selectionPhase null & readyForFactors
  useEffect(() => {
    if (tutorialStep === 2 && !selectionPhase && readyForFactors) onTutorialAdvance?.();
  }, [selectionPhase, readyForFactors, tutorialStep, onTutorialAdvance]);

  // Step 3: a conversion factor step was placed
  useEffect(() => {
    if (tutorialStep === 3 && steps.some((s) => s.type === 'factor')) onTutorialAdvance?.();
  }, [steps, tutorialStep, onTutorialAdvance]);

  // Step 5: both slots on a conversion factor are filled (user dragged the missing unit)
  // The factor is created with one slot pre-filled (the pairing unit goes into the denominator),
  // so we require BOTH slots to ensure the user actually drags from the palette.
  useEffect(() => {
    if (
      tutorialStep === 5 &&
      steps.some((s) => s.type === 'factor' && s.numeratorUnit && s.denominatorUnit)
    ) onTutorialAdvance?.();
  }, [steps, tutorialStep, onTutorialAdvance]);

  // Step 6: a conversion factor label has been dragged onto any factor step
  useEffect(() => {
    if (tutorialStep === 6 && steps.some((s) => s.type === 'factor' && s.cfLabelTop)) {
      onTutorialAdvance?.();
    }
  }, [steps, tutorialStep, onTutorialAdvance]);

  // Step 7: feedback appeared after Submit (was step 6 before CF label step was added)
  useEffect(() => {
    if (tutorialStep === 7 && feedback) onTutorialAdvance?.();
  }, [feedback, tutorialStep, onTutorialAdvance]);
  // ── End tutorial hooks ───────────────────────────────────────────────

  // Auto-collapse roadmap when steps overflow the canvas width
  useEffect(() => {
    if (!roadmapOpen) return;
    const raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas && canvas.scrollWidth > canvas.clientWidth) {
        setRoadmapOpen(false);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [steps, roadmapOpen]);

  useEffect(() => {
    if (!problem) return;
    const fresh = freshSteps();
    setSteps(fresh);
    setPairingUnit(null);
    setPendingPairing(false);
    setMouseCanvas(null);
    setMouseViewport(null);
    setSelectionPhase('given');
    setFeedback(null);
  }, [problem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnitSelect = useCallback((partUnit) => {
    let unit = UNITS.find((u) => u.id === partUnit.id);
    if (!unit) return;
    // Override unit labels with compound-specific labels from current problem.
    // For hard problems, selectionPhase 'find' targets compound[1] (the equals compound).
    const compounds = problem?.compounds ?? [];
    const cpdIdx = selectionPhase === 'find' && compounds.length > 1 ? 1 : 0;
    const cpd0 = compounds[0];
    const cpd1 = compounds[cpdIdx];
    if (unit.id === 'g' && cpd1) {
      unit = { ...unit, label: `g ${cpd1.formula}` };
    } else if (unit.id === 'L' && cpd1) {
      unit = { ...unit, label: `L ${cpd1.formula}` };
    } else if (unit.id === 'mol' && cpd0) {
      unit = { ...unit, label: `mol ${cpd0.formula}` };
    } else if (unit.id === 'mol_A' && cpd0) {
      unit = { ...unit, label: `mol ${cpd0.formula}` };
    } else if (unit.id === 'mol_B' && compounds.length > 1) {
      unit = { ...unit, label: `mol ${compounds[1].formula}` };
    }
    const current = stepsRef.current;

    if (selectionPhase === 'given') {
      const givenStep = current[0];
      selectedGivenRef.current = { unit, stepId: givenStep.id };
      setSteps((prev) => prev.map((s, i) => (i === 0 ? { ...s, unit } : s)));
      setSelectionPhase('find');
    } else if (selectionPhase === 'find') {
      const eqIdx = current.findIndex((s) => s.type === 'equals');
      if (eqIdx !== -1) {
        setSteps((prev) => prev.map((s, i) => (i === eqIdx ? { ...s, unit } : s)));
      }
      setSelectionPhase(null);
      setMouseCanvas(null);
      setMouseViewport(null);
      setPendingPairing(true);
    }
  }, [selectionPhase, problem]);

  // Click a placed unit to (re-)initiate pairing from that slot
  const handleUnitClick = useCallback((unit, stepId, slot) => {
    if (selectionPhase) return;
    setPairingUnit({ unit, sourceStepId: stepId, sourceSlot: slot });
  }, [selectionPhase]);

  const handleSlotDrop = useCallback((stepId, slot, unit) => {
    // Resolve pending units (hard problems with compound-specific g/L/mol variants)
    let resolvedUnit = unit;
    if (unit.isPendingMol) {
      const role = determineMolRole(stepsRef.current);
      resolvedUnit = { id: role, label: unit.label, color: UNIT_COLORS[role], group: 'Moles' };
    } else if (unit.isPendingUnit) {
      resolvedUnit = { id: unit.resolvedId, label: unit.label, color: unit.color, group: unit.group };
    }
    lastDropRef.current = { stepId, slot, unit: resolvedUnit };
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        if (s.type === 'given')  return { ...s, unit: resolvedUnit };
        if (s.type === 'equals') return { ...s, unit: resolvedUnit };
        if (s.type === 'factor') {
          return slot === 'numerator'
            ? { ...s, numeratorUnit: resolvedUnit }
            : { ...s, denominatorUnit: resolvedUnit };
        }
        return s;
      })
    );
  }, []);

  const handleLabelDrop = useCallback((stepId, slot, cf) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        const color = { a: cf.colorA, b: cf.colorB };
        if (slot === 'label-top') return { ...s, cfLabelTop: cf.label, cfColorTop: color };
        return s;
      })
    );
  }, []);

  const handleValueDrop = useCallback((stepId, slot, number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id !== stepId) return s;
        if (slot === 'value-given')       return { ...s, givenValue: number.value };
        if (slot === 'value-numerator')   return { ...s, numeratorValue: number.value };
        if (slot === 'value-denominator') return { ...s, denominatorValue: number.value };
        return s;
      })
    );
  }, []);

  useImperativeHandle(ref, () => ({ handleSlotDrop, handleLabelDrop, handleValueDrop }), [handleSlotDrop, handleLabelDrop, handleValueDrop]);

  useEffect(() => {
    if (selectionPhase) { lastDropRef.current = null; return; }
    const drop = lastDropRef.current;
    if (!drop) return;
    lastDropRef.current = null;

    let count = 0;
    steps.forEach((s) => {
      if (s.type === 'given'  && s.unit?.id === drop.unit.id) count++;
      if (s.type === 'equals' && s.unit?.id === drop.unit.id) count++;
      if (s.type === 'factor') {
        if (s.numeratorUnit?.id   === drop.unit.id) count++;
        if (s.denominatorUnit?.id === drop.unit.id) count++;
      }
    });

    if (count === 1) {
      setPairingUnit({ unit: drop.unit, sourceStepId: drop.stepId, sourceSlot: drop.slot });
    } else {
      setPairingUnit(null);
    }
  }, [steps, selectionPhase]);

  useEffect(() => {
    if (!pairingUnit) return;
    const onKey = (e) => { if (e.key === 'Escape') setPairingUnit(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pairingUnit]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMouseCanvas({
      x: e.clientX - rect.left + canvas.scrollLeft,
      y: e.clientY - rect.top,
    });
    setMouseViewport({ x: e.clientX, y: e.clientY });
    if (pendingPairing) {
      const { unit: givenUnit, stepId: givenStepId } = selectedGivenRef.current;
      if (givenUnit && givenStepId) {
        setPairingUnit({ unit: givenUnit, sourceStepId: givenStepId, sourceSlot: 'given' });
      }
      setPendingPairing(false);
    }
  }, [pendingPairing]);

  const handleMouseLeave = useCallback(() => {
    setMouseCanvas(null);
    setMouseViewport(null);
  }, []);

  const handleGhostClick = useCallback((type) => {
    if (!pairingUnit) return;
    const { unit, sourceSlot } = pairingUnit;

    setSteps((prev) => {
      if (type === 'factor') {
        const pairSlot = sourceSlot === 'denominator' ? 'numerator' : 'denominator';
        const newFactor = {
          type: 'factor',
          id: makeId(),
          numeratorUnit:    pairSlot === 'numerator'   ? unit : null,
          denominatorUnit:  pairSlot === 'denominator' ? unit : null,
          cfLabelTop:       null,
          cfColorTop:       null,
          numeratorValue:   null,
          denominatorValue: null,
        };
        const eqIdx = prev.findIndex((s) => s.type === 'equals');
        if (eqIdx === -1) return [...prev, newFactor];
        return [...prev.slice(0, eqIdx), newFactor, ...prev.slice(eqIdx)];
      } else {
        return [...prev, { type: 'equals', id: makeId(), unit }];
      }
    });

    setPairingUnit(null);
  }, [pairingUnit]);

  const removeStep = (id) =>
    setSteps((prev) => prev.filter((s) => s.id !== id));

  const resetAll = () => {
    setSteps(freshSteps());
    setPairingUnit(null);
    setPendingPairing(false);
    setMouseCanvas(null);
    setMouseViewport(null);
    setSelectionPhase('given');
    setFeedback(null);
  };

  const handleSubmit = useCallback(() => {
    const unitResult = validateUnits(steps);
    if (!unitResult.ok) {
      setFeedback({ ok: false, message: unitResult.message });
      return;
    }
    if (mode === 'numbers' && problem) {
      const numResult = validateNumbers(steps, problem.answer);
      setFeedback({ ok: numResult.ok, message: numResult.message });
      return;
    }
    setFeedback({ ok: true, message: unitResult.message });
  }, [steps, mode, problem]);

  const handleModeToggle = useCallback(() => {
    onModeChange(mode === 'units' ? 'numbers' : 'units');
    setFeedback(null);
  }, [mode, onModeChange]);

  let ghostType = null;
  if (pairingUnit && mouseCanvas && canvasRef.current) {
    const canvas = canvasRef.current;
    const sourceEl = canvas.querySelector(
      `[data-slot-id="${pairingUnit.sourceStepId}-${pairingUnit.sourceSlot}"]`
    );
    if (sourceEl) {
      const sourceY = sourceEl.getBoundingClientRect().top - canvas.getBoundingClientRect().top + 4;
      ghostType = (mouseCanvas.y - sourceY) > 35 ? 'factor' : null;
    }
  }

  const equalsIdx = steps.findIndex((s) => s.type === 'equals');
  const insertAt = equalsIdx === -1 ? steps.length : equalsIdx;

  const stepProps = (step) => ({
    key: step.id,
    step,
    mode,
    onSlotDrop:  handleSlotDrop,
    onLabelDrop: handleLabelDrop,
    onRemove:    removeStep,
    highlighted:
      (selectionPhase === 'given' && step.type === 'given') ||
      (selectionPhase === 'find'  && step.type === 'equals'),
    removable:   step.type === 'factor',
    onUnitClick: handleUnitClick,
  });

  return (
    <div className={styles.panel}>

      {/* ── Left: main workspace ── */}
      <div className={styles.workspaceMain}>
        <ProblemPanel
          problem={problem}
          difficulty={difficulty}
          selectionPhase={selectionPhase}
          onDifficultyChange={onDifficultyChange}
          onUnitSelect={handleUnitSelect}
        />

        {/* Toolbar: just the mode switch */}
        <div className={styles.toolbar}>
          <div className={styles.modeSwitch} data-tutorial="mode-switch" onClick={handleModeToggle} title={mode === 'units' ? 'Switch to Numbers mode' : 'Switch to Units mode'}>
            <span className={`${styles.modeLabel} ${mode === 'units' ? styles.modeLabelActive : ''}`}>Units</span>
            <div className={`${styles.switchTrack} ${mode === 'numbers' ? styles.switchOn : ''}`}>
              <div className={styles.switchThumb} />
            </div>
            <span className={`${styles.modeLabel} ${mode === 'numbers' ? styles.modeLabelActive : ''}`}>123</span>
          </div>
        </div>

        {feedback && (
          <div className={`${styles.feedbackBanner} ${feedback.ok ? styles.feedbackOk : styles.feedbackErr}`}>
            <span className={styles.feedbackMsg}>{feedback.message}</span>
            <button className={styles.feedbackClose} onClick={() => setFeedback(null)}>×</button>
          </div>
        )}

        {/* Canvas area: canvas + numbers | action sidebar */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasCol}>
            <div
              ref={(el) => { setNodeRef(el); canvasRef.current = el; }}
              data-tutorial="workspace-canvas"
              className={`${styles.canvas} ${isOver ? styles.canvasOver : ''}`}
              onMouseMove={(pairingUnit || pendingPairing) ? handleMouseMove : undefined}
              onMouseLeave={(pairingUnit || pendingPairing) ? handleMouseLeave : undefined}
            >
              <div className={styles.stepsRow}>
                {steps.slice(0, insertAt).map((step) => (
                  <ConversionStep {...stepProps(step)} />
                ))}

                {pairingUnit && ghostType === 'factor' && (
                  <div
                    className={styles.ghostStep}
                    onClick={() => handleGhostClick('factor')}
                    title="Click to add conversion factor"
                  >
                    <div className={styles.ghostBox}>
                      <div className={styles.ghostHeader} />
                      <div className={styles.ghostFraction}>
                        <div className={styles.ghostSlotRow}>
                          {mode === 'numbers' && (
                            <div className={styles.ghostValueSlot}>
                              <span className={styles.ghostPlaceholder}>#</span>
                            </div>
                          )}
                          <div className={styles.ghostSlot}>
                            <span className={styles.ghostPlaceholder}>drop unit</span>
                          </div>
                        </div>
                        <div className={styles.ghostDivider} />
                        <div className={styles.ghostSlotRow}>
                          {mode === 'numbers' && (
                            <div className={styles.ghostValueSlot}>
                              <span className={styles.ghostPlaceholder}>#</span>
                            </div>
                          )}
                          <div className={styles.ghostSlot}>
                            <span className={styles.ghostPlaceholder}>drop unit</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {steps.slice(insertAt).map((step) => (
                  <ConversionStep {...stepProps(step)} />
                ))}
              </div>

              <ConnectionLines
                steps={steps}
                canvasRef={canvasRef}
                pairingUnit={pairingUnit}
                mouseCanvas={mouseCanvas}
                mode={mode}
              />
            </div>

            {/* Numbers panel — directly below steps */}
            <NumberPanel mode={mode} numberPool={problem?.numberPool ?? []} />
          </div>

          {/* Action sidebar: Submit / Next / Reset */}
          <div className={styles.actionSidebar}>
            <button data-tutorial="submit-btn" className={`${styles.actionBtn} ${styles.actionSubmit}`} onClick={handleSubmit}>
              <span>Submit</span>
            </button>
            <button data-tutorial="next-btn" className={`${styles.actionBtn} ${styles.actionNext}`} onClick={onNewProblem}>
              <span>Next</span>
            </button>
            <button className={`${styles.actionBtn} ${styles.actionReset}`} onClick={resetAll}>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: unit roadmap sidebar ── */}
      <div data-tutorial="roadmap-panel" className={`${styles.roadmapPanel} ${roadmapOpen ? styles.roadmapOpen : styles.roadmapClosed}`}>
        {roadmapOpen ? (
          <>
            <div className={styles.roadmapHeader}>
              <span className={styles.roadmapTitle}>Unit Map</span>
              <button className={styles.roadmapCollapseBtn} onClick={() => setRoadmapOpen(false)}>›</button>
            </div>
            <div
              className={styles.roadmapClickable}
              onClick={() => setRoadmapExpanded(true)}
              title="Click to expand"
            >
              <UnitRoadmap steps={steps} difficulty={difficulty} />
            </div>
          </>
        ) : (
          <button className={styles.roadmapToggleBtn} onClick={() => setRoadmapOpen(true)}>
            <span className={styles.roadmapExpandIcon}>‹</span>
            <span className={styles.roadmapToggleText}>Unit Map</span>
          </button>
        )}
      </div>

      {/* ── Roadmap expanded modal ── */}
      {roadmapExpanded && (
        <div className={styles.roadmapModal} onClick={() => setRoadmapExpanded(false)}>
          <div className={styles.roadmapModalInner} onClick={(e) => e.stopPropagation()}>
            <div className={styles.roadmapModalHeader}>
              <span className={styles.roadmapTitle}>Unit Map</span>
              <button className={styles.roadmapCollapseBtn} onClick={() => setRoadmapExpanded(false)}>×</button>
            </div>
            <UnitRoadmap steps={steps} difficulty={difficulty} />
          </div>
        </div>
      )}

      {/* Cursor pill */}
      {pairingUnit && mouseViewport && (
        <div
          className={styles.cursorPill}
          style={{
            left: mouseViewport.x + 14,
            top:  mouseViewport.y - 12,
            backgroundColor: pairingUnit.unit.color,
          }}
        >
          {pairingUnit.unit.label}
        </div>
      )}
    </div>
  );
});

export default WorkspacePanel;
