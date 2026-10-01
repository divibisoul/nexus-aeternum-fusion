# N03 — agentes e responsabilidades locais

O router N03 cria o agente local diretamente a partir de cada handler registrado: `N03.<capability>.agent`.

| Agente | Responsabilidade | Estado atual |
|---|---|---|
| `N03.audio.transcribe.agent` | Transcrever áudio mantendo idioma de origem e turnos de fala. | EXECUTABLE |
| `N03.speech.synthesize.agent` | Sintetizar fala a partir de texto. | EXECUTABLE |
| `N03.audio.analyze.emotion.agent` | Analisar sinais/emoção em áudio. | EXECUTABLE |
| `N03.speech.translate.agent` | Transcrever e traduzir fala para o idioma-alvo. | EXECUTABLE |
| `N03.audio.summarize.agent` | Produzir resumo substantivo do áudio preservando fatos e referências temporais. | EXECUTABLE |
| `N03.speaker.identify.agent` | Identificar turnos de locutor/diarização; não afirmar identidade pessoal. | EXECUTABLE |
| `N03.audio.listen.continuous.agent` | Escuta contínua dependente de adapter de dispositivo/áudio. | ADAPTER_REQUIRED |
| `N03.audio.denoise.agent` | Redução de ruído dependente de DSP/runtime de áudio. | ADAPTER_REQUIRED |

A autoridade de execução continua sendo `N03AudioCapabilityRegistry.ts` + `SoulMeshRouter.ts`. Não criar outro motor de percepção.
