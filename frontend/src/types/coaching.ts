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
    key: 'endurance',
    name: 'Coach Rivera',
    title: 'Endurance Specialist',
    philosophy: 'Heart rate training, conditioning, and building an unstoppable aerobic engine.',
    icon: '🏃',
  },
  {
    key: 'wellness',
    name: 'Coach Jordan',
    title: 'Wellness Guide',
    philosophy: 'Balanced approach. Sustainable habits, recovery, and long-term health.',
    icon: '🧘',
  },
];
