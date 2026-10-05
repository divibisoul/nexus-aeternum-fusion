import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import process from "node:process";
import { createSoulMeshMessage, isSoulMeshMessage, type SoulMeshMessage } from "../lib/soul-mesh/SoulMeshProtocol";
import { signSoulMeshLegacyResponse, verifySoulMeshHmac } from "../src/mesh/SoulMeshHmac";
import { createN03MeshRouter, declaredN03Capabilities } from "../src/mesh/N03MeshRuntime";

const HOST = process.env.SOUL_MESH_HOST ?? "0.0.0.0";
const PORT = Number(process.env.SOUL_MESH_PORT ?? 3030);
const MAX_BYTES = Number(process.env.SOUL_MESH_MAX_REQUEST_BYTES ?? 2 * 1024 * 1024);
const NUCLEUS = "N03" as const;
const CANONICAL_INGRESS = "/api/soul-mesh";
const LEGACY_INGRESS = "/mesh/in";
const MAX_CLOCK_SKEW_MS = 30_000;
const REPLAY_WINDOW_MS = 5 * 60_000;
const seenRequests = new Map<string, number>();
const router = createN03MeshRouter();

function writeJson(res: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("content-length", Buffer.byteLength(body));
  res.end(body);
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer | string) => {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += b.length;
      if (total > MAX_BYTES) {
        reject(Object.assign(new Error("MESH_PAYLOAD_TOO_LARGE"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(b);
    });
    req.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(Object.assign(new Error("INVALID_JSON"), { statusCode: 400 })); }
    });
    req.on("error", reject);
  });
}

function cleanupReplay(now: number): void {
  for (const [id, seenAt] of seenRequests) {
    if (now - seenAt > REPLAY_WINDOW_MS) seenRequests.delete(id);
  }
}

function acceptOnce(id: string): boolean {
  const now = Date.now();
  cleanupReplay(now);
  if (seenRequests.has(id)) return false;
  seenRequests.set(id, now);
  return true;
}

function meshAuthorized(req: IncomingMessage, message: SoulMeshMessage): boolean {
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  if (secret && verifySoulMeshHmac(message, secret)) return true;

  const token = process.env.SOUL_MESH_TOKEN?.trim();
  const authorization = typeof req.headers.authorization === "string" ? req.headers.authorization.trim() : "";
  if (token && /^Bearer\s+/i.test(authorization)) {
    const provided = authorization.replace(/^Bearer\s+/i, "").trim();
    const expected = Buffer.from(token);
    const actual = Buffer.from(provided);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  return !secret && !token && process.env.NODE_ENV !== "production";
}

function responseMessage(request: SoulMeshMessage, payload: unknown, kind: "response" | "error" = "response") {
  const secret = process.env.SOUL_MESH_HMAC_SECRET?.trim();
  if (secret) return signSoulMeshLegacyResponse(request, payload, kind, secret);
  return createSoulMeshMessage({
    source: request.target,
    target: request.source,
    kind,
    capability: request.capability,
    correlationId: request.correlationId,
    payload,
  });
}

function respond(res: ServerResponse, request: SoulMeshMessage, payload: unknown, status = 200) {
  writeJson(res, status, responseMessage(request, payload, status >= 400 ? "error" : "response"));
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/ready") {
      const production = process.env.NODE_ENV === "production";
      const meshSecretConfigured = Boolean(process.env.SOUL_MESH_HMAC_SECRET?.trim());
      const tokenConfigured = Boolean(process.env.SOUL_MESH_TOKEN?.trim());
      const ready = !production || meshSecretConfigured || tokenConfigured;
      writeJson(res, ready ? 200 : 503, {
        ready,
        nucleus: NUCLEUS,
        protocol: "soul-mesh/1",
        contractVersion: "1.1.0",
        checks: {
          process: true,
          authConfigured: meshSecretConfigured || tokenConfigured,
          canonicalIngress: CANONICAL_INGRESS,
          handlers: router.listAgents().length,
        },
      });
      return;
    }

    if (req.method === "GET" && req.url === "/mesh/health") {
      writeJson(res, 200, {
        status: "ok",
        nucleus: NUCLEUS,
        protocol: "soul-mesh/1",
        contractVersion: "1.1.0",
        transport: "http",
        uptimeSeconds: Math.floor(process.uptime()),
        canonicalIngress: CANONICAL_INGRESS,
        executableCapabilities: [...new Set(router.listAgents().flatMap(agent => agent.capabilities))],
      });
      return;
    }

    if (req.method === "GET" && req.url === "/mesh/discovery") {
      writeJson(res, 200, {
        protocol: "soul-mesh/1",
        contractVersion: "1.1.0",
        nucleus: NUCLEUS,
        status: "AVAILABLE",
        evidenceState: "STRUCTURAL",
        capabilities: declaredN03Capabilities(),
        executableCapabilities: [...new Set(router.listAgents().flatMap(agent => agent.capabilities))],
        transport: {
          protocol: "http",
          endpoint: "http://" + HOST + ":" + PORT + CANONICAL_INGRESS,
          legacyEndpoint: "http://" + HOST + ":" + PORT + LEGACY_INGRESS,
        },
        runtime: "nexus-aeternum-fusion",
      });
      return;
    }

    const isIngress = req.method === "POST" && (req.url === CANONICAL_INGRESS || req.url === LEGACY_INGRESS);
    if (!isIngress) {
      writeJson(res, 404, { code: "NOT_FOUND" });
      return;
    }

    let value: unknown;
    try {
      value = await readJson(req);
    } catch (error) {
      const e = error as Error & { statusCode?: number };
      writeJson(res, e.statusCode ?? 400, { code: e.message });
      return;
    }

    if (!isSoulMeshMessage(value)) {
      writeJson(res, 400, { code: "INVALID_MESH_MESSAGE" });
      return;
    }

    if (value.target !== NUCLEUS) {
      respond(res, value, { code: "INVALID_TARGET", target: value.target }, 400);
      return;
    }

    if (!meshAuthorized(req, value)) {
      respond(res, value, { code: "UNAUTHORIZED" }, 401);
      return;
    }

    if (value.kind !== "request") {
      respond(res, value, { code: "REQUEST_REQUIRED" }, 400);
      return;
    }

    if (!acceptOnce(value.id)) {
      respond(res, value, { code: "REPLAY_DETECTED" }, 409);
      return;
    }

    try {
      const payload = await router.dispatch(value);
      respond(res, value, payload, 200);
    } catch (error) {
      const code = error instanceof Error ? error.message : String(error);
      const status = code.startsWith("CAPABILITY_HANDLER_NOT_REGISTERED") ? 501 : 502;
      respond(res, value, { code, nucleus: NUCLEUS }, status);
    }
  } catch (error) {
    writeJson(res, 500, {
      code: "MESH_INTERNAL_ERROR",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    event: "soul.mesh.http.listening",
    nucleus: NUCLEUS,
    host: HOST,
    port: PORT,
    health: "/mesh/health",
    discovery: "/mesh/discovery",
    ingress: CANONICAL_INGRESS,
    legacyIngress: LEGACY_INGRESS,
    capabilityCount: declaredN03Capabilities().length,
  }));
});

function shutdown(signal: string) {
  console.log(JSON.stringify({ event: "soul.mesh.http.shutdown", signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
