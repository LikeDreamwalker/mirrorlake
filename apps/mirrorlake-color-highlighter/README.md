# MirrorLake Color Highlighter

A powerful VSCode extension that provides intelligent color highlighting and conversion tools for web developers. Connects with the [MirrorLake Color Agent](https://mirrorlake.ldwid.com/) to provider advanced color advices and color picker tools.
![MirrorLake Color Highlighter Demo](https://raw.githubusercontent.com/LikeDreamwalker/mirrorlake/main/apps/mirrorlake-color-highlighter/demo.png)

## ✨ Features

### 🎨 **Comprehensive Color Format Support**

- **HEX Colors**: `#ff0000`, `#f00`, `#ff0000ff`, `#f00f`
- **RGB/RGBA**: `rgb(255, 0, 0)`, `rgba(255, 0, 0, 0.5)`
- **HSL/HSLA**: `hsl(0, 100%, 50%)`, `hsla(0, 100%, 50%, 0.5)`
- **CSS4 Space-Separated**: `rgb(255 0 0)`, `hsl(0 100% 50% / 0.5)` _(experimental)_
- **Named Colors**: `red`, `blue`, `cornflowerblue` _(experimental)_

### 🔍 **Smart Color Detection**

- Supports **multiple file types**: CSS, SCSS, Sass, Less, Stylus, HTML, Vue, JavaScript, TypeScript, JSX, TSX
- **Configurable file type support**

### 🎯 **Interactive Color Tools**

- **Hover for instant color info** with color name, HEX, RGB, HSL conversions
- **Click to replace colors** directly in your code
- **Visual color swatches** next to each color value
- **Integration with MirrorLake** color tools for advanced color manipulation

### ⚙️ **Highly Configurable**

- **Custom file type support** - add your own file patterns
- **Language-based detection** - works with VSCode's language modes
- **Optional features** - enable/disable experimental color formats
- **Performance optimized** with smart debouncing

## 🚀 Installation

1. Open VSCode
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "MirrorLake Color Highlighter"
4. Click Install

## 📖 Usage

### Basic Usage

1. Open any supported file (CSS, SCSS, HTML, JS, etc.)
2. Colors will be automatically highlighted with visual indicators
3. Hover over any color to see detailed information
4. Click on conversion options in the hover popup to replace colors

### For Unsaved Files

1. Create a new file (`Ctrl+N` / `Cmd+N`)
2. Set the language mode (`Ctrl+Shift+P` → "Change Language Mode")
3. Choose CSS, SCSS, HTML, JavaScript, etc.
4. Start typing colors - they'll be highlighted immediately!

### Commands

- **Toggle Color Highlighting**: `Ctrl+Shift+P` → "MirrorLake: Toggle Color Highlighting"
- **Open Color in MirrorLake**: Click "More on MirrorLake" in hover popup

## ⚙️ Configuration

### File Type Support

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
  "mirrorlake-color-highlighter.supportedLanguages": [
    "css",
    "scss",
    "sass",
    "less",
    "stylus",
    "postcss",
    "html",
    "vue",
    "javascript",
    "typescript",
    "javascriptreact",
    "typescriptreact"
  ]
}
```

### Optional Features

```json
{
  "mirrorlake-color-highlighter.enableNamedColors": false,
  "mirrorlake-color-highlighter.enableRgb4Colors": false
}
```

### Custom File Types

Add support for custom file types:

```json
{
  "mirrorlake-color-highlighter.supportedFileGlobs": [
    "*.css",
    "*.mycss",
    "*.theme"
  ],
  "mirrorlake-color-highlighter.supportedLanguages": [
    "css",
    "scss",
    "mylanguage"
  ]
}
```

## 🎨 Supported File Types

| Language   | Extensions      | Unsaved Files |
| ---------- | --------------- | ------------- |
| CSS        | `.css`          | ✅            |
| SCSS       | `.scss`         | ✅            |
| Sass       | `.sass`         | ✅            |
| Less       | `.less`         | ✅            |
| Stylus     | `.styl`         | ✅            |
| PostCSS    | `.pcss`         | ✅            |
| HTML       | `.html`, `.htm` | ✅            |
| Vue        | `.vue`          | ✅            |
| JavaScript | `.js`           | ✅            |
| TypeScript | `.ts`           | ✅            |
| React JSX  | `.jsx`          | ✅            |
| React TSX  | `.tsx`          | ✅            |

## 🔧 Settings Reference

| Setting              | Type      | Default                    | Description                                       |
| -------------------- | --------- | -------------------------- | ------------------------------------------------- |
| `supportedFileGlobs` | `array`   | `["*.css", "*.scss", ...]` | File patterns where highlighting is enabled       |
| `supportedLanguages` | `array`   | `["css", "scss", ...]`     | Language IDs for unsaved file support             |
| `enableNamedColors`  | `boolean` | `false`                    | Enable named color highlighting (experimental)    |
| `enableRgb4Colors`   | `boolean` | `false`                    | Enable CSS4 space-separated colors (experimental) |

## 🐛 Troubleshooting

### Colors not highlighting?

1. Check if your file type is supported
2. For unsaved files, set the correct language mode
3. Try toggling highlighting: `Ctrl+Shift+P` → "MirrorLake: Toggle Color Highlighting"

### Performance issues?

1. Disable experimental features if not needed
2. Limit file types in configuration
3. The extension uses smart debouncing to optimize performance

### Custom file types not working?

1. Add both file glob patterns AND language IDs
2. Make sure VSCode recognizes your custom language
3. Check the configuration syntax

### Wrong color codes range inserted?

This is a known issue as expected, and I am working on it. Please try move your cursor to reopen the hover popup then insert the color code again.

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/LikeDreamwalker/mirrorlake).

## 📄 License

This extension is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ by [LikeDreamwalker](https://ldwid.com/)
- Powered by [MirrorLake](https://github.com/LikeDreamwalker/mirrorlake)
- **[colord](https://github.com/omgovich/colord)** for color analysis on Next.js runtime. This is the core of Mirrorlake, saving me significant time in building basic color capabilities.
  **[color-names](https://github.com/meodai/color-names)** for generating color names.

---

**Enjoy coding with beautiful colors!** 🌈
