# N03 — Sistema Auditivo e de Fala do Soul

N03 (`nexus-aeternum-fusion`) é o núcleo destinado à percepção auditiva e à fala do Soul. O projeto declara Google Cloud Speech, Google Cloud Text-to-Speech e Hugging Face Transformers como tecnologias disponíveis.

## Soul Mesh

A fundação Mesh foi adicionada de forma aditiva em `src/mesh/`:

- `SoulMeshProtocol.ts` — identidade N03 e protocolo `soul-mesh/1` v1.1.0.
- `SoulMeshHttpTransport.ts` — HTTP com retry, backoff e circuit-breaker.
- `SoulMeshRouter.ts` — despacho de requests e handlers.
- `SoulMeshDiscovery.ts` — persistência local dos peers como fallback inicial.
- `SoulMeshPeerTransport.ts` — validação de origem/destino e canais.
- `N03AudioCapabilityRegistry.ts` — catálogo das capacidades auditivas e de fala.

Peers IN/OUT: `N01`, `N02`, `N04`, `N05`, `N06`.

## Capabilities de áudio e fala

- `audio.transcribe` — contrato de transcrição com Google Cloud Speech / Hugging Face.
- `speech.synthesize` — contrato de síntese com Google Cloud Text-to-Speech.
- `audio.analyze.emotion` — contrato de análise emocional; requer adapter/modelo específico.
- `speech.translate` — pipeline transcrição → tradução → fala; requer adapter.
- `audio.summarize` — contrato de resumo de áudio; requer runtime de IA.
- `audio.listen.continuous` — contrato de escuta contínua; requer runtime de áudio do dispositivo.
- `audio.denoise` — contrato de redução de ruído; requer DSP/runtime.
- `speaker.identify` — contrato de identificação de locutor; requer runtime/modelo.

As capacidades marcadas como requerendo adapter **não são declaradas como implementadas**. A infraestrutura está preparada sem mascarar funções que ainda não possuem integração real.

## Provedores

As dependências Google Cloud Speech, Google Cloud Text-to-Speech e Hugging Face Transformers já estão declaradas no projeto. Configure credenciais apenas no ambiente de execução e nunca publique chaves no repositório.

## Integração Mesh

A implementação legada `api/soul-mesh.ts` permanece intacta. A nova camada em `src/mesh/` é aditiva. O endpoint legado ainda possui handlers específicos de diagnóstico; a nova fundação não declara comunicação E2E concluída até que N01 e N03 possam ser executados simultaneamente.

## Desenvolvimento

```sh
npm i
npm run dev
npm run build
```

Consulte `MESH_STATUS.md` para o estado detalhado da integração.