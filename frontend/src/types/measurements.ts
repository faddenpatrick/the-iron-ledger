export interface BodyMeasurement {
  id: string;
  measurement_date: string;
  weight: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMeasurementRequest {
  measurement_date: string;
  weight?: number;
  notes?: string;
}
