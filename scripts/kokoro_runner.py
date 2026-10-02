#!/usr/bin/env python3
import base64
import json
import os
import struct
import sys
import wave

def emit(payload, code=0):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.exit(code)

try:
    request = json.load(sys.stdin)
except Exception as exc:
    emit({"state": "FAIL", "code": "KOKORO_REQUEST_INVALID", "detail": str(exc)}, 2)

root = os.path.abspath(str(request.get("root") or "").strip())
text = str(request.get("text") or "").strip()
lang_code = str(request.get("langCode") or "p").strip()
voice = str(request.get("voice") or "").strip()
speed = request.get("speed", 1)
device = str(request.get("device") or "cpu").strip()

if not root or not os.path.isdir(root):
    emit({"state": "DEGRADED", "code": "KOKORO_SOURCE_NOT_AVAILABLE"}, 0)
if not text:
    emit({"state": "FAIL", "code": "KOKORO_TEXT_EMPTY"}, 2)
if not voice:
    emit({"state": "FAIL", "code": "KOKORO_VOICE_REQUIRED"}, 2)

sys.path.insert(0, root)

try:
    from kokoro import KPipeline
except Exception as exc:
    emit({"state": "DEGRADED", "code": "KOKORO_PYTHON_IMPORT_FAILED", "detail": str(exc)}, 0)

try:
    pipeline = KPipeline(lang_code=lang_code, device=device)
    chunks = []
    for result in pipeline(text, voice=voice, speed=float(speed), split_pattern=r"\n+"):
        audio = result.audio
        if audio is not None:
            chunks.append(audio.detach().cpu().numpy())
except Exception as exc:
    emit({"state": "FAIL", "code": "KOKORO_SYNTHESIS_FAILED", "detail": str(exc)}, 2)

if not chunks:
    emit({"state": "FAIL", "code": "KOKORO_NO_AUDIO", "sampleRate": 24000}, 2)

try:
    import numpy as np
    audio = np.concatenate(chunks)
    audio = np.clip(audio, -1.0, 1.0)
    pcm = (audio * 32767.0).astype(np.int16).tobytes()
    import io
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(24000)
        wav.writeframes(pcm)
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
except Exception as exc:
    emit({"state": "FAIL", "code": "KOKORO_AUDIO_SERIALIZATION_FAILED", "detail": str(exc)}, 2)

emit({
    "state": "PASS",
    "provider": "hexgrad/kokoro",
    "textLength": len(text),
    "sampleRate": 24000,
    "audioBase64": encoded,
    "device": device,
})
