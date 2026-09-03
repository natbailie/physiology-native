import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  axisLabel: { fontSize: 8, fill: 'text-faint', anchor: 'middle' },
  baselineTrail: { fill: 'none', stroke: 'text-faint', strokeWidth: 1.4, dash: '3,3', opacity: 0.55 },
  bufferLine: { fill: 'none', stroke: 'bicarb', strokeWidth: 1.6, opacity: 0.75 },
  isopleth: { fill: 'none', stroke: 'co2', strokeWidth: 1, dash: '3,4', opacity: 0.5 },
  isoplethLabel: { fontSize: 7, fill: 'co2', opacity: 0.85, anchor: 'middle', stroke: 'panel', strokeWidth: 2.5 },
  livePoint: { fill: 'ph', stroke: 'panel', strokeWidth: 1.5 },
  normalPoint: { fill: 'none', stroke: 'text-faint', strokeWidth: 1.2, dash: '2,2' },
  plotAxis: { stroke: 'text-faint', strokeWidth: 1.2 },
  plotGrid: { stroke: 'grid-line', strokeWidth: 1 },
  regionLabel: { fontSize: 7, fill: 'text-faint', anchor: 'middle', opacity: 0.85, stroke: 'panel', strokeWidth: 2.5 },
  trail: { fill: 'none', stroke: 'ph', strokeWidth: 1.6, linecap: 'round', opacity: 0.45 },
};
