import fs from 'fs';
import path from 'path';

/**
 * Unified data access layer for all JSON file storage.
 * Handles serverless environments (Netlify, Vercel) where the
 * project directory is read-only and only /tmp is writable.
 * 
 * Strategy:
 * 1. Try to read/write from project data/ directory (works locally)
 * 2. On serverless, fall back to /tmp for writes
 * 3. On first cold start, seed /tmp from bundled data/ files if available
 */

const isServerless = () => {
  return (
    process.env.NETLIFY === 'true' ||
    process.env.URL?.includes('netlify.app') ||
    process.env.VERCEL === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined
  );
};

/**
 * Get the correct file path for a data file.
 * On serverless: uses /tmp
 * Locally: uses project data/ directory
 */
export function getDataFilePath(filename: string): string {
  if (isServerless()) {
    return path.join('/tmp', filename);
  }
  return path.join(process.cwd(), 'data', filename);
}

/**
 * Get the bundled (source) file path in the project data/ directory.
 * Used to seed /tmp on cold starts.
 */
function getBundledFilePath(filename: string): string {
  return path.join(process.cwd(), 'data', filename);
}

/**
 * Ensure the data directory exists (local dev only).
 */
function ensureDataDir(): void {
  if (!isServerless()) {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
}

/**
 * Read a JSON data file. On serverless, if the /tmp file doesn't exist,
 * try to seed it from the bundled data/ file. If neither exists, return
 * the provided default value.
 */
export function readJsonFile<T>(filename: string, defaultValue: T): T {
  const filePath = getDataFilePath(filename);

  try {
    // If file exists at the target path, read it
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      if (data && data.trim()) {
        return JSON.parse(data);
      }
      return defaultValue;
    }

    // On serverless, try to seed from bundled data
    if (isServerless()) {
      const bundledPath = getBundledFilePath(filename);
      if (fs.existsSync(bundledPath)) {
        try {
          const bundledData = fs.readFileSync(bundledPath, 'utf-8');
          // Copy to /tmp for subsequent reads/writes
          fs.writeFileSync(filePath, bundledData);
          if (bundledData && bundledData.trim()) {
            return JSON.parse(bundledData);
          }
        } catch {
          // Bundled file might be read-only or corrupted
        }
      }
    }

    // File doesn't exist anywhere, create it with defaults
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
    return defaultValue;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return defaultValue;
  }
}

/**
 * Write data to a JSON file.
 */
export function writeJsonFile<T>(filename: string, data: T): void {
  const filePath = getDataFilePath(filename);
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    // If local write fails, try /tmp as last resort
    if (!isServerless()) {
      try {
        const tmpPath = path.join('/tmp', filename);
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
      } catch {
        // Both paths failed
      }
    }
  }
}
