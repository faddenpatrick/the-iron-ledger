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
    key: 'old_school',
    name: 'Old School Bodybuilder',
    title: 'The Golden Era',
    philosophy:
      'High volume, pump chasing, aesthetics, and the mind-muscle connection.',
    icon: '🏛️',
  },
  {
    key: 'strategic',
    name: 'Strategic Programmer',
    title: 'Data-Driven Growth',
    philosophy:
      'Progressive overload, structured periodization, and disciplined consistency.',
    icon: '🎯',
  },
  {
    key: 'relentless',
    name: 'Relentless Endurance',
    title: 'Never Quit',
    philosophy:
      'Mental toughness, embrace the suffering, and outwork everyone.',
    icon: '🔥',
  },
  {
    key: 'functional',
    name: 'Functional Athlete',
    title: 'Performance First',
    philosophy:
      'Well-rounded fitness, compound movements, and real-world performance.',
    icon: '⚡',
  },
  {
    key: 'wellness',
    name: 'Balanced Wellness',
    title: 'Sustainable Strength',
    philosophy:
      'Holistic health, recovery-focused, and long-term sustainable habits.',
    icon: '🧘',
  },
];
