#!/usr/bin/env python3
import base64
import json
import os
import shutil
import sys
import tempfile

def emit(payload, code=0):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.exit(code)

try:
    request = json.load(sys.stdin)
except Exception as exc:
    emit({"state": "FAIL", "code": "WHISPER_REQUEST_INVALID", "detail": str(exc)}, 2)

root = os.path.abspath(str(request.get("root") or "").strip())
model_path = os.path.abspath(str(request.get("modelPath") or "").strip())
audio_path = os.path.abspath(str(request.get("audioPath") or "").strip())
device = str(request.get("device") or "cpu")
language = request.get("language")
task = request.get("task") or "transcribe"
word_timestamps = bool(request.get("wordTimestamps", False))
initial_prompt = request.get("initialPrompt")

if not root or not os.path.isdir(root):
    emit({"state": "DEGRADED", "code": "WHISPER_SOURCE_NOT_AVAILABLE"}, 0)
if not model_path or not os.path.isfile(model_path):
    emit({"state": "DEGRADED", "code": "WHISPER_MODEL_NOT_AVAILABLE", "modelPath": model_path}, 0)
if not audio_path or not os.path.isfile(audio_path):
    emit({"state": "FAIL", "code": "WHISPER_AUDIO_NOT_AVAILABLE"}, 2)
if shutil.which("ffmpeg") is None:
    emit({"state": "DEGRADED", "code": "WHISPER_FFMPEG_NOT_AVAILABLE"}, 0)

sys.path.insert(0, root)

try:
    import whisper
except Exception as exc:
    emit({"state": "DEGRADED", "code": "WHISPER_PYTHON_IMPORT_FAILED", "detail": str(exc)}, 0)

try:
    model = whisper.load_model(model_path, device=device)
except Exception as exc:
    emit({"state": "FAIL", "code": "WHISPER_MODEL_LOAD_FAILED", "detail": str(exc)}, 2)

try:
    kwargs = {"task": task, "verbose": False, "word_timestamps": word_timestamps}
    if language:
        kwargs["language"] = str(language)
    if initial_prompt:
        kwargs["initial_prompt"] = str(initial_prompt)
    kwargs["fp16"] = device != "cpu"
    result = model.transcribe(audio_path, **kwargs)
except Exception as exc:
    emit({"state": "FAIL", "code": "WHISPER_TRANSCRIBE_FAILED", "detail": str(exc)}, 2)

emit({
    "state": "PASS",
    "text": str(result.get("text", "")).strip(),
    "language": result.get("language"),
    "segments": result.get("segments", []),
    "provider": "openai/whisper",
    "modelPath": model_path,
    "device": device,
})
