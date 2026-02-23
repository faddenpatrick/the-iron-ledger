export interface UserSettings {
  theme: 'dark' | 'light';
  units: 'lbs' | 'kg';
  default_rest_timer: number;
  macro_target_calories: number | null;
  macro_target_protein: number | null;
  macro_target_carbs: number | null;
  macro_target_fat: number | null;
  macro_input_mode: 'grams' | 'percentage';
  macro_percentage_protein: number | null;
  macro_percentage_carbs: number | null;
  macro_percentage_fat: number | null;
  coach_type: string;
}

export interface UpdateUserSettingsRequest {
  theme?: 'dark' | 'light';
  units?: 'lbs' | 'kg';
  default_rest_timer?: number;
  macro_target_calories?: number | null;
  macro_target_protein?: number | null;
  macro_target_carbs?: number | null;
  macro_target_fat?: number | null;
  macro_input_mode?: 'grams' | 'percentage';
  macro_percentage_protein?: number | null;
  macro_percentage_carbs?: number | null;
  macro_percentage_fat?: number | null;
  coach_type?: string;
}
