export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]!);
}

export function emailLayout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f1e8;color:#1f201c;font-family:Arial,sans-serif"><div style="max-width:640px;margin:0 auto;padding:32px 20px"><div style="border-top:8px solid #cf4c10;background:#fff;padding:32px"><p style="font-size:11px;letter-spacing:.12em;color:#cf4c10;font-weight:700">DEEPFAKES &amp; DIGITAL TRUST</p><h1 style="font-size:30px;line-height:1.1;margin:18px 0">${escapeHtml(title)}</h1>${body}<hr style="border:0;border-top:1px solid #d5d2c9;margin:28px 0"><p style="font-size:12px;color:#666">October 11, 2026 · Gordon College</p></div></div></body></html>`;
}
