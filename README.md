# API genérica do PSEL — Seed a Bit

API de coleções que qualquer squad do PSEL pode usar para guardar e ler dados do próprio app, sem precisar construir um back-end. Cada squad usa seu próprio "espaço" de dados, então não há risco de um squad sobrescrever os dados de outro.

## Como funciona

A ideia é simples: cada squad escolhe um nome (ex: `squad-azul`) e dá nomes às próprias "coleções" de dados (ex: `ocorrencias`, `usuarios`, `eventos`). A API guarda qualquer JSON que você mandar e devolve na consulta.

```
/api/{squad}/{colecao}
```

Troque `{squad}` pelo nome do time e `{colecao}` pelo nome do tipo de dado que ele quer guardar.

## Endpoints

### `GET /api/{squad}/{colecao}`
Lista todos os registros da coleção, mais recentes primeiro.

Aceita filtros simples por query string — qualquer parâmetro vira um filtro de igualdade:
```
GET /api/squad-azul/ocorrencias?bairro=Boa Viagem
```

### `GET /api/{squad}/{colecao}/{id}`
Busca um registro específico pelo `id`. Retorna 404 se não existir.

### `POST /api/{squad}/{colecao}`
Cria um registro novo. Envie qualquer JSON no corpo — os campos são livres, você define o modelo de dados do seu squad.

```js
fetch('/api/squad-azul/ocorrencias', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bairro: 'Boa Viagem', descricao: 'Alagamento na rua X' })
})
  .then(r => r.json())
  .then(console.log)
```

O servidor adiciona automaticamente dois campos a cada registro:
- `id` — identificador único gerado pelo servidor
- `createdAt` — data e hora da criação

### `PATCH /api/{squad}/{colecao}/{id}` *(opcional, além do piso técnico)*
Atualiza um ou mais campos de um registro existente. Envie só os campos que quer mudar.

### `DELETE /api/{squad}/{colecao}/{id}` *(opcional, além do piso técnico)*
Remove um registro.

### `POST /api/{squad}/reset`
Apaga **todos** os dados de todas as coleções daquele squad. Útil para limpar dados de teste antes da apresentação final. Não tem volta — use com cuidado.

### `GET /api`
Retorna esta documentação em JSON, caso algum squad queira consultar os endpoints programaticamente.

## Regras e limites

- **CORS liberado** para qualquer origem — os sites dos squads podem chamar a API de onde estiverem hospedados.
- **Sem autenticação.** A identificação de quem criou um registro é o que o próprio squad decidir mandar no corpo (ex: um campo `autor`). Isso é uma simplificação proposital para o desafio.
- **Sem upload de imagens.** Só JSON.
- Até **20kb** por registro.
- Até **500 registros** por coleção, por squad (use o reset se precisar limpar).
- Nomes de squad e coleção só podem ter letras, números e hífen (até 40 caracteres).

## Como fazer o deploy (passo a passo)

1. **Crie o repositório no GitHub.** Suba este código para um repositório público na sua conta (assim qualquer squad consegue ver o código, se precisar).

2. **Conecte na Vercel.**
   - Entre em [vercel.com](https://vercel.com) com sua conta do GitHub.
   - "Add New" → "Project" → selecione este repositório.
   - Pode deixar todas as configurações como estão (a Vercel detecta sozinha que é um projeto de funções serverless). Clique em "Deploy".

3. **Adicione o armazenamento (Vercel KV).**
   - Esse passo é obrigatório: sem ele, os dados não persistem entre chamadas, porque o disco das funções da Vercel não é permanente.
   - No painel do projeto na Vercel, vá em **Storage** → **Create Database** → escolha **KV** (ou, dependendo do plano, aparece como "Upstash for Redis" no marketplace — é a mesma coisa, baseada em Redis).
   - Depois de criado, clique em **Connect Project** e selecione este projeto. A Vercel adiciona sozinha as variáveis de ambiente necessárias (`KV_REST_API_URL`, `KV_REST_API_TOKEN` etc).
   - Redeploy o projeto (Vercel → Deployments → ⋯ → Redeploy) para que as novas variáveis entrem em vigor.

4. **Teste.** Acesse `https://seu-projeto.vercel.app/api` no navegador — deve aparecer a documentação em JSON. Depois teste um POST (pode usar o Postman, Insomnia, ou o próprio `fetch` no console do navegador).

5. **Passe a URL para os squads.** Algo como `https://seu-projeto.vercel.app/api/{squad}/{colecao}`.

### O plano gratuito é suficiente?
Sim, para o volume de um processo seletivo (poucos squads, poucas semanas, uso em sala). O plano gratuito da Vercel KV tem um limite de requisições mensais bem acima do que o desafio deve gerar.

## Rodando localmente (antes de publicar)

Não precisa de Vercel KV para testar localmente. Sem as variáveis de ambiente do KV configuradas, o projeto usa automaticamente um arquivo local (`/tmp/psel-api-dev-data.json`) só para fins de teste — isso nunca roda em produção.

```bash
npm install
node dev-server.js
```

A API sobe em `http://localhost:3000`. Use os mesmos endpoints acima, trocando o domínio.

> Se preferir testar com a CLI oficial da Vercel (`vercel dev`), também funciona — ela reconhece a estrutura de pastas `api/` automaticamente. `dev-server.js` é só um atalho mais simples que não exige instalar a CLI.

## Estrutura do projeto

```
api/
  index.js                      # GET /api — documentação em JSON
  [squad]/
    reset.js                    # POST /api/{squad}/reset
    [collection]/
      index.js                  # GET e POST /api/{squad}/{colecao}
      [id].js                   # GET, PATCH, DELETE /api/{squad}/{colecao}/{id}
lib/
  store.js                      # camada de armazenamento (KV em produção, arquivo em dev)
  http.js                       # CORS e validação de nomes
dev-server.js                   # servidor simples para testar localmente
```

## Para quem vai avaliar o desafio

Esta API é intencionalmente simples: ela só guarda e devolve JSON, sem validação de schema. A responsabilidade de validar os dados (campos obrigatórios, tipos, etc.) é do front-end de cada squad — isso também faz parte do que está sendo avaliado.
