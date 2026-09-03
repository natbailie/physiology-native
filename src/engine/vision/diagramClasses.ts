import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  chiasm: { fill: 'retina', fillOpacity: { wash: 'faint' }, stroke: 'text-faint', strokeWidth: 1.2 },
  cortex: { fill: 'retina', fillOpacity: { wash: 'faint' }, stroke: 'retina', strokeWidth: 1.5 },
  eyeOutline: { fill: 'none', stroke: 'text-dim', strokeWidth: 2.5 },
  fibreLeftField: { fill: 'none', strokeWidth: 3, linecap: 'round', stroke: 'retina' },
  fibreRightField: { fill: 'none', strokeWidth: 3, linecap: 'round', stroke: 'bicarb' },
  fieldFrame: { fill: 'none', stroke: 'panel-border', strokeWidth: 1 },
  fieldLetter: { fontSize: 8, fill: 'text-faint' },
  iris: { fill: 'o2', fillOpacity: 0.3, stroke: 'text-dim', strokeWidth: 1 },
  lesionLabel: { fontSize: 10, fontWeight: '600', fill: 'danger' },
  lesionMark: { stroke: 'danger', strokeWidth: 3, linecap: 'round' },
  lgn: { fill: 'retina', fillOpacity: { wash: 'soft' }, stroke: 'retina', strokeWidth: 1.2 },
  pupil: { fill: 'danger', fillOpacity: 0.6 },
  sideTick: { fontSize: 9, fill: 'text-faint' },
  torchBeam: { stroke: 'warn', strokeWidth: 2.5, opacity: 0.85 },
};
