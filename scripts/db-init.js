const { execSync } = require("child_process");

function isDbUnreachableError(error) {
  const output = [
    error?.message,
    error?.stdout?.toString?.(),
    error?.stderr?.toString?.(),
  ]
    .filter(Boolean)
    .join("\n");

  return output.includes("P1001") || output.includes("Can't reach database server");
}

function run(command, options = {}) {
  const { allowDbUnreachable = false } = options;

  try {
    const output = execSync(command, { stdio: "pipe", encoding: "utf8" });
    if (output) process.stdout.write(output);
    return true;
  } catch (error) {
    if (error?.stdout) process.stdout.write(error.stdout.toString());
    if (error?.stderr) process.stderr.write(error.stderr.toString());

    if (allowDbUnreachable && isDbUnreachableError(error)) {
      console.warn(
        `[db:init] Database unreachable during "${command}". Skipping DB push and seed; continuing startup.`,
      );
      return false;
    }

    console.error(`[db:init] Command failed: ${command}`);
    throw error;
  }
}

const databaseReady = run("npx --no-install prisma db push", {
  allowDbUnreachable: true,
});
run("npx --no-install prisma generate");

if (databaseReady) {
  run("npm run db:seed");
} else {
  console.warn("[db:init] Skipped db:seed because database is currently unreachable.");
}
