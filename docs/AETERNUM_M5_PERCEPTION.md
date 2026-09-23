# AETERNUM M5 — Percepção

M5 é uma camada adaptadora sobre o runtime real do N03. A lista de capacidades vem de `N03AudioCapabilityRegistry`.

A camada não implementa transcrição, síntese, emoção ou DSP por conta própria. Quando o handler real não está conectado, o estado é explícito (`handler_not_bound` ou `adapter_required`) e nenhum resultado sintético é produzido.

Integração operacional: o chamador fornece um `PerceptionExecutor` para delegar ao handler já pertencente ao N03.
