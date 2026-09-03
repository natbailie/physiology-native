import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  chamber: { strokeWidth: 2.5 },
  pericardium: { fill: 'none', stroke: 'danger', strokeWidth: { var: 'pericardial', base: 1, scale: 5 }, opacity: { var: 'pericardial', base: 0.35, scale: 0.65 } },
  tank: { fill: 'none', stroke: 'venous', strokeWidth: 2.5 },
  tissue: { fill: 'text-faint', fillOpacity: { wash: 'faint' }, stroke: 'text-faint', strokeWidth: 1.5, dash: '4,4' },
};
