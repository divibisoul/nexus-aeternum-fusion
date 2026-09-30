# FASE 0 — N03 TOOLS / CAPABILITIES

## B1 IDENTIDADE
Primário: percepção, áudio, fala e fusão.
Secundários: análise emocional, contexto multimodal, Mesh e SARA boundary.
Papel octacore: processador perceptivo que amplia N02/N04/N07 quando conectado.

## B2 PROCESSADORES
| Componente | Path | Responsabilidade | Estado |
|---|---|---|---|
| SoulMeshRouter | src/mesh/SoulMeshRouter.ts | dispatch/capability routing | ativo |
| GeminiAudioAdapter | src/mesh/GeminiAudioAdapter.ts | transcrição/análise/síntese | ativo quando Gemini configurado |
| N03AudioCapabilityRegistry | src/mesh/N03AudioCapabilityRegistry.ts | capabilities de áudio | ativo |
| N03PeerRegistration | src/mesh/N03PeerRegistration.ts | registro de peers | ativo quando config |
| API Mesh handler | api/soul-mesh.ts | boundary HTTP | ativo |

## B3 ENDPOINTS
| Método | Path | Estado |
|---|---|---|
| GET | /api/soul-mesh | LIVE quando deploy |
| POST | /api/soul-mesh | LIVE quando deploy/auth; Gemini capabilities podem BLOCKED_ENV |

## B4 FUNÇÕES
| Módulo | Função | Assinatura resumida | Consumidores |
|---|---|---|---|
| GeminiAudioAdapter | transcribeAudio | (data,mimeType) => Promise<string> | Mesh/API |
| GeminiAudioAdapter | analyzeEmotion | (data,mimeType) => Promise<unknown> | Mesh/API |
| GeminiAudioAdapter | synthesizeSpeech | (text,voice) => Promise<unknown> | Mesh/API |
| peer-client | request/sendTo | (target,capability,payload,...) | Mesh |
| router | register/dispatch | capability handler | API |

## B5/B6 EVENTOS
O runtime usa Mesh request/response/event. Lista fechada de eventos internos não foi medida nesta auditoria: PENDING.

## B7 EXTERNOS
Google Cloud Speech/Text-to-Speech, Gemini, HuggingFace Transformers, Google APIs e Supabase aparecem nas dependências/projeto.

## B8 INTER-NÚCLEO
N01/N02/N04/N05/N06 por HTTP Soul Mesh; SARA por HTTP; peer-client usa URLs/tokens configurados.

## B9 ADORMECIDAS
| Ferramenta | Precisa de | Estado |
|---|---|---|
| audio.transcribe | Gemini/credencial | BLOCKED_ENV |
| audio.analyze.emotion | Gemini/credencial | BLOCKED_ENV |
| speech.synthesize | Gemini/credencial | BLOCKED_ENV |
| peer requests | SOUL_MESH_N0x_URL e auth | BLOCKED_ENV |
| SARA.* | SARA_SERVICE_URL/TOKEN | BLOCKED_ENV |

## B10 EXECUTÁVEIS
mesh.ping, mesh.describe e capability.list são executáveis pelo handler; áudio é executável quando provider configurado.

## B11 EXPANSÃO
| Ao conectar com | Ganha | Perde | Neutro |
|---|---|---|---|
| N02 | áudio/percepção → conversa | nenhuma | Mesh |
| N04 | percepção → tools/artifacts | nenhuma | Mesh |
| N05 | percepção → dispatch | nenhuma | identity |
| N06 | percepção → contexto/sessão | nenhuma | local runtime |
| N01 | transporte/Clareira | nenhuma | audio owner |
| N07 | orchestration/compute | nenhuma | perception owner |
| SARA | governance/regeneration boundary | nenhuma | provider |
