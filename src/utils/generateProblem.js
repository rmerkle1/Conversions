let _problemId = 1;

const pick    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand    = (min, max, step = 1) => min + Math.floor(Math.random() * Math.floor((max - min) / step + 1)) * step;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// u() marks a unit as a colored, clickable token in the problem text
const u = (id, label) => ({ id, label: label ?? id });
// n() marks supplemental info as an italic note rendered below the question
const n = (text) => ({ type: 'note', text });

const AVOGADRO  = 6.022e23;
const MOLARITIES = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

// ── Easy/medium compound pool ─────────────────────────────────────────────────

const COMPOUNDS = [
  { id: 'H2',      formula: 'H₂',       mm: 2   },
  { id: 'O2',      formula: 'O₂',       mm: 32  },
  { id: 'H2O',     formula: 'H₂O',      mm: 18  },
  { id: 'CO2',     formula: 'CO₂',      mm: 44  },
  { id: 'N2',      formula: 'N₂',       mm: 28  },
  { id: 'NH3',     formula: 'NH₃',      mm: 17  },
  { id: 'CH4',     formula: 'CH₄',      mm: 16  },
  { id: 'NaCl',    formula: 'NaCl',     mm: 58  },
  { id: 'HCl',     formula: 'HCl',      mm: 36  },
  { id: 'MgO',     formula: 'MgO',      mm: 40  },
  { id: 'C6H12O6', formula: 'C₆H₁₂O₆', mm: 180 },
  { id: 'CaCO3',   formula: 'CaCO₃',   mm: 100 },
];

const pickTwoCpds = () => {
  const a = pick(COMPOUNDS);
  let b;
  do { b = pick(COMPOUNDS); } while (b.id === a.id);
  return [a, b];
};

const mmDistractors = (excludedMms) => {
  const ex = new Set(excludedMms.map(String));
  return COMPOUNDS.map((c) => c.mm).filter((m) => !ex.has(String(m)));
};

const MOLECULE_FACTS = [
  { id: 'CH4',  formula: 'CH₄',  mm: 16, element: 'C', name: 'carbon',   count: 1 },
  { id: 'H2O',  formula: 'H₂O',  mm: 18, element: 'H', name: 'hydrogen', count: 2 },
  { id: 'CO2',  formula: 'CO₂',  mm: 44, element: 'O', name: 'oxygen',   count: 2 },
  { id: 'NH3',  formula: 'NH₃',  mm: 17, element: 'N', name: 'nitrogen', count: 1 },
  { id: 'C2H6', formula: 'C₂H₆', mm: 30, element: 'C', name: 'carbon',   count: 2 },
];

const ION_FACTS = [
  { id: 'NaCl',  formula: 'NaCl',  mm: 58,  ion: 'Na⁺',  name: 'sodium',   count: 1 },
  { id: 'MgCl2', formula: 'MgCl₂', mm: 95,  ion: 'Cl⁻',  name: 'chloride', count: 2 },
  { id: 'CaCl2', formula: 'CaCl₂', mm: 111, ion: 'Ca²⁺', name: 'calcium',  count: 1 },
];

// ── Balanced reactions for hard stoichiometry ─────────────────────────────────
// Each compound carries: id, formula, mm (g/mol), coeff, side (reactant/product)

