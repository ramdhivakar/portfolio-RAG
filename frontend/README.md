# Ramdhivakar AI Portfolio — Frontend

This is the updated frontend based on the original `ramdhivakar-ai-portfolio-starter` design. It preserves the dark, minimal three-column layout and connects the portfolio UI to the FastAPI knowledge base and Groq-powered chat API.

## Stack

- Next.js App Router + TypeScript
- React
- Custom black / white / charcoal CSS
- Lucide React icons
- Next.js API proxy routes (no Groq key in the browser)

## Requirements

- Node.js 20.9 or newer
- pnpm
- Your FastAPI backend running locally at `http://127.0.0.1:8000`

## Run

1. Copy `.env.local.example` to `.env.local` (the default URL works for local development).
2. From this folder, run:

```bash
pnpm install
pnpm dev
```

3. Open `http://localhost:3000`.

## Backend connection

- `POST /api/chat` proxies messages to `POST http://127.0.0.1:8000/api/v1/chat`.
- `GET /api/profile` proxies portfolio data from `GET http://127.0.0.1:8000/api/v1/profile`.
- The page derives profile, career, skills, projects, education, certifications, social links, and contact details from the returned knowledge JSON. The UI no longer uses the old hardcoded profile arrays or demo AI answers.
- The FastAPI chat endpoint is already part of the backend setup. The public profile endpoint must be added once. Follow `../backend-integration/README.md` in the ZIP package.

## Troubleshooting

- If chat says it cannot reach the backend, make sure the FastAPI process is running and `/health` opens at `http://127.0.0.1:8000/health`.
- If the profile area shows that `/api/v1/profile` is missing, follow the backend integration instructions included beside the `frontend` folder in the ZIP.
- To use a different backend address, set `BACKEND_API_URL` in `.env.local`, then restart `pnpm dev`.

## Security

Never add the Groq API key to frontend code or a `NEXT_PUBLIC_` variable. Keep it only in the backend `.env` file. The profile endpoint returns the contents of the backend knowledge JSON, so keep that knowledge base limited to approved public information.
