import io
import os
import re
import requests
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from transformers import pipeline

# Load model once on startup (CPU only)
# BLIP base is a good CPU-friendly choice
CAPTION_PIPE = pipeline(
    task="image-to-text",
    model="Salesforce/blip-image-captioning-base",
    device=-1,  # CPU
)

app = FastAPI()
# Allow CORS for browser access; restrict origins in production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: replace with your frontend domains
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CaptionRequest(BaseModel):
    image_url: str

class CaptionResponse(BaseModel):
    caption: str

IMG_TIMEOUT = float(os.environ.get("IMG_TIMEOUT", "8"))
MAX_SIZE = int(os.environ.get("MAX_IMG_BYTES", str(8 * 1024 * 1024)))  # 8MB

SAFE_SENTENCE = re.compile(r"[^\x20-\x7E]+")

def fetch_image(url: str) -> Image.Image:
    try:
        with requests.get(url, timeout=IMG_TIMEOUT, stream=True) as r:
            r.raise_for_status()
            ctype = r.headers.get("Content-Type", "")
            if "image" not in ctype:
                raise HTTPException(status_code=400, detail="URL is not an image")
            size = 0
            chunks = []
            for chunk in r.iter_content(8192):
                size += len(chunk)
                if size > MAX_SIZE:
                    raise HTTPException(status_code=413, detail="Image too large")
                chunks.append(chunk)
            data = b"".join(chunks)
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=400, detail="Failed to download image")

    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        return img
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")


def clean_caption(text: str) -> str:
    # Keep it descriptive and simple
    s = text.strip()
    s = SAFE_SENTENCE.sub(" ", s)
    # Ensure sentence case and a period
    if s:
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    # Remove emojis or non-printable
    s = re.sub(r"[\u263a-\U0001f645]", "", s)
    return s

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/caption", response_model=CaptionResponse)
async def caption(req: CaptionRequest):
    url = req.image_url.strip()
    if not url.lower().startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid URL")

    img = fetch_image(url)

    try:
        out = CAPTION_PIPE(img)
        # HF returns a list of dicts with 'generated_text'
        raw = ""
        if isinstance(out, list) and out:
            cand = out[0]
            raw = cand.get("generated_text", "") or cand.get("caption", "")
        s = clean_caption(raw or "A photo.")
        return {"caption": s}
    except Exception:
        # Fallback safe message
        return {"caption": "A photo."}

if __name__ == "__main__":
    port = int(os.environ.get("CAPTION_PORT", "8090"))
    uvicorn.run(app, host="127.0.0.1", port=port)
