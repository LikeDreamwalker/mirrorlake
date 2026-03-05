# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MirrorLake is an AI-powered color engineering suite — a Turborepo monorepo containing:

- **`apps/agent/`** — Color Agent web app (Next.js 16 + Vercel AI SDK) with LLM-driven color analysis
- **`apps/mirrorlake-color-highlighter/`** — VSCode extension for inline color highlighting and conversion
- **`packages/color-tools/`** — Shared color utilities library (`@mirrorlake/color-tools`) used by both apps

## Commands

```bash
# Install dependencies
pnpm install

# Development (runs all workspaces)
pnpm dev

# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm -w run format
```

### Color Agent (`apps/agent/`)

```bash
pnpm --filter @mirrorlake/agent dev      # Next.js dev server
pnpm --filter @mirrorlake/agent build
pnpm --filter @mirrorlake/agent lint
```

### VSCode Extension (`apps/mirrorlake-color-highlighter/`)

```bash
pnpm --filter mirrorlake-color-highlighter compile     # Type-check + lint + webpack production build
pnpm --filter mirrorlake-color-highlighter watch        # Webpack watch mode
pnpm --filter mirrorlake-color-highlighter test         # Run tests (vscode-test)
pnpm --filter mirrorlake-color-highlighter lint
pnpm --filter mirrorlake-color-highlighter vsce:package # Create .vsix
```

**Local testing**: Run `pnpm --filter mirrorlake-color-highlighter test` which compiles tests, builds the extension, then launches a VSCode instance to run the test suite via `@vscode/test-electron`.

**Publishing**: Tag a release with `extension-v*` (e.g., `extension-v1.0.2`) to trigger automated publishing to VS Code Marketplace via GitHub Actions. Requires `VSCE_PAT` secret configured in the repository.

### Color Tools (`packages/color-tools/`)

```bash
pnpm --filter @mirrorlake/color-tools build  # tsup (CJS + ESM + .d.ts)
pnpm --filter @mirrorlake/color-tools dev    # Watch mode
```

## Architecture

### Agent App (Two-Tier)

1. **Next.js Frontend** (`apps/agent/src/`) — React 19 UI with Zustand state management, Tailwind CSS, and Radix UI components. Entry point: `src/app/page.tsx`. Path alias `@/*` maps to `src/*`.

2. **Next.js Server** — Server actions in `src/app/actions/` for LLM integration (DeepSeek via Vercel AI SDK v4). API routes in `src/app/api/` for chat, color cards, and OG images. Palette generation uses `generateBalancedPalette()` from `@mirrorlake/color-tools`.

### VSCode Extension

Entry point: `src/extension.ts`. Manager-based architecture:

- `ColorDecorationManager` — renders inline color decorations
- `ConfigurationManager` — handles VSCode settings
- `WebViewManager` — color picker webviews
- `CommandManager` — registers commands
- `ColorHoverProvider` — hover tooltips with color info
- `colorDetector.ts` — detects HEX, RGB, HSL, CSS4, and named color formats

Bundled with webpack; output to `dist/extension.js`.

### Shared Color Tools

`packages/color-tools/src/color-tools.ts` contains all core color functions: conversions (hex/rgb/hsl), harmony calculations (complementary, analogous, triadic), balanced palette generation (golden ratio), accessibility checks (contrast ratio, color blindness simulation), tints/shades, and theme palette generation. Built on the `colord` library.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): Runs on push/PR to main — installs deps, builds, lints, runs extension tests, builds VSIX
- **Publish** (`.github/workflows/publish-extension.yml`): Triggered by `extension-v*` release tags — publishes extension to VS Code Marketplace

## Environment

- **`DEEPSEEK_API_KEY`** — Required in `.env.local` for AI chat features (declared in `turbo.json` globalEnv)
- **`VSCE_PAT`** — GitHub secret for automated VS Code Marketplace publishing
- Package manager: pnpm 10.5.2
- The `@mirrorlake/color-tools` workspace dependency must be built before the apps that consume it (`turbo.json` handles this via `dependsOn: ["^build"]`)
