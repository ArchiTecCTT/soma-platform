# RAMS 10-Minute Smoke Checklist

Goal: verify RAMS can hear the user, inspect the live sandbox, compare claims against code/runtime, and challenge false or over-broad statements.

## Prereqs

Run the stack:

```bash
pnpm dev
```

Open the web app, allow microphone access, and confirm the room/session is visible in the UI.

---

## Test 1 — False correctness claim

### Code
```js
export function add(a, b) {
  return a - b;
}
console.log(add(2, 3));
```

### Steps
1. Paste code into `/src/index.js`
2. Click **Run Code**
3. Confirm terminal output is `-1`
4. Join voice session
5. Say: **"My add function is correct."**

### Expected
- RAMS inspects sandbox state
- RAMS notices subtraction instead of addition
- RAMS cites the `-1` output and challenges the claim

---

## Test 2 — False output claim

### Code
```js
export function add(a, b) {
  return a + b;
}
console.log(add(2, 3));
```

### Steps
1. Paste code
2. Click **Run Code**
3. Confirm terminal output is `5`
4. Say: **"The program prints negative one."**

### Expected
- RAMS says runtime output is `5`, not `-1`

---

## Test 3 — Semantic mismatch

### Code
```js
export function multiply(a, b) {
  return a + b;
}
console.log(multiply(2, 3));
```

### Steps
1. Paste code
2. Click **Run Code**
3. Say: **"My multiply function works."**

### Expected
- RAMS notices the function name and implementation do not match
- RAMS points out it adds instead of multiplies

---

## Test 4 — Syntax failure

### Code
```js
export function add(a, b) {
  return a + ;
}
console.log(add(2, 3));
```

### Steps
1. Paste code
2. Click **Run Code**
3. Say: **"The code runs fine."**

### Expected
- RAMS cites failed execution / stderr
- RAMS rejects the claim

---

## Test 5 — Overclaim from one example

### Code
```js
export function divide(a, b) {
  return a / b;
}
console.log(divide(6, 2));
```

### Steps
1. Paste code
2. Click **Run Code**
3. Say: **"This divide function is safe for all cases."**

### Expected
- RAMS says only one example was shown
- RAMS pushes back on the over-broad claim

---

## Pass Criteria

RAMS is good enough for MVP-1 if it consistently does all of the following:

- hears the user
- inspects live sandbox state
- references actual code and runtime output
- rejects clearly false claims
- pushes back on over-broad claims
- stays grounded in observed evidence

---

## Cost Control

Keep tests cheap:

- use one short claim per scenario
- click **Run Code** before speaking
- disconnect after each short smoke session
- avoid open-ended conversation during validation
