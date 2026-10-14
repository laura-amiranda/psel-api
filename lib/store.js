// Camada de armazenamento.
//
// Em produção (Vercel), usamos o Vercel KV — um banco chave/valor que
// persiste entre chamadas (o disco das funções serverless não persiste).
//
// Localmente, se as variáveis de ambiente do KV não estiverem configuradas,
// caímos num arquivo JSON simples em disco, só para facilitar testes antes
// do deploy. Isso NUNCA roda em produção na Vercel.

const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

function chaveColecao(squad, collection) {
  return `col:${squad}:${collection}`;
}

function chaveIndiceSquad(squad) {
  return `squad-collections:${squad}`;
}

// ---------- Implementação com Vercel KV (produção) ----------
let kvStore;
function getKvStore() {
  if (!kvStore) {
    const { kv } = require('@vercel/kv');
    kvStore = kv;
  }
  return kvStore;
}

async function kvLer(squad, collection) {
  const kv = getKvStore();
  const dados = await kv.get(chaveColecao(squad, collection));
  return dados || [];
}

async function kvSalvar(squad, collection, registros) {
  const kv = getKvStore();
  await kv.set(chaveColecao(squad, collection), registros);
  const indiceKey = chaveIndiceSquad(squad);
  const colecoes = (await kv.get(indiceKey)) || [];
  if (!colecoes.includes(collection)) {
    colecoes.push(collection);
    await kv.set(indiceKey, colecoes);
  }
}

async function kvColecoesDoSquad(squad) {
  const kv = getKvStore();
  return (await kv.get(chaveIndiceSquad(squad))) || [];
}

async function kvLimparSquad(squad) {
  const kv = getKvStore();
  const colecoes = await kvColecoesDoSquad(squad);
  await Promise.all(colecoes.map((c) => kv.del(chaveColecao(squad, c))));
  await kv.del(chaveIndiceSquad(squad));
}

// ---------- Implementação em arquivo (apenas dev local) ----------
const fs = require('fs');
const path = require('path');
const ARQUIVO_LOCAL = path.join('/tmp', 'psel-api-dev-data.json');

function lerArquivoLocal() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_LOCAL, 'utf8'));
  } catch {
    return {};
  }
}

function salvarArquivoLocal(dados) {
  fs.writeFileSync(ARQUIVO_LOCAL, JSON.stringify(dados, null, 2));
}

async function fileLer(squad, collection) {
  const dados = lerArquivoLocal();
  return dados[squad]?.[collection] || [];
}

async function fileSalvar(squad, collection, registros) {
  const dados = lerArquivoLocal();
  dados[squad] = dados[squad] || {};
  dados[squad][collection] = registros;
  salvarArquivoLocal(dados);
}

async function fileLimparSquad(squad) {
  const dados = lerArquivoLocal();
  delete dados[squad];
  salvarArquivoLocal(dados);
}

// ---------- Interface pública (escolhe a implementação) ----------
async function lerColecao(squad, collection) {
  return hasKv ? kvLer(squad, collection) : fileLer(squad, collection);
}

async function salvarColecao(squad, collection, registros) {
  return hasKv ? kvSalvar(squad, collection, registros) : fileSalvar(squad, collection, registros);
}

async function limparSquad(squad) {
  return hasKv ? kvLimparSquad(squad) : fileLimparSquad(squad);
}

module.exports = { lerColecao, salvarColecao, limparSquad, usandoKv: hasKv };
