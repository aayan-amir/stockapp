const { execSync } = require("child_process");

function run(command) {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`[db:init] Command failed: ${command}`);
    throw error;
  }
}

run("npx --no-install prisma db push");
run("npx --no-install prisma generate");
run("npm run db:seed");
