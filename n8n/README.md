# n8n automation

## Case QA Chatbot (live)

Workflow "MEDAS Case QA Chatbot" runs on n8n cloud:
https://saiyudh.app.n8n.cloud/workflow/VjakDXeVi6671ofn

- Trigger: `POST https://saiyudh.app.n8n.cloud/webhook/case-qa`
- Request body: `{ caseDigest: string, question: string, history: [{ role, content }] }`
- Response: `{ answer: string }` with citations embedded as `[#exhibit]` markers
- Model: MiniMax-M2.7 via an n8n-managed credential (n8n credits), so no API key
  lives in this workflow
- The app never calls this URL from the browser. `api/qa.ts` forwards server-side
  and falls back to a direct MiniMax call if the webhook is slow or down.

The system prompt pins the agent to the digest: answer only from the record, cite
every claim as [#exhibit], admit when something is not in the record, stay under
120 words unless asked for a list.

## Report generator (P1, not built yet)

Planned second workflow: webhook receives the case digest, drafts a structured
treatment report, and returns a formatted document. Build only after the core app
features are polished.
