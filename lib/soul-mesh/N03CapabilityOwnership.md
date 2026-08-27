# N03 Capability Ownership

N03 is the canonical owner of the `perception.*` capability family. Existing perception and multimodal implementations remain authoritative; Soul Mesh adapters must call them rather than duplicate them.

Required executable mappings are `perception.analyzeImage`, `perception.processAudio`, and `perception.analyzeMultimodal` when the corresponding internal implementation exists.

Declared capabilities and executable handlers must remain separate so discovery never implies execution support.
