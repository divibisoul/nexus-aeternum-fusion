# N03 — Sistema Auditivo e de Fala do Soul

N03 (`nexus-aeternum-fusion`) é o núcleo destinado à percepção auditiva e à fala do Soul. O projeto declara Google Cloud Speech, Google Cloud Text-to-Speech e Hugging Face Transformers como tecnologias disponíveis.

## Soul Mesh — topologia K6

N03 é um nó da rede federada de 7 núcleos SOUL. Ele possui seis conexões bidirecionais planejadas, uma com cada peer: **N01, N02, N04, N05, N06 e N07**. Cada peer possui um canal IN e um canal OUT em relação ao N03.

A fundação Mesh está em `src/mesh/`:

- `SoulMeshProtocol.ts` — identidade N03 e protocolo `soul-mesh/1` v1.1.0.
- `SoulMeshHttpTransport.ts` — HTTP com retry, backoff e circuit-breaker.
- `SoulMeshRouter.ts` — despacho de requests.
- `SoulMeshDiscovery.ts` — persistência local de peers como fallback.
- `SoulMeshPeerTransport.ts` — validação de origem/destino e canais.
- `N03AudioCapabilityRegistry.ts` — catálogo das capacidades auditivas e de fala.

## Capabilities auditivas e de fala

- `audio.transcribe` — handler real via adaptador Gemini; credencial continua dependente do runtime.
- `speech.synthesize` — handler real via adaptador Gemini; credencial continua dependente do runtime.
- `audio.analyze.emotion` — handler real via adaptador Gemini; credencial continua dependente do runtime.
- `speech.translate` — pipeline transcrição → tradução → fala, adapter pendente.
- `audio.summarize` — resumo de áudio, runtime de IA pendente.
- `audio.listen.continuous` — escuta contínua, runtime de áudio pendente.
- `audio.denoise` — redução de ruído, DSP/runtime pendente.
- `speaker.identify` — identificação de locutor, modelo/runtime pendente.

**Não declaramos como implementada uma função cujo adapter real ainda não existe.**

## Provedores

As dependências `@google-cloud/speech`, `@google-cloud/text-to-speech` e `@huggingface/transformers` estão presentes no projeto. A integração de credenciais deve ocorrer somente no runtime/servidor, sem chaves no código ou Git.

## Estado

Consulte `MESH_STATUS.md`. A topologia e os contratos estão preparados; comunicação E2E só pode ser confirmada quando os núcleos estiverem executando e acessíveis.

O endpoint legado `api/soul-mesh.ts` permanece preservado. A nova camada é aditiva e não remove código existente.

## Desenvolvimento

```sh
npm i
npm run dev
npm run build
```
