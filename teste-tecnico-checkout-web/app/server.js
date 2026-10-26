// Servidor estático mínimo da Loja Exemplo (sem dependências).
// Uso: npm run loja  →  http://localhost:3000
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORTA = Number(process.env.PORT) || 3000;
const PASTA = path.join(__dirname, "public");
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    const caminhoUrl = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let arquivo = path.normalize(path.join(PASTA, caminhoUrl));
    if (!arquivo.startsWith(PASTA)) {
      res.writeHead(403).end("Acesso negado");
      return;
    }
    if (caminhoUrl.endsWith("/")) arquivo = path.join(arquivo, "index.html");

    fs.readFile(arquivo, (erro, conteudo) => {
      if (erro) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Página não encontrada");
        return;
      }
      res
        .writeHead(200, {
          "Content-Type": TIPOS[path.extname(arquivo)] || "application/octet-stream",
          "Cache-Control": "no-store",
        })
        .end(conteudo);
    });
  })
  .listen(PORTA, () => console.log(`Loja Exemplo rodando em http://localhost:${PORTA}`));
