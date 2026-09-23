import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const targets = ["src/components", "src/pages"];
const forbidden = [
  ["AIza", "chave de API Google literal no cliente"],
  ["INTEGRATED_API_KEY", "credencial Gemini embutida"],
  ["localStorage.setItem('aeternum_api_key'", "credencial de API no storage do navegador"],
  ["process.env.GEMINI_API_KEY", "segredo de servidor referenciado no bundle cliente"],
  ["process.env.GOOGLE_API_KEY", "segredo de servidor referenciado no bundle cliente"],
];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const failures = [];
for (const target of targets) {
  for (const file of await walk(resolve(root, target))) {
    const source = await readFile(file, "utf8");
    for (const [needle, reason] of forbidden) {
      if (source.includes(needle)) failures.push({ file: file.replace(root + "/", ""), needle, reason });
    }
  }
}

if (failures.length) {
  console.error("N03_CLIENT_CREDENTIAL_BOUNDARY_FAILED");
  for (const failure of failures) console.error("- " + failure.file + ": " + failure.reason + " [" + failure.needle + "]");
  process.exitCode = 1;
} else {
  console.log("N03_CLIENT_CREDENTIAL_BOUNDARY_OK");
}
