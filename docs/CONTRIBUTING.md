# Contributing to MemoryMesh

Thank you for your interest in contributing. This document covers how to get set up, where contributions are most needed, and the process for submitting changes.

---

## Where Help Is Needed

These are the areas most open for contribution:

- **Additional AI tool support** — Perplexity, Mistral, or any tool with an injectable chat input
- **Firefox extension port** — the Chrome extension uses Manifest V3; a Firefox version would expand reach significantly
- **Gemini history export** — Gemini has no native export today; a scraper-based solution would be valuable
- **Local SQLite backend** — an alternative to AWS for users who don't want cloud infrastructure
- **Selective context injection** — UI to choose which stored entries to sync rather than injecting all at once
- **Popup and importer UI** — the current UI is functional but minimal

---

## Getting Set Up

Follow [docs/SETUP.md](./SETUP.md) to get the full project running locally. You need a working AWS deployment to test the extension and MCP server end-to-end.

For frontend-only extension changes, you can mock the API by editing `packages/extension/src/utils/api.ts` to return stub data.

---

## Project Structure

The codebase is a TypeScript npm workspaces monorepo with three packages:

- `packages/extension` — Chrome extension (Manifest V3, Webpack 5)
- `packages/mcp-server` — MCP server (stdio) and Lambda handlers (shared build)
- `packages/infrastructure` — AWS CDK stacks (DynamoDB, Lambda, API Gateway)

All code is TypeScript. Contributions should follow the existing patterns and structure in each package.

---

## Submitting Changes

### For small fixes (typos, bug fixes, small improvements)

Open a PR directly. Include a clear description of what changed and why.

### For new features or significant changes

**Open an issue first.** Describe what you want to build and why. This prevents wasted effort if the direction doesn't fit the project, and gives maintainers a chance to flag any concerns before you write code.

### PR checklist

- [ ] TypeScript — no `any` types without justification
- [ ] `npm run build` passes in the affected package(s)
- [ ] Existing behaviour is not broken
- [ ] PR description explains what changed and references any related issues

---

## Commit Style

Use conventional commits where possible:

```
feat: add Firefox extension manifest
fix: correct event delegation on Save Context banner
docs: update SETUP.md with macOS path
refactor: extract DynamoDB client to shared module
```

---

## Code Style

- TypeScript strict mode
- No unused imports or variables
- Async/await preferred over raw Promises
- Keep Lambda handlers thin — business logic belongs in `tools/`
- The extension, MCP server, and Lambda handlers share the same build output from `packages/mcp-server` — be careful not to break the Lambda entry points when modifying MCP server code

---

## Reporting Bugs

Use the [bug report template](../.github/ISSUE_TEMPLATE/bug_report.md). Include:

- What you were doing
- What you expected to happen
- What actually happened
- Any error output from the Lambda logs, browser console, or Claude Desktop

---

## Questions

Open a GitHub Discussion or file an issue tagged `question`.