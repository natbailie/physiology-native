/** Which view of a module is showing. Clinic exists only where a module has beds. */
export type ModuleTab = 'lab' | 'clinic' | 'questions' | 'lessons';

export interface TabSegment {
  value: ModuleTab;
  label: string;
}

/**
 * The strip for a module, in web order and web words. Modules without beds get three
 * segments; bedded ones get the Patients tab second, where the web puts it.
 */
export function tabsForModule(hasCases: boolean): readonly TabSegment[] {
  if (hasCases) {
    return [
      { value: 'lab', label: 'Lab' },
      { value: 'clinic', label: 'Patients' },
      { value: 'questions', label: 'Questions' },
      { value: 'lessons', label: 'Lessons' },
    ];
  }
  return [
    { value: 'lab', label: 'Lab' },
    { value: 'questions', label: 'Questions' },
    { value: 'lessons', label: 'Lessons' },
  ];
}

/** A tab that does not exist here is the lab. Reachable only through a stale press — the
 * strip never offers clinic where there are no beds — so this is a guard, not a path. */
export function clampTab(tab: ModuleTab, hasCases: boolean): ModuleTab {
  return tab === 'clinic' && !hasCases ? 'lab' : tab;
}
