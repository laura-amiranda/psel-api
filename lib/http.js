// Helpers comuns a todas as rotas: CORS liberado e normalização de nomes.

function aplicarCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Trata o preflight de CORS. Retorna true se já respondeu (nesse caso, a
// rota deve parar por ali).
function tratarPreflight(req, res) {
  aplicarCors(res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

const NOME_VALIDO = /^[a-z0-9-]{1,40}$/i;

function nomeValido(valor) {
  return typeof valor === 'string' && NOME_VALIDO.test(valor);
}

module.exports = { aplicarCors, tratarPreflight, nomeValido };
