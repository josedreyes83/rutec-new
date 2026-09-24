// build-pdf.mjs — Convierte DOCUMENTACION_TECNICA_PDF.md → PDF con Mermaid renderizado
import { readFile, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const MD_PATH = 'DOCUMENTACION_TECNICA_PDF.md';
const OUT_PDF = 'DOCUMENTACION_TECNICA.pdf';
const TITLE = 'Sistema RUTEC';
const SUBTITLE = 'Documentación Técnica · Arquitectura, Backend, Frontend e Interacción';
const META = 'Ministerio del Trabajo · República de Colombia<br>Proyecto <code>rutec-new</code> — Mayo 2026';

const md = await readFile(MD_PATH, 'utf8');

marked.setOptions({ gfm: true, breaks: false });
const renderer = new marked.Renderer();
const origCode = renderer.code.bind(renderer);
renderer.code = (code, lang) => {
  if (typeof code === 'object' && code !== null) {
    const text = code.text ?? '';
    const language = code.lang ?? '';
    if (language === 'mermaid') return `<div class="mermaid">${text}</div>`;
    return origCode(code);
  }
  if (lang === 'mermaid') return `<div class="mermaid">${code}</div>`;
  return origCode(code, lang);
};

const html = marked.parse(md, { renderer });

const fullHtml = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${TITLE} — Documentación Técnica</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.55; font-size: 11pt; }
  h1 { color: #1a237e; border-bottom: 3px solid #1a237e; padding-bottom: 6px; page-break-before: always; }
  h1:first-of-type { page-break-before: avoid; }
  h2 { color: #283593; border-bottom: 1px solid #c5cae9; padding-bottom: 4px; margin-top: 1.6em; }
  h3 { color: #3949ab; margin-top: 1.3em; }
  h4 { color: #5c6bc0; }
  p, li { text-align: justify; }
  code { background: #f5f5f5; padding: 1px 5px; border-radius: 3px; font-family: 'Cascadia Code', 'Consolas', monospace; font-size: 0.9em; color: #c2185b; }
  pre { background: #263238; color: #eceff1; padding: 12px 14px; border-radius: 6px; overflow-x: auto; font-size: 9pt; line-height: 1.4; page-break-inside: avoid; }
  pre code { background: transparent; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; page-break-inside: avoid; font-size: 10pt; }
  th { background: #1a237e; color: #fff; text-align: left; padding: 8px 10px; }
  td { border: 1px solid #e0e0e0; padding: 7px 10px; vertical-align: top; }
  tr:nth-child(even) td { background: #fafafa; }
  blockquote { border-left: 4px solid #1a237e; background: #e8eaf6; margin: 12px 0; padding: 8px 14px; color: #283593; }
  hr { border: 0; border-top: 1px dashed #c5cae9; margin: 24px 0; }
  .mermaid { text-align: center; margin: 18px 0; page-break-inside: avoid; background: #fff; padding: 8px; }
  .cover { text-align: center; padding: 80px 20px 60px; border-bottom: 4px double #1a237e; margin-bottom: 30px; }
  .cover h1 { font-size: 28pt; color: #1a237e; border: 0; margin: 0 0 10px; page-break-before: avoid; }
  .cover .subtitle { font-size: 14pt; color: #555; }
  .cover .meta { margin-top: 30px; color: #777; font-size: 10pt; }
  a { color: #1a237e; text-decoration: none; }
</style>
</head>
<body>
<div class="cover">
  <h1>${TITLE}</h1>
  <div class="subtitle">${SUBTITLE}</div>
  <div class="meta">${META}</div>
</div>
${html}
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { curve: 'basis', htmlLabels: true },
    sequence: { actorMargin: 50, boxMargin: 10 },
    themeVariables: {
      primaryColor: '#e8eaf6',
      primaryTextColor: '#1a237e',
      primaryBorderColor: '#1a237e',
      lineColor: '#3949ab',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }
  });
  window.__renderMermaid = async () => {
    await mermaid.run({ querySelector: '.mermaid' });
    window.__mermaidDone = true;
  };
</script>
</body>
</html>`;

await writeFile('DOCUMENTACION_TECNICA.html', fullHtml, 'utf8');
console.log('HTML generado.');

console.log('Lanzando Chromium…');
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
await page.evaluate(() => window.__renderMermaid());
await page.waitForFunction(() => window.__mermaidDone === true, { timeout: 60000 });
await new Promise(r => setTimeout(r, 500));

await page.pdf({
  path: OUT_PDF,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', right: '16mm', bottom: '18mm', left: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8pt;color:#777;width:100%;text-align:center;">${TITLE} — Documentación Técnica</div>`,
  footerTemplate: `<div style="font-size:8pt;color:#777;width:100%;text-align:center;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`
});

await browser.close();
console.log('PDF generado:', OUT_PDF);
