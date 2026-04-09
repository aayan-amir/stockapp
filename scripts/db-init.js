const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const prismaDir = path.resolve(process.cwd(), "prisma");
const envFilePath = path.resolve(process.cwd(), ".env");
const NON_WRITABLE_FS_ERROR_CODES = ["EROFS", "EACCES", "EPERM", "ENOENT"];
const reasonMessages = {
  EACCES: "permission denied (EACCES)",
  EPERM: "operation not permitted (EPERM)",
  ENOENT: "parent path not found (ENOENT)",
  EROFS: "read-only filesystem (EROFS)",
};

function run(command) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`[db:init] Command failed: ${command}`);
    throw error;
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const env = {};
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function normalizeSqliteUrl(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) {
    return { value: databaseUrl, normalized: false };
  }

  const raw = databaseUrl.slice(5);
  const [rawPath, ...queryParts] = raw.split("?");
  if (!rawPath) return { value: databaseUrl, normalized: false };

  if (
    rawPath.startsWith("/") ||
    rawPath.startsWith("./") ||
    rawPath.startsWith("../") ||
    /^[A-Za-z]:[\\/]/.test(rawPath)
  ) {
    return { value: databaseUrl, normalized: false };
  }

  const querySuffix = queryParts.length > 0 ? `?${queryParts.join("?")}` : "";
  const firstSegment = rawPath.split("/")[0];
  let rootDirNames = new Set();
  try {
    rootDirNames = new Set(fs.readdirSync("/"));
  } catch (_error) {
    rootDirNames = new Set();
  }
  const shouldNormalizeAbsoluteMissingSlash =
    rawPath.includes("/") && rootDirNames.has(firstSegment);

  if (!shouldNormalizeAbsoluteMissingSlash) {
    return { value: databaseUrl, normalized: false };
  }

  return {
    value: `file:/${rawPath}${querySuffix}`,
    normalized: true,
  };
}

function resolveSqlitePath(databaseUrl) {
  if (!databaseUrl || !databaseUrl.startsWith("file:")) return null;

  const filePath = databaseUrl.slice(5).split("?")[0];
  if (!filePath) return null;

  if (path.isAbsolute(filePath)) return filePath;
  return path.resolve(prismaDir, filePath);
}

function ensureParentWritable(filePath) {
  const parentDir = path.dirname(filePath);
  try {
    fs.mkdirSync(parentDir, { recursive: true });
    fs.accessSync(parentDir, fs.constants.W_OK);
    return { writable: true };
  } catch (error) {
    if (NON_WRITABLE_FS_ERROR_CODES.includes(error.code)) {
      return { writable: false, reason: error.code };
    }
    throw error;
  }
}

function ensureFileExists(filePath) {
  try {
    // Touch file if missing (or verify openability if it exists) before Prisma connects.
    fs.closeSync(fs.openSync(filePath, "a"));
    return { ok: true };
  } catch (error) {
    if (NON_WRITABLE_FS_ERROR_CODES.includes(error.code)) {
      return { ok: false, reason: error.code };
    }
    throw error;
  }
}

const envFromFile = readEnvFile(envFilePath);
const originalDatabaseUrl = process.env.DATABASE_URL || envFromFile.DATABASE_URL;
const normalizedUrlResult = normalizeSqliteUrl(originalDatabaseUrl);
const databaseUrl = normalizedUrlResult.value;

if (normalizedUrlResult.normalized) {
  console.warn(
    `[db:init] Normalized DATABASE_URL from "${originalDatabaseUrl}" to "${databaseUrl}" to use an absolute SQLite path.`
  );
}

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const sqlitePath = resolveSqlitePath(databaseUrl);
const sqliteParentDir = sqlitePath ? path.dirname(sqlitePath) : null;
const parentWriteCheck = sqlitePath ? ensureParentWritable(sqlitePath) : null;

if (sqlitePath && parentWriteCheck && !parentWriteCheck.writable) {
  const reasonMessage = reasonMessages[parentWriteCheck.reason] || parentWriteCheck.reason;
  console.warn(`[db:init] SQLite parent directory is not writable (${reasonMessage}): ${sqliteParentDir}`);
  if (!fs.existsSync(sqlitePath)) {
    console.error(
      `[db:init] SQLite database file does not exist at ${sqlitePath} and parent directory is not writable. Refusing to continue to prevent runtime Prisma open-file failures.`
    );
    process.exit(1);
  }
  console.warn("[db:init] Skipping prisma db push/seed and running prisma generate only.");
  run("npx --no-install prisma generate");
  process.exit(0);
}

if (!sqlitePath) {
  const reason = databaseUrl
    ? `DATABASE_URL is non-SQLite (${databaseUrl.split(":")[0]} protocol)`
    : "DATABASE_URL is not set";
  console.log(
    `[db:init] ${reason}; running standard prisma db push + generate + seed.`
  );
} else {
  const fileCheck = ensureFileExists(sqlitePath);
  if (!fileCheck.ok) {
    const reasonMessage = reasonMessages[fileCheck.reason] || fileCheck.reason;
    console.error(
      `[db:init] Failed to ensure SQLite file exists at ${sqlitePath} (${reasonMessage}). Refusing to start to prevent runtime open-file failures.`
    );
    process.exit(1);
  }
}

run("npx --no-install prisma db push");
run("npx --no-install prisma generate");
run("npm run db:seed");
