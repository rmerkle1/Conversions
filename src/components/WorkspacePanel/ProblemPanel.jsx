import { useState, useEffect } from 'react';
import { UNIT_COLORS } from '../../constants/units';
import styles from './ProblemPanel.module.css';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const PROMPT = {
  given: 'Click your starting unit in the problem',
  find:  'Click the unit you need to find',
};

const HINT_LABELS = ['Show Hint #1', 'Show Hint #2', 'Hide Hints'];

export default function ProblemPanel({
  problem,
  difficulty,
  selectionPhase,
  onDifficultyChange,
  onUnitSelect,
}) {
  const [hintLevel, setHintLevel] = useState(0);

  useEffect(() => { setHintLevel(0); }, [problem?.id]);

  function cycleHint() {
    setHintLevel((l) => (l + 1) % 3);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div data-tutorial="difficulty-btns" className={styles.diffToggle}>
          {Object.keys(DIFFICULTY_LABELS).map((d) => (
            <button
              key={d}
              className={`${styles.diffBtn} ${difficulty === d ? styles[`diff_${d}`] : ''}`}
              onClick={() => onDifficultyChange(d)}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {problem ? (
        <div className={styles.content}>
          {/* ── Left: equation + prompt + question ── */}
          <div className={styles.questionCol}>
            {problem.equation && (
              <div className={styles.equationBadge}>
                <span className={styles.equationLabel}>Reaction:</span>
                <span className={styles.equationText}>{problem.equation}</span>
              </div>
            )}

            {selectionPhase && (
              <div className={`${styles.prompt} ${styles[`prompt_${selectionPhase}`]}`}>
                {PROMPT[selectionPhase]}
              </div>
            )}

            <div data-tutorial="question-text" className={styles.questionText}>
              {problem.parts
                .filter((p) => typeof p === 'string' || (p.id !== undefined))
                .map((part, i) => {
                  if (typeof part === 'string') {
                    return part.split('\n').map((seg, j) => (
                      <span key={`${i}-${j}`}>
                        {j > 0 && <br />}
                        {seg}
                      </span>
                    ));
                  }
                  const color = UNIT_COLORS[part.id] ?? '#cdd6f4';
                  const clickable = !!selectionPhase;
                  return (
                    <span
                      key={i}
                      className={`${styles.unitToken} ${clickable ? styles.unitTokenClickable : ''}`}
                      style={{ color, borderBottomColor: `${color}88` }}
                      onClick={clickable ? () => onUnitSelect(part) : undefined}
                    >
                      {part.label}
                    </span>
                  );
                })}
            </div>

            {problem.parts.filter((p) => p.type === 'note').map((p, i) => (
              <p key={i} className={styles.noteText}>{p.text}</p>
            ))}
          </div>

          {/* ── Right: hints ── */}
          <div className={styles.hintCol}>
            <button className={styles.hintToggle} onClick={cycleHint}>
              {HINT_LABELS[hintLevel]}
            </button>

            {hintLevel >= 1 && (
              <div className={styles.hintCard}>
                <div className={styles.hintCardTitle}>Conversion Factors</div>
                <div className={styles.hintCardBody}>
                  {problem.path.join(' → ')}
                </div>
              </div>
            )}

            {hintLevel >= 2 && (
              <div className={styles.hintCard}>
                <div className={styles.hintCardTitle}>Setup</div>
                <div className={styles.hintCardBody + ' ' + styles.hintSetup}>
                  {problem.setupChain}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.empty}>Select a difficulty to get started.</div>
      )}
    </div>
  );
}
