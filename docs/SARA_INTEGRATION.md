# N03 ↔ SARA

N03 expõe as operações regenerativas do SARA através do endpoint Mesh existente.

Capacidades: `sara.health`, `sara.cycle`, `sara.audit`, `sara.regenerate`, `sara.state`, `sara.capabilities`, `sara.trace`.

Configuração server-side: `SARA_SERVICE_URL`, `SARA_SERVICE_TOKEN`, `SARA_REQUEST_TIMEOUT_MS`.

`/health` é público; as operações `/v1/*` usam Bearer. A correlação da requisição é propagada e falhas permanecem explícitas.

Áudio, fala e percepção continuam pertencendo ao N03. SARA é uma camada regenerativa aditiva e não substitui o router/provedor de áudio do N03.
