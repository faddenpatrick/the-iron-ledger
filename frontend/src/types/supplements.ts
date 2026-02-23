export interface Supplement {
  id: string;
  name: string;
  brand: string | null;
  dosage: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplementLog {
  id: string;
  supplement_id: string;
  log_date: string;
  taken: boolean;
  created_at: string;
}

export interface SupplementWithLog {
  id: string;
  name: string;
  brand: string | null;
  dosage: string | null;
  is_active: boolean;
  taken_today: boolean;
}

export interface CreateSupplementRequest {
  name: string;
  brand?: string;
  dosage?: string;
  notes?: string;
}

export interface UpdateSupplementRequest {
  name?: string;
  brand?: string;
  dosage?: string;
  notes?: string;
  is_active?: boolean;
}

export interface LogSupplementRequest {
  supplement_id: string;
  log_date: string;
}
