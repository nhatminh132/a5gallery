AI Caption Endpoint (/ai/caption)

This adds a real image caption generator using an open-source BLIP model on CPU.

Components:
- Node (Express) route: POST /ai/caption { image_url }
- Python worker: ai-utility-server/python/caption_server.py (FastAPI + transformers)
- Requirements: ai-utility-server/python/requirements.txt

Run locally:
1) In a new terminal:
   cd ai-utility-server/python
   python -m venv .venv && . .venv/bin/activate
   pip install -r requirements.txt
   CAPTION_PORT=8090 python caption_server.py

2) In another terminal (Node server):
   cd ai-utility-server
   npm start

3) Test:
   curl -s -X POST http://localhost:8080/ai/caption -H 'Content-Type: application/json' -d '{"image_url":"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800"}'

Deploy on EC2:
- Install Python3 and venv: sudo apt-get update && sudo apt-get install -y python3-venv
- Start Python worker (systemd recommended) on 127.0.0.1:8090
- Run Node server on 0.0.0.0:8080
- Frontend calls POST /ai/caption as usual.

Systemd (Python caption):
[Unit]
Description=AI Caption Worker (Python, BLIP)
After=network.target

[Service]
WorkingDirectory=/home/ubuntu/ai-utility-server/python
Environment=CAPTION_PORT=8090
ExecStart=/home/ubuntu/ai-utility-server/python/.venv/bin/python caption_server.py
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target

Notes:
- Model loads once at startup and runs on CPU (device=-1)
- Endpoint returns { caption } with a short, factual sentence
- Gracefully handles invalid URLs and large images
