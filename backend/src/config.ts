import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// On Vercel (and most serverless platforms) the deployment filesystem is
// read-only; only /tmp is writable, and it is wiped between cold starts.
// We therefore keep the committed seed file as a read-only source and use a
// writable copy for anything that mutates state (vendor returns).
const isServerless = Boolean(process.env.VERCEL) || process.env.SERVERLESS === "1";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

// The committed seed file (backend/data/medicines.json). Its location relative
// to the compiled module is stable; cwd on serverless is not, so try a few
// candidates and use the first that exists.
function resolveBundledDataFile(): string {
  const explicit = process.env.DATA_FILE_PATH
    ? path.resolve(process.env.DATA_FILE_PATH)
    : null;
  const candidates = [
    explicit,
    // dist/src/config.js -> backend/data/medicines.json
    path.resolve(moduleDir, "../../data/medicines.json"),
    // dist/config.js -> backend/data/medicines.json
    path.resolve(moduleDir, "../data/medicines.json"),
    path.resolve(process.cwd(), "data/medicines.json"),
    path.resolve(process.cwd(), "backend/data/medicines.json"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]!;
}

const bundledDataFilePath = resolveBundledDataFile();

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
  // Error responses include the underlying message unless EXPOSE_ERRORS=0.
  // Handy while wiring up a fresh deployment; set EXPOSE_ERRORS=0 to silence.
  exposeErrors: process.env.EXPOSE_ERRORS !== "0",
};
