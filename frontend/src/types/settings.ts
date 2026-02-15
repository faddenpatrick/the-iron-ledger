export interface UserSettings {
  theme: 'dark' | 'light';
  units: 'lbs' | 'kg';
  default_rest_timer: number;
  macro_target_calories: number | null;
  macro_target_protein: number | null;
  macro_target_carbs: number | null;
  macro_target_fat: number | null;
}

export interface UpdateUserSettingsRequest {
  theme?: 'dark' | 'light';
  units?: 'lbs' | 'kg';
  default_rest_timer?: number;
  macro_target_calories?: number | null;
  macro_target_protein?: number | null;
  macro_target_carbs?: number | null;
  macro_target_fat?: number | null;
}
