// Unit color assignments
// Main palette: blue #00addb, teal #17b29e, green #85c441, purple #748ac5,
//               pink #e9177a, yellow #fdb714, grey #4f5b6f
// Variations (kg, mg, mL, atoms) are darker shades of their group's main color.
export const UNIT_COLORS = {
  // Mass — blue family
  kg:    '#007fa3',   // dark blue   (large unit variation)
  g:     '#00addb',   // BLUE        (main mass)
  mg:    '#005e78',   // darkest blue (small unit variation)
  // Moles
  mol:   '#17b29e',   // TEAL        (generic mol — easy/medium only)
  mol_A: '#17b29e',   // TEAL
  mol_B: '#85c441',   // GREEN
  // Volume — purple family
  L:     '#748ac5',   // PURPLE      (main volume)
  mL:    '#576894',   // dark purple (variation)
  // Particles — pink / yellow
  mlcls: '#e9177a',   // PINK        (main — neutral molecules)
  atoms: '#ba1262',   // dark pink   (variation)
  ions:  '#8c0f49',   // darkest pink (particles — ions)
};

export const UNITS = [
  { id: 'kg',    label: 'kg',    group: 'Metric',    color: UNIT_COLORS.kg },
  { id: 'g',     label: 'g',     group: 'Metric',    color: UNIT_COLORS.g },
  { id: 'mg',    label: 'mg',    group: 'Metric',    color: UNIT_COLORS.mg },
  { id: 'mol',   label: 'mol',   group: 'Moles',     color: UNIT_COLORS.mol },
  { id: 'mol_A', label: 'mol A', group: 'Moles',     color: UNIT_COLORS.mol_A },
  { id: 'mol_B', label: 'mol B', group: 'Moles',     color: UNIT_COLORS.mol_B },
  { id: 'L',     label: 'L',     group: 'Volume',    color: UNIT_COLORS.L },
  { id: 'mL',    label: 'mL',    group: 'Volume',    color: UNIT_COLORS.mL },
  { id: 'mlcls', label: 'mlcls', group: 'Particles', color: UNIT_COLORS.mlcls },
  { id: 'atoms', label: 'atoms', group: 'Particles', color: UNIT_COLORS.atoms },
  { id: 'ions',  label: 'ions',  group: 'Particles', color: UNIT_COLORS.ions },
];

// Conversion factor name gradient: derived from the two unit colors it bridges
export const CONVERSION_FACTORS = [
  {
    id: 'avogadros',
    label: "Avogadro's #",
    colorA: UNIT_COLORS.mol_A,
    colorB: UNIT_COLORS.mlcls,
  },
  {
    id: 'molar_mass',
    label: 'Molar Mass',
    colorA: UNIT_COLORS.g,
    colorB: UNIT_COLORS.mol_A,
  },
  {
    id: 'molarity',
    label: 'Molarity',
    colorA: UNIT_COLORS.mol_A,
    colorB: UNIT_COLORS.L,
  },
  {
    id: 'molar_ratio',
    label: 'Molar Ratio',
    colorA: UNIT_COLORS.mol_A,
    colorB: UNIT_COLORS.mol_B,
  },
  {
    id: 'metric',
    label: 'Metric',
    colorA: UNIT_COLORS.kg,
    colorB: UNIT_COLORS.mg,
  },
  {
    id: 'atomic_ratio',
    label: 'Atomic Ratio',
    colorA: UNIT_COLORS.mlcls,
    colorB: UNIT_COLORS.atoms,
  },
];
