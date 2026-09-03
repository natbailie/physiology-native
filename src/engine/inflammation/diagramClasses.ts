import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  insultBacteria: { fill: 'danger', fillOpacity: 0.7 },
  insultCrystal: { fill: 'danger', fillOpacity: 0.5 },
  insultForeign: { fill: 'text-dim', fillOpacity: 0.55 },
  macrophageDot: { fill: 'artery', fillOpacity: 0.55 },
  monoBar: { fill: 'artery', fillOpacity: 0.55 },
  neutBar: { fill: 'o2', fillOpacity: 0.55 },
  neutrophilDot: { fill: 'o2', fillOpacity: 0.6 },
  pusBar: { fill: 'text-faint', fillOpacity: 0.5 },
  pusPool: { fill: 'text-faint', fillOpacity: 0.45 },
  tissue: { fill: 'text-dim', fillOpacity: 0.12, stroke: 'text-dim', strokeWidth: 1 },
};
