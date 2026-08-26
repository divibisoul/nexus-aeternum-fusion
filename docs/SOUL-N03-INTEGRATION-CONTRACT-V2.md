# N03 Integration Contract v2

N03 remains the perception, voice, multimodal and context-oriented nucleus. Existing UI, audio and domain capabilities are preserved.

## Canonical identity
N03 peers are N01, N02, N04, N05 and N06.

## Five IN / five OUT
One logical IN and one logical OUT exist for each peer. Logical identity is independent from transport.

## Hybrid transport
N03 may communicate through IN_PROCESS, WEBVIEW_BRIDGE, LOOPBACK_HTTP, HTTP or REALTIME. Browser/mobile boundaries must be bridged by the common Soul transport contract.

## AI dependency boundary
Voice/transcription/emotion features that require an AI provider must resolve through the abstract Soul AI Provider/Web Session. Provider-specific implementations may remain as compatibility adapters, but N03 must not assume a provider is inherently part of the nucleus.

## Synergy
N03 produces perception/context signals for N02 conversation, N04 artifact workflows, N05 orchestration and N06 cognition. It can also consume requests from all peers. Synergy is verified only by real request/response traces.

## Proof rule
No health flag or endpoint declaration may be interpreted as a live connection. A channel becomes CONNECTED only after transport traversal, capability resolution, handler execution and correlated response.
