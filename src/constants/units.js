// Unit color assignments — each unit has a unique color
export const UNIT_COLORS = {
  kg:    '#4A90D9',
  g:     '#E67E22',
  mg:    '#F1C40F',
  mol_A: '#2ECC71',
  mol_B: '#1ABC9C',
  L:     '#9B59B6',
  mL:    '#8E44AD',
  mlcls: '#E74C3C',
  atoms: '#C0392B',
  ions:  '#D35400',
};

export const UNITS = [
  { id: 'kg',    label: 'kg',    group: 'Metric',    color: UNIT_COLORS.kg },
  { id: 'g',     label: 'g',     group: 'Metric',    color: UNIT_COLORS.g },
  { id: 'mg',    label: 'mg',    group: 'Metric',    color: UNIT_COLORS.mg },
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
];
