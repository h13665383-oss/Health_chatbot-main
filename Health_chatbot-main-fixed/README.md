# Multilingual Healthcare Assistant API

Express.js + SQLite backend. Ready for Render.com.

## Endpoints

- `POST /api/symptom-check`  
  Request JSON:
  ```json
  {
    "symptoms": "I have fever and cough since last night",
    "language": "en", // optional: en | hi | bn. If omitted, autodetects from text.
    "user": { "age": 34, "pregnant": false, "conditions": ["asthma"] } // optional
  }
  ```
  Response JSON:
  ```json
  {
    "language": "en",
    "level": "HOME | URGENT | EMERGENCY",
    "detected": ["fever","cough"],
    "score": 5,
    "advice": ["...","..."],
    "timestamp": "2025-09-01T00:00:00.000Z"
  }
  ```

- `POST /api/awareness-alert`  
  Request JSON:
  ```json
  { "topic": "Dengue prevention tips", "language": "hi" }
  ```

- `GET /health` → service status

## Deploy on Render

- Build command: `npm install`
- Start command: `npm start`
- Node version: Render default works (Node 22).

## Notes

- No external translation APIs are used (stable on Render).
- Replies are returned in the same language (English/Hindi/Bengali supported), auto-detected from text if not provided.
- The SQLite DB file is `healthcare.db`; tables are created on boot.