const REACTIONS = [
  {
    eq: '2H₂ + O₂ → 2H₂O',
    cpds: [
      { id: 'H2',  formula: 'H₂',  mm: 2,  coeff: 2, side: 'reactant' },
      { id: 'O2',  formula: 'O₂',  mm: 32, coeff: 1, side: 'reactant' },
      { id: 'H2O', formula: 'H₂O', mm: 18, coeff: 2, side: 'product'  },
    ],
  },
  {
    eq: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    cpds: [
      { id: 'CH4', formula: 'CH₄', mm: 16, coeff: 1, side: 'reactant' },
      { id: 'O2',  formula: 'O₂',  mm: 32, coeff: 2, side: 'reactant' },
      { id: 'CO2', formula: 'CO₂', mm: 44, coeff: 1, side: 'product'  },
      { id: 'H2O', formula: 'H₂O', mm: 18, coeff: 2, side: 'product'  },
    ],
  },
  {
    eq: 'N₂ + 3H₂ → 2NH₃',
    cpds: [
      { id: 'N2',  formula: 'N₂',  mm: 28, coeff: 1, side: 'reactant' },
      { id: 'H2',  formula: 'H₂',  mm: 2,  coeff: 3, side: 'reactant' },
      { id: 'NH3', formula: 'NH₃', mm: 17, coeff: 2, side: 'product'  },
    ],
  },
  {
    eq: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O',
    cpds: [
      { id: 'C3H8', formula: 'C₃H₈', mm: 44, coeff: 1, side: 'reactant' },
      { id: 'O2',   formula: 'O₂',   mm: 32, coeff: 5, side: 'reactant' },
      { id: 'CO2',  formula: 'CO₂',  mm: 44, coeff: 3, side: 'product'  },
      { id: 'H2O',  formula: 'H₂O',  mm: 18, coeff: 4, side: 'product'  },
    ],
  },
  {
    eq: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O',
    cpds: [
      { id: 'C6H12O6', formula: 'C₆H₁₂O₆', mm: 180, coeff: 1, side: 'reactant' },
      { id: 'O2',      formula: 'O₂',       mm: 32,  coeff: 6, side: 'reactant' },
      { id: 'CO2',     formula: 'CO₂',      mm: 44,  coeff: 6, side: 'product'  },
      { id: 'H2O',     formula: 'H₂O',      mm: 18,  coeff: 6, side: 'product'  },
    ],
  },
  {
    eq: 'CaCO₃ → CaO + CO₂',
    cpds: [
      { id: 'CaCO3', formula: 'CaCO₃', mm: 100, coeff: 1, side: 'reactant' },
      { id: 'CaO',   formula: 'CaO',   mm: 56,  coeff: 1, side: 'product'  },
      { id: 'CO2',   formula: 'CO₂',   mm: 44,  coeff: 1, side: 'product'  },
    ],
  },
  {
    eq: '4NH₃ + 5O₂ → 4NO + 6H₂O',
    cpds: [
      { id: 'NH3', formula: 'NH₃', mm: 17, coeff: 4, side: 'reactant' },
      { id: 'O2',  formula: 'O₂',  mm: 32, coeff: 5, side: 'reactant' },
      { id: 'NO',  formula: 'NO',  mm: 30, coeff: 4, side: 'product'  },
      { id: 'H2O', formula: 'H₂O', mm: 18, coeff: 6, side: 'product'  },
    ],
  },
  {
    eq: '2SO₂ + O₂ → 2SO₃',
    cpds: [
      { id: 'SO2', formula: 'SO₂', mm: 64, coeff: 2, side: 'reactant' },
      { id: 'O2',  formula: 'O₂',  mm: 32, coeff: 1, side: 'reactant' },
      { id: 'SO3', formula: 'SO₃', mm: 80, coeff: 2, side: 'product'  },
    ],
  },
];

// Pick one reactant and one product from a balanced reaction
function pickCrossReactionPair(rxn) {
  const reactants = rxn.cpds.filter((c) => c.side === 'reactant');
  const products  = rxn.cpds.filter((c) => c.side === 'product');
  return [pick(reactants), pick(products)];
}

function fmtNum(v) {
  if (Math.abs(v - AVOGADRO) < 1e18) return '6.022×10²³';
  if (Math.abs(v) >= 1e15) return v.toExponential(3);
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return parseFloat(v.toPrecision(4)).toString();
}

function buildPool(correct, distractors) {
  const seen  = new Set();
  const items = [];
  for (const v of correct) {
    const key = String(v);
    if (!seen.has(key)) { seen.add(key); items.push(v); }
  }
  let added = 0;
  for (const v of shuffle(distractors)) {
    if (added >= 2) break;
    const key = String(v);
    if (!seen.has(key)) { seen.add(key); items.push(v); added++; }
  }
  return shuffle(items).map((v, i) => ({ id: `p${i}`, value: v, label: fmtNum(v) }));
}

// ── Easy: single CF ──────────────────────────────────────────────────────────

