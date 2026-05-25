# Igloo Public-Site Forensic Audit Design

## Goal
Produce a rebuild-ready teardown of https://www.igloo.inc/ using only publicly accessible pages, assets, and off-site public traces.

## Scope
- Entire publicly reachable site
- Off-site public traces for stack/design/content clues
- Publicly shipped frontend code/assets only
- No private, authenticated, or unauthorized access

## Collection Lanes
1. Browser lane
   - Live render inspection
   - Screenshots
   - DOM/accessibility snapshots
   - Network inventory
2. Crawl lane
   - robots/sitemap discovery
   - public page extraction
   - information architecture map
3. Asset lane
   - CSS/JS/font/image/video/script capture
   - shipped code and integration fingerprinting
4. Research lane
   - public stack/design traces via web search
5. Analysis lane
   - design tokens
   - component inventory
   - messaging patterns
   - strategy notes

## Deliverables
Write artifacts to `artifacts/igloo/`:
- `igloo-design-audit.md`
- `igloo-assets.json`
- `igloo-tokens.json`
- `igloo-components.md`
- `igloo-stack-report.md`
- `igloo-strategy-notes.md`
- `raw/` evidence folder

## Success Criteria
- Enough evidence to reconstruct the public design system direction
- Enough asset/code evidence to fingerprint the frontend stack and integrations
- Enough content evidence to explain positioning, structure, and conversion strategy
- Clear separation between verified findings and inference

## Limits
- Publicly visible/shipped materials only
- No claims of access to private source, CMS internals, or hidden APIs unless publicly exposed
