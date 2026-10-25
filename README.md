# N03 — Sistema Auditivo e de Fala do SOUL

N03 (`nexus-aeternum-fusion`) é o núcleo de percepção auditiva, processamento de áudio e fala. Ele preserva seus adaptadores nativos e delega capacidades complementares aos demais núcleos pelo Soul Mesh.

## Soul Mesh — sete núcleos

N03 mantém canais de entrada e saída para os seis peers: **N01, N02, N04, N05, N06 e N07**. A topologia declarada não prova conectividade operacional: cada ligação só é considerada real quando uma chamada autenticada recebe uma resposta correlacionada.

A fundação Mesh está em `src/mesh/`:

- `SoulMeshProtocol.ts` — identidade, protocolo `soul-mesh/1` e contrato v1.1.0.
- `SoulMeshHttpTransport.ts` — transporte HTTP, retry, backoff e circuit-breaker.
- `SoulMeshRouter.ts` — despacho de capacidades locais.
- `SoulMeshDiscovery.ts` — descoberta e persistência de peers.
- `SoulMeshPeerTransport.ts` — validação de origem/destino e canais.
- `N03AudioCapabilityRegistry.ts` — estados declarados das capacidades de áudio.
- `N03MeshRuntime.ts` — handlers reais e registro das capacidades executáveis.

## Capacidades de áudio e fala

O estado abaixo acompanha `N03_AUDIO_CAPABILITIES`; a lista não deve ser usada como substituta de uma transação real.

| Capacidade | Estado | Implementação / limite |
|---|---|---|
| `audio.transcribe` | Implementada | Transcrição de áudio pelo adaptador Gemini |
| `speech.synthesize` | Implementada | Síntese de fala pelo adaptador Gemini |
| `audio.transform` | Implementada | Normalização/conversão PCM16/WAV; artefatos documentais podem ser delegados a N04 |
| `audio.analyze.emotion` | Implementada | Análise de áudio pelo adaptador Gemini |
| `speech.translate` | Implementada | Transcrição seguida de tradução |
| `audio.summarize` | Implementada | Resumo substantivo de áudio |
| `speaker.identify` | Implementada com limite | Diarização/turnos de fala; **não** identifica a identidade civil de uma pessoa |
| `audio.listen.continuous` | Adaptador necessário | Exige stream de áudio do navegador/dispositivo; não é anunciado como executável |
| `audio.denoise` | Adaptador necessário | Exige DSP de redução de ruído; não é simulado por uma chamada de linguagem |
| `audio.transcribe.whisper@1.0.0` | Adaptador necessário | Whisper local requer checkout fixado e pesos de modelo provisionados |
| `speech.synthesize.kokoro@1.0.0` | Adaptador necessário | Kokoro local requer checkout fixado, runtime Python e transação real de síntese |

Uma capacidade só deve ser anunciada como executável quando houver handler registrado e configuração disponível. A confirmação de operação exige uma transação real com resultado válido; presença de dependência, catálogo ou endpoint, isoladamente, não basta.

## Cooperação entre núcleos

- **N02:** execução de capacidades externas de raciocínio/ferramentas com preflight orbital quando solicitado.
- **N04:** execução de ferramentas e análise de artefatos/documentos.
- **N07:** descoberta/federação e coordenação por meio do contrato Mesh comum.
- **SARA:** ciclo regenerativo, auditoria, governança e rastreabilidade quando o serviço federado estiver configurado.

Cada chamada federada deve preservar a correlação, validar a resposta e propagar erros de forma explícita. Uma ligação ausente ou sem configuração permanece bloqueada; não é convertida em sucesso.

## Provedores e segredos

As credenciais de provedores ficam somente no ambiente do servidor, nunca no código ou no Git. Os adaptadores locais Whisper/Kokoro dependem dos artefatos e runtimes indicados acima.

## Estado e desenvolvimento

Consulte `MESH_STATUS.md` e os testes do runtime para o estado atualizado. A topologia e os contratos são evidência estrutural; a conectividade ponta a ponta só pode ser confirmada por testes reais entre processos.

```sh
npm install
npm run typecheck
npm run mesh:listener:check
npm run build
```
