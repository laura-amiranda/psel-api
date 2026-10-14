// Servidor só para testar localmente os handlers da Vercel, sem precisar
// instalar a CLI da Vercel. Não é usado em produção.
const http = require('http');
const { parse } = require('url');

const rotaIndex = require('./api/index.js');
const rotaColecao = require('./api/[squad]/[collection]/index.js');
const rotaRegistro = require('./api/[squad]/[collection]/[id].js');
const rotaReset = require('./api/[squad]/reset.js');

function criarResposta(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  return res;
}

const server = http.createServer((req, res) => {
  const { pathname, query } = parse(req.url, true);
  const partes = pathname.split('/').filter(Boolean); // ex: ['api','squad-azul','ocorrencias','123']

  let chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString();
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }

    criarResposta(res);

    if (partes.length === 1 && partes[0] === 'api') {
      req.query = query;
      return rotaIndex(req, res);
    }
    if (partes.length === 3 && partes[0] === 'api' && partes[2] === 'reset') {
      req.query = { ...query, squad: partes[1] };
      return rotaReset(req, res);
    }
    if (partes.length === 3 && partes[0] === 'api') {
      req.query = { ...query, squad: partes[1], collection: partes[2] };
      return rotaColecao(req, res);
    }
    if (partes.length === 4 && partes[0] === 'api') {
      req.query = { ...query, squad: partes[1], collection: partes[2], id: partes[3] };
      return rotaRegistro(req, res);
    }

    res.status(404).json({ erro: 'rota não encontrada no servidor de dev' });
  });
});

server.listen(3000, () => console.log('dev server ouvindo em http://localhost:3000'));
