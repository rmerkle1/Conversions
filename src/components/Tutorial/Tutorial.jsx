import { useLayoutEffect, useState } from 'react';
import styles from './Tutorial.module.css';

/**
 * Step definitions for the first-time user tutorial.
 *
 * type: 'modal'     → full-screen centred overlay (welcome / done)
 * type: 'spotlight' → dim everything except a DOM element identified by
 *                     data-tutorial="<target>" + show a tooltip bubble
 *
 * manualAdvance: true → show a "Got it" button; otherwise the tutorial
 *                       advances automatically when the relevant app state
 *                       changes (handled in App.jsx / WorkspacePanel.jsx).
 */
export const TUTORIAL_STEPS = [
  /* 0 */
  {
    type: 'modal',
    title: 'Welcome to Conversions!',
    body: "This app helps you solve chemistry dimensional analysis problems step by step. Let's walk through your first problem together so you know exactly what to do.",
    primaryLabel: 'Start Tutorial',
    secondaryLabel: 'Skip',
  },
  /* 1 – click given unit */
  {
    target: 'question-text',
    placement: 'right',
    body: "Click your starting unit in the problem — it's underlined. That unit becomes the first box in your conversion chain below.",
  },
  /* 2 – click final unit */
  {
    target: 'question-text',
    placement: 'right',
    body: "Now click the final unit — the unit you're converting to. Watch the second box appear in the workspace below!",
  },
  /* 3 – create conversion factor */
  {
    target: 'workspace-canvas',
    placement: 'above',
    body: 'Move your cursor over the workspace below. Lower it to reveal a ghost conversion factor, then click to place it!',
  },
  /* 4 – open palette */
  {
    target: 'palette-toggle',
    placement: 'right',
    body: 'Open the Units & Factors panel by clicking this button. You can drag units onto your conversion factor from here.',
  },
  /* 5 – drag unit onto factor */
  {
    target: 'palette-panel',
    placement: 'right',
    body: 'The conversion factor has one unit placed already. Drag a unit from this panel onto the empty slot to complete the pair — the denominator cancels the numerator!',
  },
  /* 6 – drag conversion factor label */
  {
    target: 'palette-panel',
    placement: 'right',
    body: "Now drag a conversion factor name from the right column onto the glowing slot at the top of the conversion factor.",
  },
  /* 7 – submit */
  {
    target: 'submit-btn',
    placement: 'left',
    body: 'Your conversion factor is complete! Click Submit to check whether your units cancel correctly.',
  },
  /* 8 – next problem */
  {
    target: 'next-btn',
    placement: 'left',
    body: 'Click Next to move on to a new problem.',
  },
  /* 8 – difficulty selector */
  {
    target: 'difficulty-btns',
    placement: 'below',
    manualAdvance: true,
    body: 'Change difficulty here. Easy = one-step conversions. Medium = multi-step. Hard = molar ratios between two compounds.',
  },
  /* 9 – mode toggle */
  {
    target: 'mode-switch',
    placement: 'below',
    manualAdvance: true,
    body: 'Toggle between Units mode (set up unit cancellation) and Numbers mode (fill in actual values for a numerical answer).',
  },
  /* 10 – unit roadmap */
  {
    target: 'roadmap-panel',
    placement: 'left',
    manualAdvance: true,
    body: "The Unit Map visualizes how all unit types connect. Units you place in the workspace will light up here, showing your conversion path at a glance.",
  },
  /* 11 – done */
  {
    type: 'modal',
    title: "You're all set!",
    body: "Units in the denominator cancel matching units in the numerator. Build your chain until you reach the final unit. Have fun solving!",
    primaryLabel: 'Start solving!',
  },
];

// Number of non-modal tutorial steps (used for the "Step N of M" counter)
const TOTAL_GUIDED = TUTORIAL_STEPS.filter((s) => !s.type).length;

/* ── Tooltip positioning ────────────────────────────────────────────── */

function computeTooltipStyle(rect, placement) {
  if (!rect) return { left: 20, top: 100 };
  const gap = 14;
  const maxW = 300;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampL = (l) => Math.max(10, Math.min(l, vw - maxW - 10));
  const clampT = (t) => Math.max(10, Math.min(t, vh - 180));

  switch (placement) {
    case 'below': return { left: clampL(rect.left), top: rect.bottom + gap };
    case 'above': return { left: clampL(rect.left), top: rect.top - gap, transform: 'translateY(-100%)' };
    case 'right': return { left: Math.min(rect.right + gap, vw - maxW - 10), top: clampT(rect.top) };
    case 'left':  return { left: Math.max(10, rect.left - maxW - gap), top: clampT(rect.top) };
    default:      return { left: 20, top: 100 };
  }
}

/* ── Component ──────────────────────────────────────────────────────── */

export default function Tutorial({ step, onAdvance, onSkip }) {
  const [targetRect, setTargetRect] = useState(null);

  const current = (step >= 0 && step < TUTORIAL_STEPS.length) ? TUTORIAL_STEPS[step] : null;

  // Measure (and re-measure) the spotlight target element after each step change.
  useLayoutEffect(() => {
    if (!current || current.type === 'modal') { setTargetRect(null); return; }

    function measure() {
      const el = document.querySelector(`[data-tutorial="${current.target}"]`);
      setTargetRect(el ? el.getBoundingClientRect() : null);
    }

    measure();
    // Re-measure after a short delay to catch layout transitions (e.g. palette opening)
    const t = setTimeout(measure, 130);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  /* ── Modal variant ─────────────────────────────────────────────────── */
  if (current.type === 'modal') {
    return (
      <div className={styles.modalBackdrop}>
        <div className={styles.modal}>
          <h2 className={styles.modalTitle}>{current.title}</h2>
          <p className={styles.modalBody}>{current.body}</p>
          <div className={styles.modalActions}>
            <button className={styles.btnPrimary} onClick={onAdvance}>
              {current.primaryLabel}
            </button>
            {current.secondaryLabel && (
              <button className={styles.btnSecondary} onClick={onSkip}>
                {current.secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Spotlight + tooltip variant ───────────────────────────────────── */

  // Derive a 1-based step number among guided (non-modal) steps only
  const guidedNum = TUTORIAL_STEPS.slice(0, step + 1).filter((s) => !s.type).length;
  const tooltipStyle = { position: 'fixed', ...computeTooltipStyle(targetRect, current.placement) };

  return (
    <>
      {targetRect && (
        <div
          className={styles.spotlight}
          style={{
            left:   targetRect.left   - 8,
            top:    targetRect.top    - 8,
            width:  targetRect.width  + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      <div className={styles.tooltip} style={tooltipStyle}>
        <p className={styles.tooltipBody}>{current.body}</p>
        <div className={styles.tooltipFooter}>
          <span className={styles.stepCount}>Step {guidedNum} of {TOTAL_GUIDED}</span>
          <div className={styles.tooltipActions}>
            {current.manualAdvance && (
              <button className={styles.btnGotIt} onClick={onAdvance}>Got it</button>
            )}
            <button className={styles.btnSkipLink} onClick={onSkip}>Skip tutorial</button>
          </div>
        </div>
      </div>
    </>
  );
}
