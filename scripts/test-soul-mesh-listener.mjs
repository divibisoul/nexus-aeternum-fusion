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
        const discovery = await fetch(base + "/mesh/discovery");
        if (!discovery.ok) throw new Error("discovery http " + discovery.status);
        const d = await discovery.json();
        if (d.nucleus !== "N03" || d.contractVersion !== "1.1.0" || d.transport?.protocol !== "http") {
          throw new Error("discovery contract mismatch");
        }
        const id = crypto.randomUUID();
        const request = {
          protocol: "soul-mesh/1",
          contractVersion: "1.1.0",
          id,
          correlationId: "smoke-" + id,
          source: "N07",
          target: "N03",
          kind: "request",
          capability: "mesh.ping",
          payload: { smoke: true },
          timestamp: Date.now()
        };
        const execResponse = await fetch(base + "/api/soul-mesh", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(request)
        });
        if (!execResponse.ok) throw new Error("canonical ingress http " + execResponse.status);
        const execBody = await execResponse.json();
        if (execBody.kind !== "response" || execBody.source !== "N03" || execBody.target !== "N07" || execBody.correlationId !== request.correlationId || execBody.payload?.ok !== true) {
          throw new Error("canonical execution contract mismatch");
        }
        console.log(JSON.stringify({
          state: "REAL",
          commissionedSurface: false,
          nucleus: "n03",
          health: "PASS",
          discovery: "PASS",
          execution: "PASS",
          canonicalIngress: "/api/soul-mesh",
          note: "Standalone listener, canonical ingress and mesh.ping execution are live in the test environment."
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
