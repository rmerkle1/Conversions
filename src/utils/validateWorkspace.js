/**
 * Validates that units cancel correctly through the workspace chain.
 * Returns { ok: boolean, message: string }
 */
export function validateUnits(steps) {
  const givens  = steps.filter((s) => s.type === 'given');
  const factors = steps.filter((s) => s.type === 'factor');
  const equals  = steps.find((s)  => s.type === 'equals');

  if (!givens.length || !givens[0].unit) {
    return { ok: false, message: 'Set the given unit first.' };
  }
  if (!equals?.unit) {
    return { ok: false, message: 'Set the target unit (= Equals) first.' };
  }
  if (factors.length === 0) {
    return { ok: false, message: 'Add at least one conversion factor.' };
  }
  for (const f of factors) {
    if (!f.numeratorUnit || !f.denominatorUnit) {
      return { ok: false, message: 'Fill in all unit slots in every conversion factor.' };
    }
  }
  for (const f of factors) {
    if (!f.cfLabelTop) {
      return { ok: false, message: 'Add a conversion factor label to every conversion factor.' };
    }
  }

  // Walk the cancellation chain
  let current = givens[0].unit;
  for (let i = 0; i < factors.length; i++) {
    const f = factors[i];
    if (f.denominatorUnit.id !== current.id) {
      return {
        ok: false,
        message: `Factor ${i + 1}: denominator is "${f.denominatorUnit.label}" but "${current.label}" needs to cancel there.`,
      };
    }
    current = f.numeratorUnit;
  }

  if (current.id !== equals.unit.id) {
    return {
      ok: false,
      message: `After canceling, the remaining unit is "${current.label}" but the target is "${equals.unit.label}".`,
    };
  }

  return { ok: true, message: 'Units cancel correctly — well done!' };
}

/**
 * Validates that the numbers in the workspace compute to the correct answer.
 * Returns { ok: boolean, message: string }
 */
export function validateNumbers(steps, answer) {
  const given   = steps.find((s) => s.type === 'given');
  const factors = steps.filter((s) => s.type === 'factor');

  if (given?.givenValue == null) {
    return { ok: false, message: 'Place the starting value in the Given box.' };
  }
  for (const f of factors) {
    if (f.numeratorValue == null || f.denominatorValue == null) {
      return { ok: false, message: 'Fill in all number slots in every conversion factor.' };
    }
  }

  let result = given.givenValue;
  for (const f of factors) {
    result = (result * f.numeratorValue) / f.denominatorValue;
  }

  // 0.5% relative tolerance, min 0.001 absolute
  const tol = Math.max(Math.abs(answer) * 0.005, 0.001);
  if (Math.abs(result - answer) > tol) {
    return {
      ok: false,
      message: "The math doesn't work out — check your given value and the numbers in your conversion factors.",
    };
  }

  return { ok: true, message: `Correct! The answer is ${fmtResult(result)}.` };
}

function fmtResult(v) {
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e15 || (abs < 0.001 && abs > 0)) return v.toExponential(3);
  if (Number.isInteger(v)) return String(v);
  return parseFloat(v.toPrecision(4)).toString();
}
