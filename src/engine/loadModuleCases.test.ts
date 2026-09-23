import { describe, expect, it } from 'vitest';
import { loadModuleCases } from './loadModuleCases';

describe('loadModuleCases', () => {
  it('loads the full beds for a module that has them', async () => {
    const beds = await loadModuleCases('shockStates');
    expect(beds.map((bed) => bed.id)).toEqual([
      'amina-trauma',
      'george-post-mi',
      'ruth-warm-shock',
    ]);
    // Full beds, not the round-board projection: the chart accessors come along.
    for (const bed of beds) {
      expect(Array.isArray(bed.chart)).toBe(true);
      expect(bed.chart.length).toBeGreaterThan(0);
    }
  });

  it('resolves empty for a module without beds', async () => {
    await expect(loadModuleCases('venousReturn')).resolves.toEqual([]);
  });
});
