import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";
import { seedDataFile } from "../db/seed.js";
import type { MedicineRow } from "./types.js";

function ensureDataFile(): void {
  if (fs.existsSync(config.dataFilePath)) return;

  // Serverless: hydrate the writable copy from the read-only file that ships
  // with the deployment, so we don't need the large public dataset at runtime.
  if (
    config.bundledDataFilePath !== config.dataFilePath &&
    fs.existsSync(config.bundledDataFilePath)
  ) {
    fs.mkdirSync(path.dirname(config.dataFilePath), { recursive: true });
    fs.copyFileSync(config.bundledDataFilePath, config.dataFilePath);
    return;
  }

  seedDataFile();
}

function readMedicines(): MedicineRow[] {
  ensureDataFile();
  const medicines = JSON.parse(
    fs.readFileSync(config.dataFilePath, "utf8"),
  ) as MedicineRow[];

  if (!Array.isArray(medicines)) {
    throw new Error("Medicine data file must contain a JSON array.");
  }
  return medicines;
}

function writeMedicines(medicines: MedicineRow[]): void {
  fs.mkdirSync(path.dirname(config.dataFilePath), { recursive: true });
  const temporaryPath = `${config.dataFilePath}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(medicines, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryPath, config.dataFilePath);
}

export async function listActiveMedicines(): Promise<MedicineRow[]> {
  return readMedicines()
    .filter((medicine) => medicine.returned_at === null)
    .sort(
      (first, second) =>
        first.expiry_date.localeCompare(second.expiry_date) ||
        first.name.localeCompare(second.name),
    );
}

export async function listReturnedMedicines(): Promise<MedicineRow[]> {
  return readMedicines()
    .filter((medicine) => medicine.returned_at !== null)
    .sort((first, second) =>
      (second.returned_at ?? "").localeCompare(first.returned_at ?? ""),
    );
}

export async function markMedicineReturned(
  id: string,
): Promise<MedicineRow | null> {
  const medicines = readMedicines();
  const medicine = medicines.find(
    (entry) => entry.id === id && entry.returned_at === null,
  );
  if (!medicine) return null;

  const now = new Date().toISOString();
  medicine.returned_at = now;
  medicine.updated_at = now;
  writeMedicines(medicines);
  return medicine;
}
