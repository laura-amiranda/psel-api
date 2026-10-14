const { tratarPreflight } = require('../lib/http');

module.exports = function handler(req, res) {
  if (tratarPreflight(req, res)) return;

  res.status(200).json({
    nome: 'API genérica do PSEL — Seed a Bit',
    descricao:
      'Cada squad tem suas próprias coleções de dados. Troque {squad} e {colecao} pelos nomes do seu time (ex: "squad-azul", "ocorrencias").',
    endpoints: {
      'GET /api/{squad}/{colecao}':
        'Lista os registros. Aceita filtros por query string, ex: ?bairro=Boa+Viagem',
      'GET /api/{squad}/{colecao}/{id}': 'Busca um registro pelo id',
      'POST /api/{squad}/{colecao}': 'Cria um registro. Envie um JSON no corpo; id e createdAt são gerados pelo servidor',
      'PATCH /api/{squad}/{colecao}/{id}': 'Atualiza campos de um registro existente',
      'DELETE /api/{squad}/{colecao}/{id}': 'Remove um registro',
      'POST /api/{squad}/reset': 'Apaga todos os dados do squad (útil para limpar dados de teste)',
    },
    exemplo_fetch_get: "fetch('/api/squad-azul/ocorrencias').then(r => r.json())",
    exemplo_fetch_post: `fetch('/api/squad-azul/ocorrencias', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bairro: 'Boa Viagem', descricao: 'Alagamento na rua X' })
}).then(r => r.json())`,
  });
};
