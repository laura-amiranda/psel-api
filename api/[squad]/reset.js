const { limparSquad } = require('../../lib/store');
const { tratarPreflight, nomeValido } = require('../../lib/http');

module.exports = async function handler(req, res) {
  if (tratarPreflight(req, res)) return;

  const { squad } = req.query;

  if (!nomeValido(squad)) {
    res.status(400).json({ erro: 'squad deve ter só letras, números e hífen (até 40 caracteres).' });
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ erro: `Método ${req.method} não suportado nessa rota.` });
    return;
  }

  await limparSquad(squad);
  res.status(200).json({ ok: true, mensagem: `Todos os dados do squad "${squad}" foram apagados.` });
};
