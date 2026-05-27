# Linear ↔ GitHub Integration Guide

## Branch Protection Rules (Manual Setup Required)

Since I can't set branch protection via API, configure this manually:

### In GitHub Repository Settings

1. Go to **Settings → Branches → Add rule**
2. **Branch name pattern**: `main`
3. Enable these options:
   - ✅ Require a pull request before merging
   - ✅ Require linear history
   - ✅ Require branches to be up to date before merging
   - ✅ Require status checks to pass before merging
   - ⬜ **Do NOT require conversations to be resolved** (optional)

### Optional: Require Linked Issues (GitHub Enterprise)

If you have GitHub Enterprise Cloud, enable:
- **Require linked issues** - PR must have a linked issue to merge

### Alternative: GitHub Actions Validation

Add this to your PR template or create a required status check:

```yaml
# .github/workflows/require-linear-issue.yml
name: Require Linear Issue
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  check-linear-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR title for Linear issue
        run: |
          TITLE="${{ github.event.pull_request.title }}"
          BRANCH="${{ github.event.pull_request.head.ref }}"
          
          ISSUE=$(echo "$TITLE $BRANCH" | grep -oE 'ALL-[0-9]+' | head -1)
          
          if [ -z "$ISSUE" ]; then
            echo "::error::No Linear issue found. Include issue ID in PR title or branch name."
            echo "Examples:"
            echo "  - PR title: 'feat: Add voice (ALL-123)'"
            echo "  - Branch: 'feature/ALL-123-add-voice'"
            exit 1
          fi
          
          echo "Found issue: $ISSUE"
```

---

## Make.com Automation Setup

### Scenario 1: When Linear Issue → Created → Create GitHub PR

**Trigger:** Linear - New Issue Created

**Actions:**
1. **GitHub - Create Pull Request**
   - Repository: `ArchiTecCTT/soma-platform`
   - Title: `{{issue.identifier}} - {{issue.title}}`
   - Body: 
     ```
     ## Linear Issue
     {{issue.description}}
     
     ---
     Linked Linear issue: {{issue.identifier}}
     ```
   - Head branch: `feature/{{issue.identifier}}-{{slugify issue.title | truncate: 50}}`
   - Base: `main`

2. **Linear - Add Comment** (to link them back)
   - Issue ID: `{{issue.id}}`
   - Comment: `GitHub PR created: {{pr.html_url}}`

---

### Scenario 2: When GitHub PR → Merged → Complete Linear Issue

**Trigger:** GitHub - Pull Request Merged

**Filter:**
```
{{pr.base.ref}} equals "main"
```

**Actions:**
1. **HTTP Request** (to Linear API)
   - URL: `https://api.linear.app/graphql`
   - Method: `POST`
   - Headers:
     ```
     Content-Type: application application/json
     Authorization: Bearer YOUR_LINEAR_API_KEY
     ```
   - Body:
     ```json
     {
       "query": "query { issueSearch(query: \"{{pr.title}}\", first: 1) { nodes { id identifier state { name type } } } }"
     }
     ```
   - Parse response to get issue UUID

2. **Linear - Transition Issue** (using UUID from step 1)
   - Issue ID: `{{issue_uuid}}`
   - To: `Completed`

---

### Scenario 3: When GitHub PR → Closed (Not Merged) → Cancel Linear Issue

**Trigger:** GitHub - Pull Request Closed

**Filter:**
```
{{pr.merged}} equals false
AND {{pr.base.ref}} equals "main"
```

**Actions:**
1. Same as Scenario 2, but transition to **Canceled**

---

## Make.com Quick Start

1. Go to [make.com](https://www.make.com) and sign up
2. Click **Create new scenario**
3. Search for **Linear** in the app search
4. Connect your Linear account (OAuth)
5. Connect GitHub (OAuth)
6. Build your scenario following the templates above

### Required Credentials

| Service | What You Need |
|---------|--------------|
| Linear | API Key from Linear → Settings → API |
| GitHub | GitHub account connected via OAuth |

---

## Recommended Workflow

```
1. Create Linear issue: "Add voice transcription (ALL-123)"
          ↓
2. Create branch: feature/ALL-123-add-voice
          ↓
3. Open PR: "feat: Add voice (ALL-123)"
          ↓
4. GitHub Action auto-transitions: Issue → Started
          ↓
5. PR merged
          ↓
6. GitHub Action auto-transitions: Issue → Completed
```

---

## Troubleshooting

### Make.com not finding Linear issues
- Ensure you've connected Linear via OAuth, not just API key
- Check that your API key has `issues:write` permissions

### GitHub Action failing
- Verify `LINEAR_API_KEY` secret is set in GitHub repo
- Check the issue identifier format matches your Linear team key

### PR not linking to issue
- Linear Code must be installed on the repository
- Issue ID must be in branch name OR PR title