const EASY = [
  // g → mol  (Molar Mass)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const g   = rand(5, 200, 5);
    return {
      parts: [
        `How many `, u('mol'), ` are in ${g} `, u('g'), ` of ${cpd.formula}?`,
        n(`Molar mass of ${cpd.formula} = ${mm} g/mol`),
      ],
      path:       ['Molar Mass'],
      setupChain: 'g × (1 mol / g)',
      givenValue: g,
      answer:     g / mm,
      poolValues:  [g, 1, mm],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mol → g  (Molar Mass)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const mol = rand(1, 10);
    return {
      parts: [
        `What is the mass in `, u('g'), ` of ${mol} `, u('mol'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molar Mass'],
      setupChain: 'mol × (g / 1 mol)',
      givenValue: mol,
      answer:     mol * mm,
      poolValues:  [mol, mm, 1],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mol → molecules  (Avogadro's #)
  () => {
    const cpd = pick(COMPOUNDS);
    const mol = rand(1, 5);
    return {
      parts: [
        `How many `, u('mlcls', 'molecules'), ` are in ${mol} `, u('mol'), ` of ${cpd.formula}?`,
      ],
      path:       ["Avogadro's #"],
      setupChain: 'mol × (molecules / 1 mol)',
      givenValue: mol,
      answer:     mol * AVOGADRO,
      poolValues:  [mol, AVOGADRO, 1],
      distractors: [2, 3, 4, 5, 6].filter((x) => x !== mol),
      compounds:  [cpd],
    };
  },
  // L → mol  (Molarity)
  () => {
    const cpd      = pick(COMPOUNDS);
    const molarity = pick(MOLARITIES);
    const vol      = rand(1, 5);
    return {
      parts: [
        `How many `, u('mol'), ` of ${cpd.formula} are in ${vol} `, u('L'), ` of a ${molarity} M solution?`,
      ],
      path:       ['Molarity'],
      setupChain: 'L × (mol / L)',
      givenValue: vol,
      answer:     vol * molarity,
      poolValues:  [vol, molarity, 1],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [cpd],
    };
  },
  // mol → L  (Molarity)
  () => {
    const cpd      = pick(COMPOUNDS);
    const molarity = pick(MOLARITIES);
    const mol      = rand(1, 5);
    return {
      parts: [
        `What volume in `, u('L'), ` of a ${molarity} M ${cpd.formula} solution contains ${mol} `, u('mol'), `?`,
      ],
      path:       ['Molarity'],
      setupChain: 'mol × (1 L / mol)',
      givenValue: mol,
      answer:     mol / molarity,
      poolValues:  [mol, 1, molarity],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [cpd],
    };
  },
  // g → mg  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const g   = rand(1, 20);
    return {
      parts: [`Convert ${g} `, u('g'), ` of ${cpd.formula} to `, u('mg'), `.`],
      path:       ['Metric'],
      setupChain: 'g × (mg / g)',
      givenValue: g,
      answer:     g * 1000,
      poolValues:  [g, 1000, 1],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // kg → g  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const kg  = rand(1, 5);
    return {
      parts: [`Convert ${kg} `, u('kg'), ` of ${cpd.formula} to `, u('g'), `.`],
      path:       ['Metric'],
      setupChain: 'kg × (g / kg)',
      givenValue: kg,
      answer:     kg * 1000,
      poolValues:  [kg, 1000, 1],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // mg → g  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const mg  = rand(500, 20000, 500);
    return {
      parts: [`Convert ${mg} `, u('mg'), ` of ${cpd.formula} to `, u('g'), `.`],
      path:       ['Metric'],
      setupChain: 'mg × (g / mg)',
      givenValue: mg,
      answer:     mg / 1000,
      poolValues:  [mg, 1, 1000],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // g → kg  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const g   = rand(500, 5000, 500);
    return {
      parts: [`Convert ${g} `, u('g'), ` of ${cpd.formula} to `, u('kg'), `.`],
      path:       ['Metric'],
      setupChain: 'g × (kg / g)',
      givenValue: g,
      answer:     g / 1000,
      poolValues:  [g, 1, 1000],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // L → mL  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const L   = rand(1, 5);
    return {
      parts: [`Convert ${L} `, u('L'), ` of ${cpd.formula} solution to `, u('mL'), `.`],
      path:       ['Metric'],
      setupChain: 'L × (mL / L)',
      givenValue: L,
      answer:     L * 1000,
      poolValues:  [L, 1000, 1],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // mL → L  (Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const mL  = rand(100, 2000, 100);
    return {
      parts: [`Convert ${mL} `, u('mL'), ` of ${cpd.formula} solution to `, u('L'), `.`],
      path:       ['Metric'],
      setupChain: 'mL × (L / mL)',
      givenValue: mL,
      answer:     mL / 1000,
      poolValues:  [mL, 1, 1000],
      distractors: [100, 10, 500],
      compounds:  [],
    };
  },
  // molecules → mol  (Avogadro's #, reverse)
  () => {
    const cpd   = pick(COMPOUNDS);
    const n_mol = rand(1, 5);
    const mlcls = n_mol * AVOGADRO;
    return {
      parts: [
        `How many `, u('mol'), ` are in ${fmtNum(mlcls)} `, u('mlcls', 'molecules'), ` of ${cpd.formula}?`,
      ],
      path:       ["Avogadro's #"],
      setupChain: 'molecules × (1 mol / molecules)',
      givenValue: mlcls,
      answer:     n_mol,
      poolValues:  [mlcls, 1, AVOGADRO],
      distractors: [2, 3, 4, 5].filter((x) => x !== n_mol),
      compounds:  [cpd],
    };
  },
  // mL → mol  (Molarity direct — mL treated as L-scale via molarity in mL)
  // Written as: given mL of a known M solution, find mol
  () => {
    const cpd      = pick(COMPOUNDS);
    const molarity = pick(MOLARITIES);
    const mL       = rand(200, 2000, 200);
    return {
      parts: [
        `How many `, u('mol'), ` of ${cpd.formula} are in ${mL} `, u('mL'),
        ` of a ${molarity} M solution?`,
      ],
      path:       ['Metric', 'Molarity'],
      setupChain: 'mL × (L / mL) × (mol / L)',
      givenValue: mL,
      answer:     (mL / 1000) * molarity,
      poolValues:  [mL, 1, 1000, molarity],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [cpd],
    };
  },
];

// ── Medium: 2–3 CFs ──────────────────────────────────────────────────────────

const MEDIUM = [
  // g → mol → molecules  (Molar Mass + Avogadro's #)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const g   = rand(10, 200, 10);
    return {
      parts: [
        `How many `, u('mlcls', 'molecules'), ` are in ${g} `, u('g'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molar Mass', "Avogadro's #"],
      setupChain: 'g × (mol / g) × (molecules / mol)',
      givenValue: g,
      answer:     (g / mm) * AVOGADRO,
      poolValues:  [g, 1, mm, AVOGADRO],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // g → mol → L  (Molar Mass + Molarity)
  () => {
    const cpd      = pick(COMPOUNDS);
    const mm       = cpd.mm;
    const molarity = pick(MOLARITIES);
    const g        = rand(10, 200, 10);
    return {
      parts: [
        `What volume in `, u('L'), ` of a ${molarity} M solution contains ${g} `, u('g'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Molarity'],
      setupChain: 'g × (mol / g) × (L / mol)',
      givenValue: g,
      answer:     (g / mm) / molarity,
      poolValues:  [g, 1, mm, molarity],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mg → g → mol  (Metric + Molar Mass)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const mg  = rand(100, 5000, 100);
    return {
      parts: [
        `How many `, u('mol'), ` are in ${mg} `, u('mg'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass'],
      setupChain: 'mg × (g / mg) × (mol / g)',
      givenValue: mg,
      answer:     (mg / 1000) / mm,
      poolValues:  [mg, 1, 1000, mm],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mol → g → kg  (Molar Mass + Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const mol = rand(10, 100, 10);
    return {
      parts: [
        `What is the mass in `, u('kg'), ` of ${mol} `, u('mol'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Metric'],
      setupChain: 'mol × (g / mol) × (kg / g)',
      givenValue: mol,
      answer:     (mol * mm) / 1000,
      poolValues:  [mol, mm, 1, 1000],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // L → mol → molecules  (Molarity + Avogadro's #)
  () => {
    const mf       = pick(MOLECULE_FACTS);
    const molarity = pick(MOLARITIES);
    const vol      = rand(1, 5);
    return {
      parts: [
        `How many `, u('mlcls', 'molecules'), ` of ${mf.formula} are in ${vol} `, u('L'),
        ` of a ${molarity} M solution?`,
      ],
      path:       ['Molarity', "Avogadro's #"],
      setupChain: 'L × (mol / L) × (molecules / mol)',
      givenValue: vol,
      answer:     vol * molarity * AVOGADRO,
      poolValues:  [vol, molarity, 1, AVOGADRO],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [{ id: mf.id, formula: mf.formula, mm: mf.mm }],
    };
  },
  // mol → molecules → atoms  (Avogadro's # + Atomic Ratio)
  () => {
    const mf  = pick(MOLECULE_FACTS);
    const mol = rand(1, 5);
    return {
      parts: [
        `How many ${mf.name} `, u('atoms'), ` are in ${mol} `, u('mol'), ` of ${mf.formula}?`,
        n(`Each molecule has ${mf.count} ${mf.element} atom${mf.count > 1 ? 's' : ''}`),
      ],
      path:       ["Avogadro's #", 'Atomic Ratio'],
      setupChain: 'mol × (molecules / mol) × (atoms / molecule)',
      givenValue: mol,
      answer:     mol * AVOGADRO * mf.count,
      poolValues:  [mol, AVOGADRO, 1, mf.count],
      distractors: [2, 3, 4, 5].filter((x) => x !== mol && x !== mf.count),
      compounds:  [{ id: mf.id, formula: mf.formula, mm: mf.mm }],
    };
  },
  // mol → formula units → ions  (Avogadro's # + Atomic Ratio)
  () => {
    const ion = pick(ION_FACTS);
    const mol = rand(1, 5);
    return {
      parts: [
        `How many ${ion.name} (${ion.ion}) `, u('ions'), ` are in ${mol} `, u('mol'), ` of ${ion.formula}?`,
        n(`${ion.count} ${ion.ion} per formula unit`),
      ],
      path:       ["Avogadro's #", 'Atomic Ratio'],
      setupChain: 'mol × (f.u. / mol) × (ions / f.u.)',
      givenValue: mol,
      answer:     mol * AVOGADRO * ion.count,
      poolValues:  [mol, AVOGADRO, 1, ion.count],
      distractors: [2, 3, 4, 5].filter((x) => x !== mol && x !== ion.count),
      compounds:  [{ id: ion.id, formula: ion.formula, mm: ion.mm }],
    };
  },
  // kg → g → mol  (Metric + Molar Mass)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const kg  = rand(1, 5);
    return {
      parts: [
        `How many `, u('mol'), ` are in ${kg} `, u('kg'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass'],
      setupChain: 'kg × (g / kg) × (mol / g)',
      givenValue: kg,
      answer:     (kg * 1000) / mm,
      poolValues:  [kg, 1000, 1, mm],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mol → g → mg  (Molar Mass + Metric)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const mol = rand(1, 10);
    return {
      parts: [
        `What is the mass in `, u('mg'), ` of ${mol} `, u('mol'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Metric'],
      setupChain: 'mol × (g / mol) × (mg / g)',
      givenValue: mol,
      answer:     mol * mm * 1000,
      poolValues:  [mol, mm, 1, 1000],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mL → L → mol  (Metric + Molarity)
  () => {
    const cpd      = pick(COMPOUNDS);
    const molarity = pick(MOLARITIES);
    const mL       = rand(100, 2000, 100);
    return {
      parts: [
        `How many `, u('mol'), ` of ${cpd.formula} are in ${mL} `, u('mL'),
        ` of a ${molarity} M solution?`,
      ],
      path:       ['Metric', 'Molarity'],
      setupChain: 'mL × (L / mL) × (mol / L)',
      givenValue: mL,
      answer:     (mL / 1000) * molarity,
      poolValues:  [mL, 1, 1000, molarity],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [cpd],
    };
  },
  // mL → L → mol → g  (Metric + Molarity + Molar Mass)
  () => {
    const cpd      = pick(COMPOUNDS);
    const mm       = cpd.mm;
    const molarity = pick(MOLARITIES);
    const mL       = rand(100, 2000, 100);
    return {
      parts: [
        `What is the mass in `, u('g'), ` of ${cpd.formula} dissolved in ${mL} `, u('mL'),
        ` of a ${molarity} M solution?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Metric', 'Molarity', 'Molar Mass'],
      setupChain: 'mL × (L / mL) × (mol / L) × (g / mol)',
      givenValue: mL,
      answer:     (mL / 1000) * molarity * mm,
      poolValues:  [mL, 1, 1000, molarity, mm],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // L → mol → g → mg  (Molarity + Molar Mass + Metric)
  () => {
    const cpd      = pick(COMPOUNDS);
    const mm       = cpd.mm;
    const molarity = pick(MOLARITIES);
    const vol      = rand(1, 5);
    return {
      parts: [
        `How many `, u('mg'), ` of ${cpd.formula} are dissolved in ${vol} `, u('L'),
        ` of a ${molarity} M solution?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Molarity', 'Molar Mass', 'Metric'],
      setupChain: 'L × (mol / L) × (g / mol) × (mg / g)',
      givenValue: vol,
      answer:     vol * molarity * mm * 1000,
      poolValues:  [vol, molarity, 1, mm, 1000],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // g → mol → molecules → atoms  (Molar Mass + Avogadro's # + Atomic Ratio)
  () => {
    const mf = pick(MOLECULE_FACTS);
    const g  = rand(10, 200, 10);
    return {
      parts: [
        `How many ${mf.name} `, u('atoms'), ` are in ${g} `, u('g'), ` of ${mf.formula}?`,
        n(`Molar mass = ${mf.mm} g/mol; ${mf.count} ${mf.element} atom${mf.count > 1 ? 's' : ''} per molecule`),
      ],
      path:       ['Molar Mass', "Avogadro's #", 'Atomic Ratio'],
      setupChain: 'g × (mol / g) × (molecules / mol) × (atoms / molecule)',
      givenValue: g,
      answer:     (g / mf.mm) * AVOGADRO * mf.count,
      poolValues:  [g, 1, mf.mm, AVOGADRO, mf.count],
      distractors: mmDistractors([mf.mm]),
      compounds:  [{ id: mf.id, formula: mf.formula, mm: mf.mm }],
    };
  },
  // L → mol → molecules → ions  (Molarity + Avogadro's # + Atomic Ratio)
  () => {
    const ion      = pick(ION_FACTS);
    const molarity = pick(MOLARITIES);
    const vol      = rand(1, 5);
    return {
      parts: [
        `How many ${ion.name} (${ion.ion}) `, u('ions'), ` are in ${vol} `, u('L'),
        ` of a ${molarity} M ${ion.formula} solution?`,
        n(`${ion.count} ${ion.ion} per formula unit`),
      ],
      path:       ['Molarity', "Avogadro's #", 'Atomic Ratio'],
      setupChain: 'L × (mol / L) × (f.u. / mol) × (ions / f.u.)',
      givenValue: vol,
      answer:     vol * molarity * AVOGADRO * ion.count,
      poolValues:  [vol, molarity, 1, AVOGADRO, ion.count],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [{ id: ion.id, formula: ion.formula, mm: ion.mm }],
    };
  },
  // mL → L → mol → molecules  (Metric + Molarity + Avogadro's #)
  () => {
    const cpd      = pick(COMPOUNDS);
    const molarity = pick(MOLARITIES);
    const mL       = rand(100, 1000, 100);
    return {
      parts: [
        `How many `, u('mlcls', 'molecules'), ` of ${cpd.formula} are in ${mL} `, u('mL'),
        ` of a ${molarity} M solution?`,
      ],
      path:       ['Metric', 'Molarity', "Avogadro's #"],
      setupChain: 'mL × (L / mL) × (mol / L) × (molecules / mol)',
      givenValue: mL,
      answer:     (mL / 1000) * molarity * AVOGADRO,
      poolValues:  [mL, 1, 1000, molarity, AVOGADRO],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [cpd],
    };
  },
  // kg → g → mol → molecules  (Metric + Molar Mass + Avogadro's #)
  () => {
    const cpd = pick(COMPOUNDS);
    const mm  = cpd.mm;
    const kg  = rand(1, 5);
    return {
      parts: [
        `How many `, u('mlcls', 'molecules'), ` are in ${kg} `, u('kg'), ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass', "Avogadro's #"],
      setupChain: 'kg × (g / kg) × (mol / g) × (molecules / mol)',
      givenValue: kg,
      answer:     (kg * 1000 / mm) * AVOGADRO,
      poolValues:  [kg, 1000, 1, mm, AVOGADRO],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
];

// ── Hard: balanced reactions, molar ratio, mol A & mol B ─────────────────────

const HARD = [
  // g A → mol A → mol B → g B
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const g = rand(10, 200, 10);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('g', `g of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${g} `, u('g', `g of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass: ${cpdA.formula} = ${cpdA.mm} g/mol, ${cpdB.formula} = ${cpdB.mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Molar Ratio', 'Molar Mass'],
      setupChain: `g ${cpdA.formula} × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (g / mol ${cpdB.formula})`,
      givenValue: g,
      answer:     (g / cpdA.mm) * (cpdB.coeff / cpdA.coeff) * cpdB.mm,
      poolValues:  [g, 1, cpdA.mm, cpdB.coeff, cpdA.coeff, cpdB.mm],
      distractors: mmDistractors([cpdA.mm, cpdB.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // g A → mol A → mol B → molecules B
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const g = rand(10, 200, 10);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('mlcls', `molecules of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${g} `, u('g', `g of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass ${cpdA.formula} = ${cpdA.mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Molar Ratio', "Avogadro's #"],
      setupChain: `g ${cpdA.formula} × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (molecules / mol)`,
      givenValue: g,
      answer:     (g / cpdA.mm) * (cpdB.coeff / cpdA.coeff) * AVOGADRO,
      poolValues:  [g, 1, cpdA.mm, cpdB.coeff, cpdA.coeff, AVOGADRO],
      distractors: mmDistractors([cpdA.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // mol A → mol B → g B  (given starts in moles)
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const mol = rand(1, 10);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('g', `g of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${mol} `, u('mol_A', `mol of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass ${cpdB.formula} = ${cpdB.mm} g/mol`),
      ],
      path:       ['Molar Ratio', 'Molar Mass'],
      setupChain: `mol ${cpdA.formula} × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (g / mol ${cpdB.formula})`,
      givenValue: mol,
      answer:     mol * (cpdB.coeff / cpdA.coeff) * cpdB.mm,
      poolValues:  [mol, cpdB.coeff, cpdA.coeff, cpdB.mm, 1],
      distractors: mmDistractors([cpdB.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // g A → mol A → mol B → L B  (product measured as molarity solution)
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const molarity = pick(MOLARITIES);
    const g = rand(10, 200, 10);
    return {
      equation: rxn.eq,
      parts: [
        `What volume in `, u('L', `L of ${cpdB.formula} solution`),
        ` of a ${molarity} M ${cpdB.formula} solution is produced from ${g} `,
        u('g', `g of ${cpdA.formula}`), ` of ${cpdA.formula}?`,
        n(`Molar mass ${cpdA.formula} = ${cpdA.mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Molar Ratio', 'Molarity'],
      setupChain: `g ${cpdA.formula} × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (L / mol)`,
      givenValue: g,
      answer:     (g / cpdA.mm) * (cpdB.coeff / cpdA.coeff) / molarity,
      poolValues:  [g, 1, cpdA.mm, cpdB.coeff, cpdA.coeff, molarity],
      distractors: mmDistractors([cpdA.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // mg → g → mol → L → mL  (Metric + Molar Mass + Molarity + Metric)  "mg to mL"
  () => {
    const cpd      = pick(COMPOUNDS);
    const mm       = cpd.mm;
    const molarity = pick(MOLARITIES);
    const mg       = rand(100, 5000, 100);
    return {
      parts: [
        `What volume in `, u('mL'), ` of a ${molarity} M ${cpd.formula} solution contains ${mg} `, u('mg'),
        ` of ${cpd.formula}?`,
        n(`Molar mass = ${mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass', 'Molarity', 'Metric'],
      setupChain: 'mg × (g / mg) × (mol / g) × (L / mol) × (mL / L)',
      givenValue: mg,
      answer:     mg / mm / molarity,
      poolValues:  [mg, 1, 1000, mm, molarity],
      distractors: mmDistractors([mm]),
      compounds:  [cpd],
    };
  },
  // mL → L → mol → molecules → atoms  (Metric + Molarity + Avogadro's # + Atomic Ratio)  "mL to atoms"
  () => {
    const mf       = pick(MOLECULE_FACTS);
    const molarity = pick(MOLARITIES);
    const mL       = rand(100, 1000, 100);
    return {
      parts: [
        `How many ${mf.name} `, u('atoms'), ` are in ${mL} `, u('mL'),
        ` of a ${molarity} M ${mf.formula} solution?`,
        n(`${mf.count} ${mf.element} atom${mf.count > 1 ? 's' : ''} per molecule`),
      ],
      path:       ['Metric', 'Molarity', "Avogadro's #", 'Atomic Ratio'],
      setupChain: 'mL × (L / mL) × (mol / L) × (molecules / mol) × (atoms / molecule)',
      givenValue: mL,
      answer:     (mL / 1000) * molarity * AVOGADRO * mf.count,
      poolValues:  [mL, 1, 1000, molarity, AVOGADRO, mf.count],
      distractors: MOLARITIES.filter((m) => m !== molarity),
      compounds:  [{ id: mf.id, formula: mf.formula, mm: mf.mm }],
    };
  },
  // mg → g → mol A → mol B → g B  (Metric + Molar Mass + Molar Ratio + Molar Mass)  stoichiometry from mg
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const mg = rand(100, 5000, 100);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('g', `g of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${mg} `, u('mg', `mg of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass: ${cpdA.formula} = ${cpdA.mm} g/mol, ${cpdB.formula} = ${cpdB.mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass', 'Molar Ratio', 'Molar Mass'],
      setupChain: `mg ${cpdA.formula} × (g / mg) × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (g / mol ${cpdB.formula})`,
      givenValue: mg,
      answer:     (mg / 1000 / cpdA.mm) * (cpdB.coeff / cpdA.coeff) * cpdB.mm,
      poolValues:  [mg, 1, 1000, cpdA.mm, cpdB.coeff, cpdA.coeff, cpdB.mm],
      distractors: mmDistractors([cpdA.mm, cpdB.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // g A → mol A → mol B → g B → mg  (Molar Mass + Molar Ratio + Molar Mass + Metric)  stoichiometry to mg
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const g = rand(10, 200, 10);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('mg', `mg of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${g} `, u('g', `g of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass: ${cpdA.formula} = ${cpdA.mm} g/mol, ${cpdB.formula} = ${cpdB.mm} g/mol`),
      ],
      path:       ['Molar Mass', 'Molar Ratio', 'Molar Mass', 'Metric'],
      setupChain: `g ${cpdA.formula} × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (g / mol ${cpdB.formula}) × (mg / g)`,
      givenValue: g,
      answer:     (g / cpdA.mm) * (cpdB.coeff / cpdA.coeff) * cpdB.mm * 1000,
      poolValues:  [g, 1, cpdA.mm, cpdB.coeff, cpdA.coeff, cpdB.mm, 1000],
      distractors: mmDistractors([cpdA.mm, cpdB.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // mL → L → mol A → mol B → g B  (Metric + Molarity + Molar Ratio + Molar Mass)  stoichiometry from mL solution
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const molarity = pick(MOLARITIES);
    const mL = rand(100, 2000, 100);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('g', `g of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${mL} `, u('mL', `mL of ${cpdA.formula} solution`),
        ` of a ${molarity} M ${cpdA.formula} solution?`,
        n(`Molar mass ${cpdB.formula} = ${cpdB.mm} g/mol`),
      ],
      path:       ['Metric', 'Molarity', 'Molar Ratio', 'Molar Mass'],
      setupChain: `mL ${cpdA.formula} × (L / mL) × (mol ${cpdA.formula} / L) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (g / mol ${cpdB.formula})`,
      givenValue: mL,
      answer:     (mL / 1000) * molarity * (cpdB.coeff / cpdA.coeff) * cpdB.mm,
      poolValues:  [mL, 1, 1000, molarity, cpdB.coeff, cpdA.coeff, cpdB.mm],
      distractors: mmDistractors([cpdB.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
  // mg → g → mol A → mol B → molecules B  (Metric + Molar Mass + Molar Ratio + Avogadro's #)
  () => {
    const rxn = pick(REACTIONS);
    const [cpdA, cpdB] = pickCrossReactionPair(rxn);
    const mg = rand(100, 5000, 100);
    return {
      equation: rxn.eq,
      parts: [
        `How many `, u('mlcls', `molecules of ${cpdB.formula}`),
        ` of ${cpdB.formula} are produced from ${mg} `, u('mg', `mg of ${cpdA.formula}`),
        ` of ${cpdA.formula}?`,
        n(`Molar mass ${cpdA.formula} = ${cpdA.mm} g/mol`),
      ],
      path:       ['Metric', 'Molar Mass', 'Molar Ratio', "Avogadro's #"],
      setupChain: `mg ${cpdA.formula} × (g / mg) × (mol ${cpdA.formula} / g) × (mol ${cpdB.formula} / mol ${cpdA.formula}) × (molecules / mol)`,
      givenValue: mg,
      answer:     (mg / 1000 / cpdA.mm) * (cpdB.coeff / cpdA.coeff) * AVOGADRO,
      poolValues:  [mg, 1, 1000, cpdA.mm, cpdB.coeff, cpdA.coeff, AVOGADRO],
      distractors: mmDistractors([cpdA.mm]),
      compounds:  [cpdA, cpdB],
    };
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export function generateProblem(difficulty = 'easy') {
  const bank = { easy: EASY, medium: MEDIUM, hard: HARD }[difficulty] ?? EASY;
  const result = pick(bank)();
  return {
    id:         _problemId++,
    difficulty,
    equation:   result.equation ?? null,
    parts:      result.parts,
    path:       result.path,
    setupChain: result.setupChain,
    givenValue: result.givenValue,
    answer:     result.answer,
    numberPool: buildPool(result.poolValues ?? [], result.distractors ?? []),
    compounds:  result.compounds ?? [],
  };
}
