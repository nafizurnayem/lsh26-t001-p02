import { classifyExpiry, daysUntil, getDhakaToday } from "./expiry.js";
import {
  listActiveMedicines,
  listReturnedMedicines,
  markMedicineReturned,
} from "./repository.js";
import type { ExpiryStatus, MedicineRow, MedicineView } from "./types.js";

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toView(row: MedicineRow, today: string): MedicineView {
  const daysLeft = daysUntil(row.expiry_date, today);
  return {
    ...row,
    unit_price_bdt: Number(row.unit_price_bdt),
    days_left: daysLeft,
    status: classifyExpiry(daysLeft),
    stock_value_bdt: money(row.quantity * Number(row.unit_price_bdt)),
  };
}

export async function getActiveMedicines(filters: {
  status?: ExpiryStatus;
  search?: string;
  company?: string;
  today?: string;
}): Promise<MedicineView[]> {
  const today = filters.today ?? getDhakaToday();
  const search = filters.search?.trim().toLocaleLowerCase();
  const company = filters.company?.trim().toLocaleLowerCase();

  return (await listActiveMedicines())
    .map((row) => toView(row, today))
    .filter((row) => !filters.status || row.status === filters.status)
    .filter(
      (row) =>
        !search ||
        row.name.toLocaleLowerCase().includes(search) ||
        row.company.toLocaleLowerCase().includes(search),
    )
    .filter(
      (row) => !company || row.company.toLocaleLowerCase() === company,
    );
}

export async function getReturnedMedicines(
  today = getDhakaToday(),
): Promise<MedicineView[]> {
  return (await listReturnedMedicines()).map((row) => toView(row, today));
}

export async function returnMedicine(id: string): Promise<MedicineRow | null> {
  return markMedicineReturned(id);
}

export async function getDashboard(today = getDhakaToday()) {
  const medicines = await getActiveMedicines({ today });
  const counts: Record<ExpiryStatus, number> = {
    expired: 0,
    expiring_30: 0,
    expiring_90: 0,
    safe: 0,
  };
  let expiredBdt = 0;
  let expiringSoonBdt = 0;

  for (const medicine of medicines) {
    counts[medicine.status] += 1;
    if (medicine.status === "expired") expiredBdt += medicine.stock_value_bdt;
    if (medicine.status === "expiring_30") {
      expiringSoonBdt += medicine.stock_value_bdt;
    }
  }

  return {
    as_of_date: today,
    active_item_count: medicines.length,
    counts,
    values: {
      expired_bdt: money(expiredBdt),
      expiring_soon_bdt: money(expiringSoonBdt),
      total_at_risk_bdt: money(expiredBdt + expiringSoonBdt),
    },
  };
}
