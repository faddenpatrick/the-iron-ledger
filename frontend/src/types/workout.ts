export type SetType = 'warmup' | 'normal' | 'drop_set' | 'failure';
export type WorkoutType = 'lifting' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  notes: string | null;
  exercise: Exercise;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  workout_type: WorkoutType;
  created_at: string;
  updated_at: string;
  exercises: TemplateExercise[];
}

export interface WorkoutTemplateList {
  id: string;
  user_id: string;
  name: string;
  workout_type: WorkoutType;
  created_at: string;
  updated_at: string;
}

export interface Set {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name_snapshot: string;
  set_number: number;
  set_type: SetType;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  template_id: string | null;
  template_name_snapshot: string | null;
  workout_type: WorkoutType;
  workout_date: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sets: Set[];
}

export interface WorkoutList {
  id: string;
  user_id: string;
  template_id: string | null;
  template_name_snapshot: string | null;
  workout_type: WorkoutType;
  workout_date: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  workout_type?: WorkoutType;
  exercises: {
    exercise_id: string;
    order_index: number;
    target_sets?: number;
    target_reps?: number;
    notes?: string;
  }[];
}

export interface CreateWorkoutRequest {
  template_id?: string;
  workout_type?: WorkoutType;
  workout_date: string;
  started_at: string;
}

export interface CreateSetRequest {
  exercise_id: string;
  set_number: number;
  set_type?: SetType;
  weight?: number;
  reps?: number;
  rpe?: number;
}

export interface UpdateSetRequest {
  set_type?: SetType;
  weight?: number;
  reps?: number;
  rpe?: number;
  is_completed?: boolean;
}

export interface PreviousSetData {
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export interface PreviousPerformance {
  exercise_id: string;
  has_previous: boolean;
  previous_workout_date: string | null;
  previous_sets: PreviousSetData[];
}
