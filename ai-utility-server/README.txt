AI Utility Server (Node.js, Express)

Endpoints:
- POST /ai/moderate
  Body: { text }
  Returns: { isToxic, score, reasons }

- POST /ai/recommend
  Body: {
    caption?: string,
    newHash?: string,
    existingHashes?: string[],
    engagement?: { views?: number, likes?: number, comments?: number },
    thresholds?: { duplicate?: number, lowEngagement?: { likesPerView?: number, commentsPerView?: number } }
  }
  Returns: { suggestions: string[], warnings: string[], meta: { similarity?: number } }

- POST /ai/dedupe
  Body: { imageHash: string, existingHashes?: string[], threshold?: number }
  Returns: { isDuplicate: boolean, similarity: number }

Run locally:
1) cd ai-utility-server
2) npm install --omit=dev
3) npm start

Deploy on AWS EC2 (Free Tier):
- Launch Amazon Linux 2023 or Ubuntu 22.04 t2.micro
- Install Node.js 18+
- Copy this folder to the instance
- Configure Security Group to allow inbound TCP on PORT (default 8080)
- Run: npm ci --omit=dev && npm start
- Use a process manager or systemd if desired
