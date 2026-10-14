const { lerColecao, salvarColecao } = require('../../../lib/store');
const { tratarPreflight, nomeValido } = require('../../../lib/http');

module.exports = async function handler(req, res) {
  if (tratarPreflight(req, res)) return;

  const { squad, collection, id } = req.query;

  if (!nomeValido(squad) || !nomeValido(collection)) {
    res.status(400).json({
      erro: 'squad e collection devem ter só letras, números e hífen (até 40 caracteres).',
    });
    return;
  }

  const registros = await lerColecao(squad, collection);
  const indice = registros.findIndex((r) => r.id === id);

  if (req.method === 'GET') {
    if (indice === -1) {
      res.status(404).json({ erro: 'Registro não encontrado.' });
      return;
    }
    res.status(200).json(registros[indice]);
    return;
  }

  if (req.method === 'PATCH') {
    if (indice === -1) {
      res.status(404).json({ erro: 'Registro não encontrado.' });
      return;
    }
    const corpo = req.body && typeof req.body === 'object' ? req.body : {};
    // id e createdAt nunca mudam via PATCH
    const { id: _ignorado, createdAt: _ignorado2, ...alteracoes } = corpo;

    registros[indice] = { ...registros[indice], ...alteracoes };
    await salvarColecao(squad, collection, registros);

    res.status(200).json(registros[indice]);
    return;
  }

  if (req.method === 'DELETE') {
    if (indice === -1) {
      res.status(404).json({ erro: 'Registro não encontrado.' });
      return;
    }
    const [removido] = registros.splice(indice, 1);
    await salvarColecao(squad, collection, registros);

    res.status(200).json(removido);
    return;
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE, OPTIONS');
  res.status(405).json({ erro: `Método ${req.method} não suportado nessa rota.` });
};
