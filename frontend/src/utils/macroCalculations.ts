/**
 * Utility functions for macro calculations and conversions
 */

// Calorie constants per gram
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
} as const;

export type MacroType = keyof typeof CALORIES_PER_GRAM;

/**
 * Calculate calories from grams for a specific macro
 */
export function calculateMacroCalories(grams: number, macroType: MacroType): number {
  return grams * CALORIES_PER_GRAM[macroType];
}

/**
 * Convert grams to percentage of total calories
 */
export function gramsToPercentage(
  grams: number,
  macroType: MacroType,
  totalCalories: number
): number {
  if (totalCalories <= 0) return 0;
  const calories = calculateMacroCalories(grams, macroType);
  return Math.round((calories / totalCalories) * 100);
}

/**
 * Convert percentage to grams based on total calories
 */
export function percentageToGrams(
  percentage: number,
  macroType: MacroType,
  totalCalories: number
): number {
  const calories = (totalCalories * percentage) / 100;
  return Math.round(calories / CALORIES_PER_GRAM[macroType]);
}

/**
 * Validate that percentages sum to 100
 */
export function validatePercentageSum(
  protein: number,
  carbs: number,
  fat: number
): { isValid: boolean; total: number } {
  const total = protein + carbs + fat;
  return {
    isValid: total === 100,
    total,
  };
}

/**
 * Calculate total calories from macro grams
 */
export function calculateTotalCalories(
  proteinGrams: number,
  carbsGrams: number,
  fatGrams: number
): number {
  return (
    calculateMacroCalories(proteinGrams, 'protein') +
    calculateMacroCalories(carbsGrams, 'carbs') +
    calculateMacroCalories(fatGrams, 'fat')
  );
}
