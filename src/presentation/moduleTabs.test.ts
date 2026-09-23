import { describe, expect, it } from 'vitest';
import { clampTab, tabsForModule } from './moduleTabs';

describe('moduleTabs', () => {
  it('offers Lab, Questions and Lessons everywhere', () => {
    expect(tabsForModule(false).map((s) => s.label)).toEqual(['Lab', 'Questions', 'Lessons']);
  });

  it('seats Patients second where there are beds, in web order and words', () => {
    expect(tabsForModule(true).map((s) => s.label)).toEqual(['Lab', 'Patients', 'Questions', 'Lessons']);
    expect(tabsForModule(true).map((s) => s.value)).toEqual(['lab', 'clinic', 'questions', 'lessons']);
  });

  it('clamps a stale clinic tab back to the lab', () => {
    expect(clampTab('clinic', false)).toBe('lab');
    expect(clampTab('clinic', true)).toBe('clinic');
    expect(clampTab('questions', false)).toBe('questions');
  });
});
