import { useRef, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import WorkspacePanel from './components/WorkspacePanel/WorkspacePanel';
import PalettePanel from './components/PalettePanel/PalettePanel';
import Tutorial, { TUTORIAL_STEPS } from './components/Tutorial/Tutorial';
import { generateProblem } from './utils/generateProblem';
import styles from './App.module.css';

export default function App() {
  const workspaceRef = useRef(null);
  const [activeItem, setActiveItem] = useState(null);

  const [difficulty, setDifficulty] = useState('easy');
  const [problem, setProblem] = useState(() => generateProblem('easy'));
  const [mode, setMode] = useState('units');

  // Palette panel state
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [readyForFactors, setReadyForFactors] = useState(false);

  // ── Tutorial state ───────────────────────────────────────────────────
  const [tutorialStep, setTutorialStep] = useState(() => {
    try { return localStorage.getItem('conversionsTutorialDone') ? -1 : 0; }
    catch { return 0; }
  });

  const handleTutorialAdvance = useCallback(() => {
    setTutorialStep((s) => {
      const next = s + 1;
      if (next >= TUTORIAL_STEPS.length) {
        try { localStorage.setItem('conversionsTutorialDone', '1'); } catch {}
        return -1;
      }
      return next;
    });
  }, []);

  const handleTutorialSkip = useCallback(() => {
    try { localStorage.setItem('conversionsTutorialDone', '1'); } catch {}
    setTutorialStep(-1);
  }, []);

  const handleTutorialRestart = useCallback(() => {
    setTutorialStep(0);
  }, []);

  // When tutorial advances to step 1, ensure we're on easy with a fresh problem
  // so the guided flow starts clean.
  const prevTutorialStep = useRef(tutorialStep);
  useEffect(() => {
    if (tutorialStep === 1 && prevTutorialStep.current === 0) {
      handleDifficultyChange('easy'); // eslint-disable-line react-hooks/exhaustive-deps
    }
    prevTutorialStep.current = tutorialStep;
  }, [tutorialStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 4: auto-advance when palette is opened
  useEffect(() => {
    if (tutorialStep === 4 && paletteOpen) handleTutorialAdvance();
  }, [paletteOpen, tutorialStep, handleTutorialAdvance]);

  // Step 8: auto-advance when a new problem is loaded (user clicked Next)
  // (was step 7 before the CF label tutorial step was inserted at index 6)
  const prevProblemId = useRef(null);
  useEffect(() => {
    if (
      tutorialStep === 8 &&
      prevProblemId.current !== null &&
      problem?.id !== prevProblemId.current
    ) {
      handleTutorialAdvance();
    }
    prevProblemId.current = problem?.id ?? null;
  }, [problem?.id, tutorialStep, handleTutorialAdvance]);
  // ── End tutorial state ───────────────────────────────────────────────

  const handleDifficultyChange = useCallback((d) => {
    setDifficulty(d);
    setProblem(generateProblem(d));
    setReadyForFactors(false);
  }, []);

  const handleNewProblem = useCallback(() => {
    setProblem(generateProblem(difficulty));
    setReadyForFactors(false);
  }, [difficulty]);

  const handleModeChange = useCallback((m) => {
    setMode(m);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragStart({ active }) {
    setActiveItem(active.data.current ?? null);
  }

  function handleDragEnd({ active, over }) {
    setActiveItem(null);
    if (!over) return;

    const dragData = active.data.current;
    const dropData = over.data.current;
    if (!dragData || !dropData) return;

    const { stepId, slot, accepts } = dropData;

    if (dragData.type === 'unit' && accepts === 'unit') {
      workspaceRef.current?.handleSlotDrop(stepId, slot, dragData.unit);
    }

    if (dragData.type === 'conversionFactor' && accepts === 'conversionFactor') {
      workspaceRef.current?.handleLabelDrop(stepId, slot, dragData.conversionFactor);
    }

    if (dragData.type === 'number' && accepts === 'value') {
      workspaceRef.current?.handleValueDrop(stepId, slot, dragData.number);
    }
  }

  const mainStyle = {
    gridTemplateColumns: `${paletteOpen ? '240px' : '40px'} 1fr`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.layout}>
        <header className={styles.header}>
          <span className={styles.appName}>Conversions</span>
          <span className={styles.subtitle}>Dimensional Analysis Builder</span>
          <button
            className={styles.helpBtn}
            onClick={handleTutorialRestart}
            title="Restart tutorial"
          >?</button>
        </header>

        <main className={styles.main} style={mainStyle}>
          <PalettePanel
            difficulty={difficulty}
            problem={problem}
            open={paletteOpen}
            onToggle={() => setPaletteOpen((p) => !p)}
            glow={readyForFactors && !paletteOpen}
          />
          <WorkspacePanel
            ref={workspaceRef}
            problem={problem}
            difficulty={difficulty}
            onDifficultyChange={handleDifficultyChange}
            onNewProblem={handleNewProblem}
            mode={mode}
            onModeChange={handleModeChange}
            onReadyForFactors={setReadyForFactors}
            tutorialStep={tutorialStep}
            onTutorialAdvance={handleTutorialAdvance}
          />
        </main>
      </div>

      {tutorialStep >= 0 && (
        <Tutorial
          step={tutorialStep}
          onAdvance={handleTutorialAdvance}
          onSkip={handleTutorialSkip}
        />
      )}

      <DragOverlay>
        {activeItem?.type === 'unit' && (
          <div
            style={{
              backgroundColor: activeItem.unit.color,
              padding: '7px 16px',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 14,
              color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              cursor: 'grabbing',
            }}
          >
            {activeItem.unit.label}
          </div>
        )}
        {activeItem?.type === 'conversionFactor' && (
          <div
            style={{
              background: `linear-gradient(135deg, ${activeItem.conversionFactor.colorA}, ${activeItem.conversionFactor.colorB})`,
              padding: '7px 14px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 12,
              color: '#fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              cursor: 'grabbing',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            {activeItem.conversionFactor.label}
          </div>
        )}
        {activeItem?.type === 'number' && (
          <div
            style={{
              background: '#f0f4f8',
              border: '1px solid #d1d9e0',
              padding: '5px 14px',
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              color: '#c08800',
              fontFamily: "'Courier New', monospace",
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              cursor: 'grabbing',
            }}
          >
            {activeItem.number.label}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
