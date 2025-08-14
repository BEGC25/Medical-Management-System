function collectHeadCSS(): string {
  // Copy all <link rel="stylesheet"> and <style> from the current app into the print window
  const parts: string[] = [`<base href="${location.origin}">`]; // make relative hrefs work
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
    parts.push((el as HTMLElement).outerHTML);
  });
  return parts.join("");
}

export function printByHtml(html: string, title = "Print") {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;

  const headCSS = collectHeadCSS();
  const inlineCSS = `
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; }
      .rx-print{
        width:210mm; height:297mm; padding:12mm; box-sizing:border-box;
        display:flex; flex-direction:column; overflow:hidden;
        -webkit-print-color-adjust: exact; print-color-adjust: exact;
      }
      .mt-auto{ margin-top:auto !important; }
      /* 🔧 Neutralize any hide-all rules copied from app CSS */
      @media print {
        *, *::before, *::after { visibility: visible !important; }
        html, body, #page { visibility: visible !important; }
        /* If any display:none sneaks in, undo it for our page */
        #page, #page * { display: initial !important; }
      }
    </style>
  `;

  w.document.write(`<!doctype html>
    <html>
      <head>
        <title>${title}</title>
        ${headCSS}
        ${inlineCSS}
      </head>
      <body>
        <div class="rx-print" id="page">${html}</div>
      </body>
    </html>`);
  w.document.close();

  // Wait a tick so CSS loads, then print
  setTimeout(() => { w.focus(); w.print(); w.close(); }, 350);
}

export function printById(id: string, title?: string) {
  const node = document.getElementById(id);
  if (node) printByHtml(node.innerHTML, title);
}