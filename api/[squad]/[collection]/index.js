const { randomUUID } = require('crypto');
const { lerColecao, salvarColecao } = require('../../../lib/store');
const { tratarPreflight, nomeValido } = require('../../../lib/http');

const LIMITE_REGISTROS_POR_SQUAD = 500;
const TAMANHO_MAXIMO_BYTES = 20_000; // ~20kb por registro, evita abuso

module.exports = async function handler(req, res) {
  if (tratarPreflight(req, res)) return;

  const { squad, collection } = req.query;

  if (!nomeValido(squad) || !nomeValido(collection)) {
    res.status(400).json({
      erro: 'squad e collection devem ter só letras, números e hífen (até 40 caracteres).',
    });
    return;
  }

  if (req.method === 'GET') {
    let registros = await lerColecao(squad, collection);

    // Filtro simples: qualquer query string vira um filtro de igualdade.
    // Ex: ?bairro=Boa+Viagem filtra registros com bairro === "Boa Viagem"
    const filtros = { ...req.query };
    delete filtros.squad;
    delete filtros.collection;

    for (const [campo, valor] of Object.entries(filtros)) {
      registros = registros.filter((r) => String(r[campo] ?? '') === String(valor));
    }

    // Mais recentes primeiro
    registros = [...registros].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json(registros);
    return;
  }

  if (req.method === 'POST') {
    const corpo = req.body && typeof req.body === 'object' ? req.body : {};

    if (JSON.stringify(corpo).length > TAMANHO_MAXIMO_BYTES) {
      res.status(413).json({ erro: 'Registro muito grande.' });
      return;
    }

    const registros = await lerColecao(squad, collection);

    if (registros.length >= LIMITE_REGISTROS_POR_SQUAD) {
      res.status(429).json({
        erro: `Limite de ${LIMITE_REGISTROS_POR_SQUAD} registros atingido para essa coleção. Use o endpoint de reset se precisar limpar dados de teste.`,
      });
      return;
    }

    const novoRegistro = {
      ...corpo,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };

    registros.push(novoRegistro);
    await salvarColecao(squad, collection, registros);

    res.status(201).json(novoRegistro);
    return;
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  res.status(405).json({ erro: `Método ${req.method} não suportado nessa rota.` });
};
