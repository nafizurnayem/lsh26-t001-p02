import path from "node:path";

// On Vercel (and most serverless platforms) the deployment filesystem is
// read-only; only /tmp is writable, and it is wiped between cold starts.
// We therefore keep the committed seed file as a read-only source and use a
// writable copy for anything that mutates state (vendor returns).
const isServerless = Boolean(process.env.VERCEL) || process.env.SERVERLESS === "1";

const bundledDataFilePath = path.resolve(
  process.env.DATA_FILE_PATH ?? "./data/medicines.json",
);

export const config = {
  port: Number(process.env.PORT ?? 4000),
  datasetPath: path.resolve(
    process.env.DATASET_PATH ?? "../P02_pharmacy_expiry_public.json",
  ),
  // Read-only source that ships with the deployment.
  bundledDataFilePath,
  // Writable location the app actually reads from and writes to.
  dataFilePath: isServerless ? "/tmp/medicines.json" : bundledDataFilePath,
  seedCaseId: process.env.SEED_CASE_ID ?? "PUB-12",
  // Comma-separated list of allowed origins, or "*" for any origin.
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
};
