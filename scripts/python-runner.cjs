const { existsSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const virtualEnvironmentPython =
  process.platform === "win32"
    ? path.join(
        projectRoot,
        "services",
        "prediction-service",
        ".venv",
        "Scripts",
        "python.exe",
      )
    : path.join(
        projectRoot,
        "services",
        "prediction-service",
        ".venv",
        "bin",
        "python",
      );

const pythonExecutable =
  process.env.PYTHON ||
  (existsSync(virtualEnvironmentPython)
    ? virtualEnvironmentPython
    : process.platform === "win32"
      ? "python"
      : "python3");

const result = spawnSync(pythonExecutable, process.argv.slice(2), {
  cwd: projectRoot,
  stdio: "inherit",
  shell: false,
});

if (result.error) {
  console.error(`Failed to execute Python: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);