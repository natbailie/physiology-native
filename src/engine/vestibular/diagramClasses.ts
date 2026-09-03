import type { DiagramClasses } from '../../presentation/diagramClassTypes';

/**
 * This module's diagram classes, ported from its own `components/Diagram.module.css` in the web
 * project. Scoped per module because the web scopes them with CSS modules — the same class name
 * means different things in different ones.
 */
export const diagramClasses: DiagramClasses = {
  ampulla: { fill: 'vestibular', fillOpacity: { var: 'drive', scale: 1.3 }, stroke: 'vestibular', strokeWidth: 1.5 },
  beam: { stroke: 'text-dim', strokeWidth: 3, linecap: 'round' },
  beamEnd: { fill: 'vestibular' },
  beamPivot: { stroke: 'panel-border', strokeWidth: 2 },
  brainstem: { fill: 'axon', fillOpacity: { wash: 'faint' }, stroke: 'axon', strokeWidth: 1.5 },
  canal: { fill: 'none', stroke: 'vestibular', strokeWidth: 2.5, opacity: 0.75 },
  canalPosterior: { fill: 'none', stroke: 'vestibular', strokeWidth: { var: 'debris', base: 2.5, scale: 2 }, opacity: { var: 'debris', base: 0.6, scale: 0.4 } },
  canalith: { fill: 'danger', opacity: { var: 'debris', base: 0.3, scale: 0.7 } },
  nerve: { fill: 'none', stroke: 'axon', strokeWidth: 2.5, linecap: 'round' },
  otolith: { fill: 'vestibular', fillOpacity: { var: 'otolith', scaleWash: 'base' }, stroke: 'vestibular', strokeWidth: 1.2 },
  rate: { fontSize: 13, fontWeight: '600', fill: 'text' },
  sideTick: { fontSize: 9, fill: 'text-faint' },
  slipArrow: { stroke: 'danger', strokeWidth: 3, linecap: 'round' },
  slipTrack: { stroke: 'panel-border', strokeWidth: 2, linecap: 'round' },
};
