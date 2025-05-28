# MirrorLake

A modern, AI-powered color engineering suite for developers, designers, and creators. MirrorLake brings together advanced color tools, intelligent agents, and seamless VSCode integration.

![Screen Shot](public/screenshot.png)

## Overview

MirrorLake is a **turborepo** containing:

- **MirrorLake Color Agent**: An AI-augmented color picker and theme agent web app ([apps/agent](./apps/agent)), offering color analysis, advice, and theme management with LLM and Python-powered reasoning.
- **MirrorLake Color Highlighter**: A powerful VSCode extension ([apps/mirrorlake-color-highlighter](./apps/mirrorlake-color-highlighter)) for intelligent color highlighting, conversion, and instant color info in your code.

## Features

### Color Agent (Web App)

- Interactive color picker with AI-powered color advice
- Theme creation and management
- Deep color analysis (client, server, and Python-powered)
- Reasoning Engine integration (DeepSeek, AI SDK, or your own provider)
- Multi-layered architecture: Next.js (client/server), Python (Edge/Server), and LLM

### VSCode Color Highlighter

- Highlights all major color formats: HEX, RGB(A), HSL(A), CSS4, named colors
- Hover for instant color info, conversions, and color names
- Click to replace color codes in your code
- Visual color swatches and advanced color picker integration
- Highly configurable: file types, languages, experimental features

## Getting Started

### Online Demo

Try the Color Agent at [mirrorlake.ldwid.com](https://mirrorlake.ldwid.com).

### Local Development

#### Prerequisites

- [Node.js](https://nodejs.org/) (v22+ recommended)
- [pnpm](https://pnpm.io/) (see `packageManager` in root)
- [Python 3.12+](https://www.python.org/) (for advanced color analysis)

#### Setup

1. **Clone this repository**
2. **Install dependencies**
   ```sh
   pnpm install
   ```
3. **Set up Python environment**
   ```sh
   python3 -m venv venv
   # On Mac/Linux:
   source venv/bin/activate
   # On Windows:
   venv\Scripts\activate
   ```
4. **Run the development server**
   ```sh
   pnpm dev
   ```
5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

6. **(Optional) Set up DeepSeek API key for AI features**
   Create `.env.local` in the root or `apps/agent`:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key
   ```

#### VSCode Extension

1. Open VSCode in the repo root.
2. Go to `apps/mirrorlake-color-highlighter`.
3. Run `pnpm install` if needed.
4. Press `F5` to launch the extension in a new Extension Development Host window.

## Monorepo Structure

```
mirrorlake/
├── apps/
│   ├── agent/                     # MirrorLake Color Agent (Next.js + Python)
│   └── mirrorlake-color-highlighter/ # VSCode extension
├── packages/
│   └── color-tools/               # Shared color utilities
├── ...
```

---

## Configuration

### Color Agent

- See [apps/agent/readme.md](./apps/agent/readme.md) for full usage, deployment, and architecture details.

### VSCode Extension

- See [apps/mirrorlake-color-highlighter/README.md](./apps/mirrorlake-color-highlighter/README.md) for features, settings, and troubleshooting.

#### Example VSCode Settings

```json
{
  "mirrorlake-color-highlighter.supportedFileGlobs": [
    "*.css",
    "*.scss",
    "*.sass",
    "*.less",
    "*.styl",
    "*.pcss",
    "*.html",
    "*.htm",
    "*.vue",
    "*.jsx",
    "*.tsx",
    "*.js",
    "*.ts"
  ],
  "mirrorlake-color-highlighter.enableNamedColors": false,
  "mirrorlake-color-highlighter.enableRgb4Colors": false
}
```

---

## Architecture

MirrorLake uses a multi-layered approach:

- **Client Side (Next.js)**: Fast, interactive color tools and agent UI
- **Server Side (Next.js & Python)**: Color analysis, theme logic, and heavy computation
- **Reasoning Engine (LLM/DeepSeek)**: AI-powered advice, theme suggestions, and user queries
- **VSCode Extension**: Real-time color highlighting and conversion in your editor

---

## Acknowledgments

- [colord](https://github.com/omgovich/colord) for color analysis
- [color-names](https://github.com/meodai/color-names) for color naming
- [nextjs-fastapi](https://github.com/digitros/nextjs-fastapi) for project structure inspiration
- All open-source dependencies and contributors

---

## License

MIT License and All Rights Reserved.

---

**Enjoy beautiful, intelligent color workflows with MirrorLake!**

[![LikeDreamwalker](public/ldw.svg)](https://likedreamwalker.space)
