export function printByHtml(html: string, title = "Print") {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  const css = `
    <style>
      @page { size: A4; margin: 0; }          /* no extra margins */
      html, body { margin: 0; padding: 0; }
      .rx-print {
        width: 210mm; height: 297mm;          /* exact A4 box */
        padding: 12mm; box-sizing: border-box;
        display: flex; flex-direction: column; overflow: hidden;
      }
      .mt-auto { margin-top: auto !important; }  /* footer sticks to bottom */
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    </style>`;
  w.document.write(`<html><head><title>${title}</title>${css}</head><body><div class="rx-print" id="page">${html}</div></body></html>`);
  w.document.close();
  setTimeout(() => { w.focus(); w.print(); w.close(); }, 200);
}

export function printById(id: string, title?: string) {
  const node = document.getElementById(id);
  if (node) printByHtml(node.innerHTML, title);
}