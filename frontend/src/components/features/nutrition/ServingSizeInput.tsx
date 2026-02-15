import React, { useState, useEffect } from 'react';

interface ServingSizeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type WeightUnit = 'g' | 'oz' | 'lb' | 'kg';

interface ParsedServing {
  amount: number;
  unit: WeightUnit | null;
  originalText: string;
}

const WEIGHT_UNITS: WeightUnit[] = ['g', 'oz', 'lb', 'kg'];

// Conversion factors to grams
const TO_GRAMS: Record<WeightUnit, number> = {
  g: 1,
  oz: 28.3495,
  lb: 453.592,
  kg: 1000,
};

const parseServingSize = (input: string): ParsedServing => {
  const trimmed = input.trim().toLowerCase();

  // Try to extract weight amount and unit
  const weightMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*(g|oz|lb|kg)$/);

  if (weightMatch) {
    return {
      amount: parseFloat(weightMatch[1]),
      unit: weightMatch[2] as WeightUnit,
      originalText: input,
    };
  }

  return {
    amount: 0,
    unit: null,
    originalText: input,
  };
};

const convertWeight = (amount: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  // Convert to grams first, then to target unit
  const grams = amount * TO_GRAMS[fromUnit];
  return grams / TO_GRAMS[toUnit];
};

export const ServingSizeInput: React.FC<ServingSizeInputProps> = ({
  value,
  onChange,
  placeholder = 'e.g., 100g, 4oz, 1 cup',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [showUnitToggle, setShowUnitToggle] = useState(false);
  const [currentUnit, setCurrentUnit] = useState<WeightUnit | null>(null);
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const parsed = parseServingSize(value);
    setDisplayValue(value);
    setShowUnitToggle(parsed.unit !== null);
    setCurrentUnit(parsed.unit);
    setAmount(parsed.amount);
  }, [value]);

  const handleInputChange = (newValue: string) => {
    setDisplayValue(newValue);
    const parsed = parseServingSize(newValue);
    setShowUnitToggle(parsed.unit !== null);
    setCurrentUnit(parsed.unit);
    setAmount(parsed.amount);
    onChange(newValue);
  };

  const handleUnitToggle = (newUnit: WeightUnit) => {
    if (!currentUnit || !amount) return;

    const convertedAmount = convertWeight(amount, currentUnit, newUnit);
    const roundedAmount = Math.round(convertedAmount * 10) / 10; // Round to 1 decimal
    const newValue = `${roundedAmount}${newUnit}`;

    setDisplayValue(newValue);
    setCurrentUnit(newUnit);
    setAmount(roundedAmount);
    onChange(newValue);
  };

  return (
    <div className="space-y-2 w-full">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="input w-full"
      />

      {showUnitToggle && currentUnit && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 whitespace-nowrap">Convert to:</span>
          {WEIGHT_UNITS.filter(u => u !== currentUnit).map((unit) => (
            <button
              key={unit}
              onClick={() => handleUnitToggle(unit)}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-lg text-gray-300 flex-shrink-0"
            >
              {unit}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
