#!/usr/bin/env python3
import asyncio, base64, json, os, sys

UPSTREAM_COMMIT = "72f3f6fa0b2fc38b8517f408ab616f0f2bd229e6"

def emit(value, code=0):
    print(json.dumps(value, ensure_ascii=False))
    raise SystemExit(code)

try:
    req = json.load(sys.stdin)
except Exception as exc:
    emit({"state":"FAIL","code":"AGENTSCOPE_REQUEST_INVALID","detail":str(exc)},2)

text = str(req.get("text") or "").strip()
if not text:
    emit({"state":"FAIL","code":"AGENTSCOPE_TEXT_REQUIRED"},2)

if not os.environ.get("GEMINI_API_KEY"):
    emit({"state":"DEGRADED","code":"AGENTSCOPE_GEMINI_CREDENTIALS_NOT_CONFIGURED"},0)

root = os.path.abspath(str(req.get("root") or os.environ.get("SOUL_N03_AGENTSCOPE_ROOT") or "integrations/soul-upstream/agentscope"))
if not os.path.isdir(root):
    emit({"state":"DEGRADED","code":"AGENTSCOPE_SOURCE_NOT_AVAILABLE","root":root},0)

sys.path.insert(0, root)

try:
    from agentscope import Agent
    from agentscope.credential import GeminiCredential
    from agentscope.message import Base64Source, DataBlock, Msg, TextBlock
    from agentscope.model import GeminiChatModel
except Exception as exc:
    emit({"state":"DEGRADED","code":"AGENTSCOPE_IMPORT_FAILED","detail":str(exc)},0)

async def main():
    model = GeminiChatModel(
        credential=GeminiCredential(api_key=os.environ["GEMINI_API_KEY"]),
        model=os.environ.get("SOUL_N03_AGENTSCOPE_MODEL","gemini-2.5-flash"),
        stream=False,
    )
    agent = Agent(
        name="N03-AgentScope-Perception",
        system_prompt=(
            "You are the N03 perception and multimodal analysis agent. "
            "Analyze supplied text/audio/image content only. Return factual "
            "perceptual findings and uncertainty; do not invent missing sensory data."
        ),
        model=model,
    )
    content=[TextBlock(text=text)]
    audio_b64=req.get("audioBase64")
    mime=req.get("audioMimeType")
    if audio_b64 and mime:
        try:
            base64.b64decode(audio_b64, validate=True)
        except Exception:
            emit({"state":"FAIL","code":"AGENTSCOPE_AUDIO_BASE64_INVALID"},2)
        content.append(DataBlock(source=Base64Source(data=audio_b64, media_type=mime)))
    reply = await agent.reply(Msg(name="user", content=content, role="user"))
    return {
        "state":"PASS",
        "provider":"agentscope-ai/agentscope",
        "upstreamCommit":UPSTREAM_COMMIT,
        "agent":"N03-AgentScope-Perception",
        "text":reply.get_text_content(),
    }

try:
    emit(asyncio.run(main()))
except Exception as exc:
    emit({"state":"FAIL","code":"AGENTSCOPE_EXECUTION_FAILED","detail":str(exc)},2)
