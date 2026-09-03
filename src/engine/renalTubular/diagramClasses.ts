import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  aquaporinArrow: { stroke: 'adh', strokeWidth: 2, opacity: { var: 'adh-action', base: 0, scale: 1 } },
  cortexDivider: { stroke: 'panel-border', strokeWidth: 1, dash: '4,4' },
  medullaLabel: { fontSize: 8, fill: 'text-faint' },
  osmolalityMarker: { fill: 'medulla', fillOpacity: { var: 'osm-intensity', scaleWash: 'strong' } },
  osmolalityValue: { fontSize: 8, fill: 'text', anchor: 'middle' },
  segmentLabel: { fontSize: 7.5, fill: 'text-dim', anchor: 'middle' },
  tubuleSegment: { stroke: 'tubule', strokeWidth: 2.5, fill: 'none', linecap: 'round', opacity: 0.9 },
};
