---
description: Raise a Pull Request via GitHub CLI
---

## Workflow: Raise Pull Request

1. **Verify current branch**
   ```bash
   git rev-parse --abbrev-ref HEAD
   ```
   Ensure you are on the feature/fix branch you intend to PR.

2. **Sync with remote** (optional but recommended)
   ```bash
   git fetch origin
   git rebase origin/main   # or the appropriate base branch
   ```

3. **Push the branch** (if not already pushed)
   ```bash
   git push -u origin $(git rev-parse --abbrev-ref HEAD)
   ```

4. **Create the PR**
   // turbo
   ```bash
   gh pr create \
     --title "<PR_TITLE>" \
     --body "<PR_DESCRIPTION>" \
     --base <BASE_BRANCH> \
     --head $(git rev-parse --abbrev-ref HEAD)
   ```
   Replace `<PR_TITLE>`, `<PR_DESCRIPTION>`, and `<BASE_BRANCH>` with appropriate values.

5. **Add reviewers or assignees** (optional)
   ```bash
   gh pr edit <PR_NUMBER> --add-reviewer <USERNAME> --add-assignee <USERNAME>
   ```

### Notes
- This workflow assumes the **GitHub CLI (`gh`)** is installed and authenticated.
- The `// turbo` annotation on step 4 indicates that when this workflow is executed, the PR creation command can be auto‑run safely.
- You can copy‑paste the commands into your terminal or integrate them into a script.
