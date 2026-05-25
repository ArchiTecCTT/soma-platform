# nobl.io design teardown

## Goal
Run a full forensic audit of nobl.io using only publicly reachable assets and traces. Produce a rebuild-ready design system and component inventory, a tech-stack fingerprint and shipped asset/code audit, and strategy notes based on public positioning.

## Scope
- Entire publicly reachable site
- Public off-site traces about design/stack/mentions
- Publicly shipped frontend code and assets only
- No private access, no auth bypass, no unauthorized scraping

## Recommended approach
Full forensic audit.

### Collection lanes
1. Browser lane
   - Live render capture
   - DOM/accessibility snapshot
   - Screenshot set
   - Network requests
   - Script/style/font asset discovery
2. Crawl lane
   - Public page discovery
   - Public content extraction
   - Internal link map
3. Asset lane
   - CSS/JS/font/image inventory
   - Bundle fingerprinting
   - Source-map/public manifest checks if exposed
4. Research lane
   - Exa/web traces for stack clues, public mentions, mirrors, and design references
5. Analysis lane
   - Sandbox parsing of CSS/JS/assets into tokens, component patterns, and framework fingerprints

## Output artifacts
- `artifacts/nobl-design-audit.md` — full design teardown
- `artifacts/nobl-assets.json` — CSS/JS/font/image asset inventory
- `artifacts/nobl-tokens.json` — extracted colors, spacing, typography, radius, shadows, breakpoints, motion
- `artifacts/nobl-components.md` — component inventory and reconstruction notes
- `artifacts/nobl-stack-report.md` — framework/tooling fingerprint report
- `artifacts/nobl-strategy-notes.md` — public positioning and competitor-style notes

## Key questions
- What stack is nobl.io likely using?
- What design tokens can be extracted from the shipped frontend?
- What reusable components and layout patterns are visible?
- What motion and interaction patterns exist?
- What would be required to reproduce the design direction?
- What does public positioning suggest about strategy?

## Constraints
- Public data only
- Preserve context via context-mode when outputs may be large
- Prefer browser + sandbox analysis over raw dumps

## Start condition
User approved full forensic audit on 2026-05-25.
