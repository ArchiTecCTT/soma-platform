# Rams Rector Handoff Smoke Testing & Environment Guide

This document guides you through verifying and smoke testing the Ornyx (Rams Rector) handoff integration with the Soma Platform.

## Environment Variables

To enable verified handoff token verification, both Ornyx and the Soma Platform API must share a secret key.

Configure the following variable on the **Soma Platform API** (e.g., in `.env` or deployment environment):

```env
# SHARED HMAC-SHA256 SECRET FOR VERIFYING ORNYX HANDOFFS
RAMS_SHARED_SECRET=soma-rams-shared-secret-key-12345
```

---

## Technical Flow Overview

1. **Token Generation (Ornyx Side):** Ornyx creates an HS256 JWT-like handoff token signed with `RAMS_SHARED_SECRET`.
   - **Header:** `{"alg": "HS256", "typ": "JWT"}`
   - **Claims:**
     - `iss`: `"ornyx-landing-page"`
     - `aud`: `"soma-rams-mentor"`
     - `iat`: Timestamp (seconds)
     - `exp`: Timestamp (seconds, must be >= current time)
     - `jti`: Unique session/JWT identifier
     - `topic`: Learning topic (string)
     - `curriculum`: Instructions or requirements (string)
     - `socraticQuestion`: Initial prompt or question (optional string)
2. **Handoff Redirection:** Ornyx redirects the student to the Soma Platform web client with the token appended:
   `http://localhost:5173/?handoff=<token>`
3. **Soma Web Interception:**
   - Detects `handoff` query parameter.
   - Dispatches a `POST` request to `${API_BASE_URL}/handoff/bootstrap` with `{ handoff: "<token>" }`.
   - On success: stores topic, curriculum, and LiveKit credentials, then removes the query parameter from the URL bar using `window.history.replaceState`.
4. **Agent Context Injection:**
   - The user connects to LiveKit.
   - The LiveKit token embeds the lesson context in participant metadata JSON under `lessonContext`.
   - The Soma Agent joins, reads the participant metadata, extracts the lesson context, formats a `[LESSON CONTEXT]` block, appends it to its system prompt, and starts the session referencing the handed-off topic and socratic question.

---

## Smoke Test Verification Checklist

Follow these steps to smoke test and verify the handoff end-to-end:

### 1. API Verification (Command Line)
Verify signature checking, token validation, and bootstrap payload generation.

- [x] **Generate a Test Handoff Token:**
  You can use the helper script or generate one using JWT tools with `HS256` and secret `soma-rams-shared-secret-key-12345`.
- [x] **Submit a Valid Token:**
  - Send a `POST` to `http://localhost:8787/handoff/bootstrap` with a valid JSON payload containing `{ "handoff": "<your_valid_token>" }`.
  - Expect: `200 OK` with a response payload containing:
    ```json
    {
      "topic": "...",
      "curriculum": "...",
      "socraticQuestion": "...",
      "roomName": "room-...",
      "participantName": "student-...",
      "livekit": { "url": "...", "token": "..." }
    }
    ```
- [x] **Submit an Expired Token:**
  - Send a token where `exp` is in the past.
  - Expect: `401 Unauthorized` with an error message containing `"expired"`.
- [x] **Submit an Invalid Signature:**
  - Send a token signed with an incorrect secret.
  - Expect: `401 Unauthorized` with an error message containing `"signature"`.

### 2. Web Client Verification
Verify URL capturing, token exchange, and dynamic learning mission rendering.

- [x] **Launch Services:**
  - Ensure the API and Web Client are running (`pnpm dev:api` and `pnpm dev:web`).
- [x] **Navigate with Handoff Parameter:**
  - Open a browser to:
    `http://localhost:5173/?handoff=<YOUR_VALID_TOKEN>`
- [x] **Verify URL Clean-up:**
  - Check that the URL query parameter `?handoff=...` disappears automatically within milliseconds of loading.
- [x] **Verify Dynamic UI Render:**
  - Check the **LEARNING MISSION** card in the left sidebar.
  - Expect: It should dynamically render the **Topic**, **Curriculum**, and **Socratic Question** received from the handoff instead of showing the default hardcoded markdown list.

### 3. Agent Integration Verification
Verify metadata parsing, prompt injection, and first reply topic alignment.

- [x] **Start the Agent Worker:**
  - Run `pnpm dev:agent`.
- [x] **Connect to Voice Session:**
  - On the web client, click **Join Voice Session**.
- [x] **Listen for the Initial Greeting:**
  - Expect: The agent should welcome you, state its purpose, and **naturally mention the handed-off topic and ask you to address the socratic question**.
