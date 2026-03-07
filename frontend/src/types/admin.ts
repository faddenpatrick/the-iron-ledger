export interface AdminOverview {
  total_users: number;
  users_active_last_7_days: number;
  users_active_last_30_days: number;
  total_workouts_completed: number;
  total_meals_logged: number;
  total_sets_logged: number;
  avg_workouts_per_active_user: number | null;
}

export interface UserGrowthPoint {
  date: string;
  total_users: number;
  new_users: number;
}

export interface UserGrowthResponse {
  data_points: UserGrowthPoint[];
}

export interface UserDetailRow {
  email: string;
  created_at: string;
  last_active: string | null;
  total_workouts: number;
  total_meals: number;
  coach_type: string | null;
  has_macro_targets: boolean;
}

export interface UserListResponse {
  users: UserDetailRow[];
  total: number;
}

export interface FeatureAdoption {
  users_with_templates: number;
  users_with_custom_exercises: number;
  users_with_meals: number;
  users_with_macro_targets: number;
  users_with_supplements: number;
  users_with_measurements: number;
  coach_type_breakdown: Record<string, number>;
}
