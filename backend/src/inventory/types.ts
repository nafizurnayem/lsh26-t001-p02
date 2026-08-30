export type ExpiryStatus = "expired" | "expiring_30" | "expiring_90" | "safe";

export interface MedicineRow {
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
}

export interface MedicineView extends MedicineRow {
  days_left: number;
  status: ExpiryStatus;
  stock_value_bdt: number;
}
