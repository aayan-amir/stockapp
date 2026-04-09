const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const prismaDir = path.resolve(process.cwd(), "prisma");

function run(command) {
  execSync(command, { stdio: "inherit" });
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
    return true;
  } catch (error) {
    if (error.code === "EROFS" || error.code === "EACCES") {
      return false;
    }
    throw error;
  }
}

const sqlitePath = resolveSqlitePath(process.env.DATABASE_URL);
const sqliteParentDir = sqlitePath ? path.dirname(sqlitePath) : null;

if (sqlitePath && !ensureParentWritable(sqlitePath)) {
  console.warn(
    `[db:init] Skipping prisma db push/seed because SQLite parent directory is not writable: ${sqliteParentDir}`
  );
  run("npx prisma generate");
  process.exit(0);
}

if (!sqlitePath) {
  console.log(
    "[db:init] DATABASE_URL is not a SQLite file URL; running standard prisma db push + generate + seed."
  );
}

run("npx prisma db push");
run("npx prisma generate");
run("npm run db:seed");
