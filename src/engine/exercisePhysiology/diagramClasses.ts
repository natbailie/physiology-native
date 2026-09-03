import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  flowFrame: { fill: 'none', stroke: 'panel-border', strokeWidth: 1 },
  maxLine: { stroke: 'danger', strokeWidth: 1.5, dash: '6,3' },
  thresholdLine: { stroke: 'warn', strokeWidth: 1.5, dash: '4,3' },
};
