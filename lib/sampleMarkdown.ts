export const SAMPLE_MARKDOWN = `# Welcome to Markdown Viewer ✦

A **beautiful**, minimal viewer for your Markdown files — with full LaTeX math support, syntax highlighting, and elegant typography.

> Drop a \`.md\` file anywhere on the page, or click **Upload File** in the navigation bar to get started.

---

## Features at a Glance

| Feature | Status |
|---|---|
| GitHub Flavored Markdown | ✅ Supported |
| Inline & Block LaTeX | ✅ Supported |
| Syntax Highlighting | ✅ Supported |
| Drag & Drop Upload | ✅ Supported |
| Split View Mode | ✅ Supported |

---

## Mathematics

This viewer renders LaTeX equations beautifully. Use single dollar signs for inline math and double dollar signs for display math.

**Inline math:** Einstein's famous equation $E = mc^2$ sits right in your sentence, and so does the quadratic formula $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.

**Block equations** are centered and given room to breathe:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}, \\quad
\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
$$

The Fourier transform of a function $f(x)$ is defined as:

$$
\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\, e^{-2\\pi i x \\xi}\\, dx
$$

---

## Code Blocks

Inline code uses a warm rose tint: \`const viewer = new MarkdownViewer()\`.

\`\`\`typescript
// A simple recursive function
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(\`fib(10) = \${result}\`); // 55
\`\`\`

\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-np.pi, np.pi, 300)
y = np.sin(x) * np.exp(-0.3 * x**2)
plt.plot(x, y, color='forestgreen', linewidth=2)
plt.title('Damped Sine Wave')
\`\`\`

---

## Blockquotes

> **"Mathematics is the language with which God has written the universe."**
> — Galileo Galilei

---

## Lists

### Unordered

- Clean, minimal light-mode aesthetic
- Emerald green accents for headers and links
- Soft rose tint for inline code
- Full drag-and-drop file support

### Ordered

1. Open or drop a Markdown file
2. Toggle between **Preview** and **Split View**
3. Enjoy beautifully typeset content

---

## Emphasis & Inline Styles

You can use **bold text**, *italic text*, ~~strikethrough~~, and mix them: ***bold italic***.

Inline code: \`npm install react-markdown\` renders with a warm highlight.

---

## Links

Learn more about [Markdown syntax](https://www.markdownguide.org) or explore the [KaTeX documentation](https://katex.org) for supported math commands.

---

*Upload your own file to replace this sample. Enjoy!*
`;
