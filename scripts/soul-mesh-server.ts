import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

const HOST = process.env.SOUL_MESH_HOST ?? "0.0.0.0";
const PORT = Number(process.env.SOUL_MESH_PORT ?? 3030);
const MAX_BYTES = Number(process.env.SOUL_MESH_MAX_REQUEST_BYTES ?? 2 * 1024 * 1024);

type JsonResponder = {
  status(code: number): JsonResponder;
  json(value: unknown): void;
};

type MeshHandler = (req: {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}, res: JsonResponder) => unknown | Promise<unknown>;

const handlerModule = await import("../api/soul-mesh.ts");
const meshHandler = handlerModule.default as MeshHandler;

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
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > MAX_BYTES) {
        reject(Object.assign(new Error("MESH_PAYLOAD_TOO_LARGE"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => {
      try {
        resolve(chunks.length === 0 ? undefined : JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("INVALID_JSON"), { statusCode: 400 }));
      }
    });

    req.on("error", reject);
  });
}

function toHeaderRecord(headers: IncomingMessage["headers"]) {
  const out: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) out[key] = value;
  return out;
}

async function dispatchToCanonicalHandler(req: IncomingMessage, res: ServerResponse, body: unknown) {
  let statusCode = 200;
  let bodyWritten = false;

  const adapter: JsonResponder = {
    status(code: number) {
      statusCode = code;
      return adapter;
    },
    json(value: unknown) {
      bodyWritten = true;
      writeJson(res, statusCode, value);
    },
  };

  await meshHandler({
    method: req.method,
    headers: toHeaderRecord(req.headers),
    body,
  }, adapter);

  if (!bodyWritten && !res.writableEnded) {
    writeJson(res, statusCode, { error: "MESH_HANDLER_NO_RESPONSE" });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/mesh/health") {
      writeJson(res, 200, {
        status: "ok",
        nucleus: "N03",
        protocol: "soul-mesh/1",
        contractVersion: "1.1.0",
        transport: "http",
      });
      return;
    }

    if (req.method === "GET" && req.url === "/ready") {
      const secretConfigured = Boolean(process.env.SOUL_MESH_HMAC_SECRET?.trim());
      const ready = !["production", "staging"].includes(process.env.NODE_ENV ?? "") || secretConfigured;
      writeJson(res, ready ? 200 : 503, {
        ready,
        nucleus: "N03",
        protocol: "soul-mesh/1",
        contractVersion: "1.1.0",
        checks: { process: true, meshHmacConfigured: secretConfigured },
      });
      return;
    }

    if (req.method === "GET" && req.url === "/mesh/discovery") {
      await dispatchToCanonicalHandler(req, res, undefined);
      return;
    }

    if (req.url === "/mesh/in" || req.url === "/api/soul-mesh") {
      let body: unknown;
      try {
        body = await readJson(req);
      } catch (error) {
        const e = error as Error & { statusCode?: number };
        writeJson(res, e.statusCode ?? 400, { error: e.message });
        return;
      }

      const mappedReq = { ...req, url: "/api/soul-mesh" } as IncomingMessage;
      await dispatchToCanonicalHandler(mappedReq, res, body);
      return;
    }

    writeJson(res, 404, { error: "NOT_FOUND" });
  } catch (error) {
    if (!res.writableEnded) {
      writeJson(res, 500, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({
    event: "soul.mesh.http.listening",
    nucleus: "N03",
    host: HOST,
    port: PORT,
    health: "/mesh/health",
    ready: "/ready",
    discovery: "/mesh/discovery",
    ingress: "/mesh/in",
  }));
});
