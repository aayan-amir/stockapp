const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const prismaDir = path.resolve(process.cwd(), "prisma");

function run(command) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`[db:init] Command failed: ${command}`);
    throw error;
  }
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
    if (error.code === "EROFS") {
      return { writable: false, reason: "EROFS" };
    }
    if (error.code === "EACCES") {
      return { writable: false, reason: "EACCES" };
    }
    throw error;
  }
}

const sqlitePath = resolveSqlitePath(process.env.DATABASE_URL);
const sqliteParentDir = sqlitePath ? path.dirname(sqlitePath) : null;
const parentWriteCheck = sqlitePath ? ensureParentWritable(sqlitePath) : null;

if (sqlitePath && parentWriteCheck && !parentWriteCheck.writable) {
  const reasonMessage =
    parentWriteCheck.reason === "EACCES"
      ? "permission denied (EACCES)"
      : "read-only filesystem (EROFS)";
  console.warn(`[db:init] SQLite parent directory is not writable (${reasonMessage}): ${sqliteParentDir}`);
  if (!fs.existsSync(sqlitePath)) {
    console.warn(
      `[db:init] SQLite database file does not exist at ${sqlitePath}. The app may fail at runtime unless the database is created on a writable mount.`
    );
  }
  console.warn("[db:init] Skipping prisma db push/seed and running prisma generate only.");
  run("npx prisma generate");
  process.exit(0);
}

if (!sqlitePath) {
  const databaseUrl = process.env.DATABASE_URL;
  const reason = databaseUrl
    ? `DATABASE_URL is non-SQLite (${databaseUrl.split(":")[0]} protocol)`
    : "DATABASE_URL is not set";
  console.log(
    `[db:init] ${reason}; running standard prisma db push + generate + seed.`
  );
}

run("npx prisma db push");
run("npx prisma generate");
run("npm run db:seed");
