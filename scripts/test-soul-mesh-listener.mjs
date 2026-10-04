import { spawn } from "node:child_process";

const port = Number(process.env.SOUL_MESH_PORT ?? 3030);
const base = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["--experimental-strip-types", "scripts/soul-mesh-server.ts"], {
  env: { ...process.env, SOUL_MESH_HOST: "127.0.0.1", SOUL_MESH_PORT: String(port), NODE_ENV: "test" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", b => { output += String(b); });
child.stderr.on("data", b => { output += String(b); });

const stop = () => {
  if (!child.killed) child.kill("SIGTERM");
};

try {
  let lastError = "";
  for (let i = 0; i < 60; i += 1) {
    try {
      const health = await fetch(base + "/mesh/health");
      if (health.ok) {
        const body = await health.json();
        if (body.nucleus !== "N03" || body.protocol !== "soul-mesh/1" || body.contractVersion !== "1.1.0") {
          throw new Error("health contract mismatch");
        }
        const ready = await fetch(base + "/ready");
        if (!ready.ok) throw new Error("readiness http " + ready.status);
        const readiness = await ready.json();
        if (readiness.nucleus !== "N03" || readiness.ready !== true) {
          throw new Error("readiness contract mismatch");
        }
        console.log(JSON.stringify({ state: "REAL", readiness: "PASS", nucleus: readiness.nucleus }));
        const discovery = await fetch(base + "/mesh/discovery");
        if (!discovery.ok) throw new Error("discovery http " + discovery.status);
        const d = await discovery.json();
        if (d.nucleus !== "N03" || d.contractVersion !== "1.1.0" || d.transport?.protocol !== "http") {
          throw new Error("discovery contract mismatch");
        }
        console.log(JSON.stringify({
          state: "REAL",
          commissionedSurface: false,
          nucleus: "N03",
          health: "PASS",
          discovery: "PASS",
          note: "Listener is live; capability execution remains a separate commissioning gate."
        }));
        stop();
        process.exit(0);
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("listener did not become healthy: " + lastError + "\n" + output);
} finally {
  stop();
}
