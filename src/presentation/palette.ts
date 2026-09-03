/**
 * The diagram colour palette, in one place.
 *
 * On the web each `colorToken` becomes `var(--token)`, resolved from the token block in the web
 * project's `index.css`. Native has no cascade, so the tokens resolve to hex here. The values are
 * the web project's LIGHT palette, which is exact rather than approximate: light sets
 * `--signal-lift: 0%`, so every derived signal colour is identity with its `--*-base`, and these
 * are those bases. Dark mode lifts each one towards `--signal-tint` — see the note in DiagramView.
 *
 * Token names match the schema's `colorToken` strings, which are the web's variable names. Keep
 * them that way: a token the schema emits but this map lacks resolves to black.
 */
const TOKEN_PALETTE: Record<string, string> = {
  /* Neutrals — the shared slate ramp (web light theme). `text` doubles as the readout accent,
   * per the native convention carried over from the first modules. */
  text: '#64748b',
  'text-dim': '#475569',
  'text-faint': '#64748b',
  baseline: '#64748b',
  'grid-line': '#e2e8f0',
  panel: '#ffffff',
  'panel-border': '#e2e8f0',
  'panel-raised': '#f1f5f9',
  bg: '#f8fafc',
  bone: '#e2e8f0',
  ok: '#007a6f',
  warn: '#9c6608',
  danger: '#c62828',

  /* Signal colours — anatomical/monitor convention, the web project's `--*-base` light values. */
  artery: '#c62828',
  venous: '#3b4fa0',
  kidney: '#9c6608',
  raas: '#6a3fc9',
  anp: '#007a6f',
  urine: '#7d6c0a',
  o2: '#0a72b8',
  co2: '#b4500c',
  ph: '#c2258c',
  bicarb: '#177d36',
  glucose: '#8a6c00',
  insulin: '#0a72b8',
  glucagon: '#b4500c',
  epinephrine: '#c2258c',
  sarcomere: '#a8452b',

  /* Endocrine regulators */
  cortisol: '#9e6215',
  acth: '#1c6ee0',
  thyroid: '#0b7d6b',
  tsh: '#9b45d1',
  calcitonin: '#0e7d94',
  calcitriol: '#357c35',
  calcium: '#7a6f52',
  pth: '#c43d75',
  phosphate: '#4a5fd0',
  gnrh: '#9e6215',
  lh: '#c2258c',
  fsh: '#1c6ee0',
  estrogen: '#9b45d1',
  progesterone: '#0b7d6b',
  testosterone: '#0b7ea8',
  pituitary: '#7c4f8f',
  adrenalMedulla: '#a02f2f',
  'adrenal-medulla': '#a02f2f',

  /* GI / digestion */
  gastrin: '#8f6a10',
  somatostatin: '#5a6c96',
  cck: '#177a57',
  secretin: '#31659c',
  motility: '#8f4aa8',
  liver: '#99551b',

  /* Membrane potentials / conduction */
  vm: '#7c6d00',
  'na-current': '#cf3f26',
  'k-current': '#0b7ea8',
  axon: '#6b4fa8',

  /* Autonomic nervous system */
  sympathetic: '#bd481a',
  parasympathetic: '#0e8468',
  'second-messenger': '#8a3fb5',

  /* Renal */
  tubule: '#0e7d94',
  adh: '#6a3fc9',
  medulla: '#9c6608',
  potassium: '#0b6f93',
  sodium: '#b8431f',

  /* Cardiac / ECG */
  'sa-node': '#8a6c00',
  conduction: '#1c6ee0',
  'pv-loop': '#b02a5e',
  'ecg-trace': '#177d36',
  depolarized: '#cf3f26',
  repolarizing: '#1c6ee0',
  'conduction-path': '#8a6c00',

  /* Coagulation */
  fibrin: '#9b45d1',
  thrombin: '#c2258c',
  platelet: '#8a6c00',
  plasmin: '#177a57',

  /* Erythropoiesis */
  hemoglobin: '#c62828',
  epo: '#0b7d6b',
  marrow: '#9e6215',
  iron: '#9a6b2e',

  /* Immune */
  pathogen: '#c62828',
  innate: '#9e6215',
  adaptive: '#1c6ee0',
  antibody: '#0b7d6b',
  memory: '#8a3fb5',

  /* Respiratory mechanics */
  compliance: '#0f7c66',
  resistance: '#ab5814',
  vq: '#5b4fd0',

  /* Capillary exchange */
  capillary: '#c0396b',
  interstitium: '#657f21',
  lymph: '#278474',

  /* Hypersensitivity */
  ige: '#c2258c',
  'cytotoxic-ab': '#b4500c',
  'immune-complex': '#6a3fc9',
  'delayed-type': '#0f7c66',
  complement: '#0b7ea8',

  /* Special senses */
  retina: '#6d4fc1',
  cochlea: '#a06a10',
  vestibular: '#0f7c66',

  /* Somatosensation / motor / pain */
  nociception: '#8c2f39',
  'basal-ganglia': '#47679e',

  /* Pregnancy / circulation */
  placenta: '#2e7ea2',

  /* Blood groups / thermoregulation / exercise */
  transfusion: '#2f6db5',
  thermal: '#c65200',
  exercise: '#2e7d46',

  /* Native-only fills with no web token: the generic organ body, and the liver's glycogen
   * level (the web washes `--glucose` towards transparent; native draws it at low opacity). */
  organ: '#f1f5f9',
  glycogenFill: '#8a6c00',
};

/** A token to its hex, or `undefined` when there is none. For callers that would rather draw
 * nothing than draw a wrong colour — a readout tile simply goes without its accent rule. */
export function lookupColor(token?: string): string | undefined {
  if (!token) return undefined;
  return TOKEN_PALETTE[token];
}

/** A token to its hex. An unknown token is black — deliberately loud, so a missing entry shows
 * up the first time the diagram is looked at rather than passing as a plausible grey. */
export function resolveColor(token?: string): string {
  return lookupColor(token) ?? '#000000';
}
