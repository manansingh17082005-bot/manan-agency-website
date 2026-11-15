import sys
import json
import subprocess
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE = Path(__file__).resolve().parent
PLAN_FILE = BASE / "scene_plan.json"
OUTPUT_DIR = BASE / "output"
OUTPUT_FILE = OUTPUT_DIR / "cine_ai_v3.mp4"

sys.path.insert(0, str(BASE))
from prompt_interpreter import interpret_prompt

app = FastAPI(title="CINE AI V3 Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://manansingh17082005-bot.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

render_lock = threading.Lock()


class PromptRequest(BaseModel):
    prompt: str = Field(min_length=5, max_length=1200)


@app.get("/")
def health():
    return {
        "status": "online",
        "engine": "CINE AI V3",
        "message": "Local video generation API is ready"
    }


@app.post("/api/generate")
def generate_video(request: PromptRequest):
    prompt = request.prompt.strip()
    if len(prompt) < 5:
        raise HTTPException(status_code=400, detail="Please enter a longer scene description.")

    if not render_lock.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="A video is already being generated. Please wait.")

    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        scene_plan = interpret_prompt(prompt)
        PLAN_FILE.write_text(json.dumps(scene_plan, indent=4), encoding="utf-8")

        if OUTPUT_FILE.exists():
            OUTPUT_FILE.unlink()

        result = subprocess.run(
            [sys.executable, str(BASE / "scene_renderer.py")],
            cwd=str(BASE),
            capture_output=True,
            text=True,
            timeout=900,
        )

        if result.returncode != 0:
            detail = (result.stderr or result.stdout or "The renderer failed.")[-4000:]
            raise HTTPException(status_code=500, detail=detail)

        if not OUTPUT_FILE.exists() or OUTPUT_FILE.stat().st_size == 0:
            raise HTTPException(status_code=500, detail="The renderer did not create an MP4 file.")

        return {
            "status": "success",
            "message": "Your video has been generated.",
            "scene_plan": scene_plan,
            "video_url": f"/api/video?v={OUTPUT_FILE.stat().st_mtime_ns}",
            "file_size": OUTPUT_FILE.stat().st_size,
        }

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Video generation exceeded the 15-minute limit.")
    finally:
        render_lock.release()


@app.get("/api/video")
def get_video():
    if not OUTPUT_FILE.exists():
        raise HTTPException(status_code=404, detail="No generated video is available yet.")
    return FileResponse(OUTPUT_FILE, media_type="video/mp4", filename="cine_ai_v3.mp4")
