# Soma MVP-1 Smoke Script

This document details the step-by-step manual smoke verification process for the Soma MVP-1 Voice Sandbox RPC flows and session auditing.

## Verification Steps

1. Start API:
   ```bash
   pnpm dev:api
   ```
2. Start web:
   ```bash
   pnpm dev:web
   ```
3. Start LiveKit agent:
   ```bash
   pnpm dev:agent
   ```
4. Open the browser shell (normally at `http://localhost:5173` or specified port) and click **Join session**.
5. Confirm that the LiveKit token is fetched successfully and the client room connects.
6. Change the code in the sandbox editor to:
   ```javascript
   function add(a, b) {
     return a - b; // deliberate bug for testing
   }
   console.log(add(2, 3));
   ```
7. Run the code inside the voice sandbox and verify that the output panel displays `-1`.
8. Tell RAMS (Real-time Agent & Model Supervisor / Voice Agent): **“My add function is correct.”**
9. Verify that RAMS asks to inspect the sandbox code or references the sandbox state before agreeing or correcting you.
10. Verify that a JSON session event audit file has been created in `data/session-events/` for this active session.
