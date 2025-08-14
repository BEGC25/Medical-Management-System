export function printIsolated(html: string, title = "Print") {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  
  w.document.write(`<html><head><style>
    @page{size:A4;margin:0}
    html,body{margin:0;padding:0}
    .rx-print{width:210mm;height:297mm;padding:12mm;box-sizing:border-box;
      display:flex;flex-direction:column;overflow:hidden}
    .mt-auto{margin-top:auto!important}
  </style></head><body><div class="rx-print" id="page">${html}</div></body></html>`);
  
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
    w.close();
  }, 200);
}