import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { config } from "../config.js";
import type { MedicineRow } from "../inventory/types.js";

interface DatasetItem {
  id: string;
  name: string;
  company: string;
  batch: string;
  quantity: number;
  unit_price_bdt: string;
  expiry: string;
}

interface DatasetCase {
  case_id: string;
  today: string;
  items: DatasetItem[];
  mark_returned: string[];
}

interface Dataset {
  schema_version: string;
  problem_id: string;
  cases: DatasetCase[];
}

export function seedDataFile(): number {
  const dataset = JSON.parse(
    fs.readFileSync(config.datasetPath, "utf8"),
  ) as Dataset;
  const selectedCase = dataset.cases.find(
    (entry) => entry.case_id === config.seedCaseId,
  );

  if (!selectedCase) {
    throw new Error(`Dataset case not found: ${config.seedCaseId}`);
  }

  const now = new Date().toISOString();
  const rows: MedicineRow[] = selectedCase.items.map((item) => ({
    id: item.id,
    name: item.name,
    company: item.company,
    batch: item.batch,
    quantity: item.quantity,
    unit_price_bdt: Number(item.unit_price_bdt),
    expiry_date: item.expiry,
    returned_at: null,
    created_at: now,
    updated_at: now,
  }));

  fs.mkdirSync(path.dirname(config.dataFilePath), { recursive: true });
  fs.writeFileSync(config.dataFilePath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  return selectedCase.items.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = seedDataFile();
  console.log(`Seeded ${count} medicines from ${config.seedCaseId} into JSON storage.`);
}
