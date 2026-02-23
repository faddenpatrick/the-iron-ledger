export interface CoachPersona {
  key: string;
  name: string;
  title: string;
  philosophy: string;
  icon: string;
}

export interface CoachInsight {
  coach_name: string;
  coach_title: string;
  coach_type: string;
  insight: string;
  generated_at: string;
}

export const COACH_OPTIONS: CoachPersona[] = [
  {
    key: 'arnold',
    name: 'Arnold',
    title: 'The Austrian Oak',
    philosophy: 'Old-school bodybuilding. High volume, mind-muscle connection, and relentless drive.',
    icon: '🏛️',
  },
  {
    key: 'jay_cutler',
    name: 'Jay Cutler',
    title: 'Mr. Consistency',
    philosophy: 'Methodical programming. Progressive overload, discipline, and structured growth.',
    icon: '🎯',
  },
  {
    key: 'cam_hanes',
    name: 'Cameron Hanes',
    title: 'Keep Hammering',
    philosophy: 'Ultra-endurance, mental toughness, and outworking everyone. No excuses.',
    icon: '🏔️',
  },
  {
    key: 'goggins',
    name: 'David Goggins',
    title: 'Stay Hard',
    philosophy: 'The 40% rule. Callous the mind. Embrace the suffering.',
    icon: '🔥',
  },
];
