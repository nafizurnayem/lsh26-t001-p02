export type ExpiryStatus = "expired" | "expiring_30" | "expiring_90" | "safe";

export interface Medicine {
  id: string;
  name: string;
  company: string;
  batch: string;
  quantity: number;
  unit_price_bdt: number;
  expiry_date: string;
  returned_at: string | null;
  created_at: string;
  updated_at: string;
  days_left: number;
  status: ExpiryStatus;
  stock_value_bdt: number;
}

export interface Dashboard {
  as_of_date: string;
  active_item_count: number;
  counts: Record<ExpiryStatus, number>;
  values: {
    expired_bdt: number;
    expiring_soon_bdt: number;
    total_at_risk_bdt: number;
  };
}

export interface MedicineListResponse {
  count: number;
  medicines: Medicine[];
}

export interface ReturnResponse {
  message: string;
  medicine: Medicine;
}
