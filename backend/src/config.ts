import path from "node:path";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  datasetPath: path.resolve(
    process.env.DATASET_PATH ?? "../P02_pharmacy_expiry_public.json",
  ),
  dataFilePath: path.resolve(
    process.env.DATA_FILE_PATH ?? "./data/medicines.json",
  ),
  seedCaseId: process.env.SEED_CASE_ID ?? "PUB-12",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};
