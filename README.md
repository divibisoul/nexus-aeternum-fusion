# N03 — Sistema Auditivo e de Fala do Soul

N03 (`nexus-aeternum-fusion`) é o núcleo destinado à percepção auditiva e à fala do Soul. O projeto integra adaptadores para serviços de IA de áudio e mantém a camada de interoperabilidade no Soul Mesh.

## Soul Mesh — topologia K6

N03 é um nó da rede circular de 6 núcleos. Ele possui cinco conexões bidirecionais com os peers **N01, N02, N04, N05 e N06**. Cada peer possui um canal IN e um canal OUT em relação ao N03.

A fundação Mesh está em `src/mesh/`:

- `SoulMeshProtocol.ts` — identidade N03 e protocolo `soul-mesh/1` v1.1.0.
- `SoulMeshHttpTransport.ts` — transporte HTTP.
- `SoulMeshDiscovery.ts` — descoberta/persistência local de peers.
- `SoulMeshPeerTransport.ts` — transporte entre peers.
- `N03AudioCapabilityRegistry.ts` — catálogo das capacidades auditivas e de fala.

## Capabilities auditivas e de fala

- `audio.transcribe` — implementada por `GeminiAudioAdapter`.
- `speech.synthesize` — implementada por `GeminiAudioAdapter`.
- `audio.analyze.emotion` — implementada por `GeminiAudioAdapter` e exposta no manifesto N03.
- `speech.translate` — adapter/pipeline ainda necessário.
- `audio.summarize` — adapter/runtime ainda necessário.
- `audio.listen.continuous` — runtime de captura contínua ainda necessário.
- `audio.denoise` — runtime/DSP ainda necessário.
- `speaker.identify` — modelo/runtime ainda necessário.

**Uma capacidade só deve ser marcada como `AVAILABLE` quando existe um caminho de execução real; as capacidades acima permanecem distinguidas entre implementadas e adapter-required.**

## Provedores

A integração de credenciais ocorre somente no runtime/servidor, por variáveis de ambiente. Chaves e credenciais não devem ser armazenadas no código ou no Git.

## Estado

Consulte os manifestos e testes em `src/mesh/`. A topologia e os contratos estão preparados; comunicação E2E entre todos os núcleos só pode ser confirmada quando os peers estiverem simultaneamente executando e acessíveis.

## Desenvolvimento

```sh
npm i
npm run dev
npm run build
```
