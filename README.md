<a id="top"></a>

<div align="center">

# 📲 WhatsApp Outreach Bot

**Personalized B2B outreach over WhatsApp, powered by Evolution API**

**Prospecção B2B personalizada pelo WhatsApp, com Evolution API**

<br>

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Evolution API](https://img.shields.io/badge/Evolution_API-v2-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

<br>

### [🇺🇸 English](#english) &nbsp;·&nbsp; [🇧🇷 Português](#portugues)

</div>

<br>

---

<a id="english"></a>

## 🇺🇸 English

Send personalized outreach messages over WhatsApp to a list of businesses, with human-like pacing, WhatsApp number checks, and tracking of who has already been contacted.

Built for **consultancies, agencies, freelancers, and small businesses** doing B2B outbound prospecting who want to stop copying, pasting, and sending each message by hand without losing control of the process.

> [!NOTE]
> The project was built for the Brazilian market. The CLI flags, console output, and message templates are in Portuguese, and phone numbers are normalized to the Brazilian format (+55).

<details>
<summary><b>📑 Table of contents</b></summary>

- [Features](#-features)
- [How it works](#-how-it-works)
- [Requirements](#️-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project structure](#-project-structure)
- [Responsible use](#️-responsible-use)
- [License](#-license)

</details>

### ✨ Features

| | Feature | Description |
|:-:|---|---|
| 📄 | **Your own list** | Reads JSON or TXT with a name, a phone number, and any extra fields |
| ✍️ | **Personalized messages** | Variables (`{{nome}}`, `{{cidade}}`...) and text variations (`{Olá\|Oi}`) |
| ✅ | **WhatsApp check** | Skips numbers without WhatsApp and fixes the 9th digit of Brazilian mobiles |
| 🕐 | **Human-like pacing** | Random delays, "typing..." status, daily cap, and business-hours sending |
| 🔁 | **No duplicates** | Anyone already contacted is skipped, even if they appear in another list |
| 🚫 | **Opt-out** | Numbers in `data/optout.txt` never get a message |
| 📊 | **CSV log** | Every run records who received, who isn't on WhatsApp, and which sends failed |
| 🧪 | **Dry run** | `--dry-run` prints exactly what would be sent without sending anything |

### 🧭 How it works

```
┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐    ┌─────────────┐
│ Business list    │ →  │ Skip already │ →  │ Check WhatsApp    │ →  │ Send with   │
│ (JSON / TXT)     │    │ sent/opt-outs│    │ (Evolution API)   │    │ delays      │
└──────────────────┘    └──────────────┘    └───────────────────┘    └─────────────┘
```

> [!TIP]
> The list can come from anywhere: a CRM, a spreadsheet, or manual research. [`PROMPT_BUSCA.md`](PROMPT_BUSCA.md) has a ready-to-use prompt for building the list with a web-search-enabled AI assistant, already in the format the bot expects.

### 🛠️ Requirements

- **Node.js** 20+
- An **[Evolution API](https://github.com/EvolutionAPI/evolution-api) v2** instance with a connected WhatsApp number

### 🚀 Installation

```bash
git clone https://github.com/brunpena/bot-prospeccao.git
cd bot-prospeccao
npm install
cp .env.example .env
```

Then fill in `.env`:

```env
EVOLUTION_URL=https://evolution.yourdomain.com
EVOLUTION_API_KEY=your-api-key
EVOLUTION_INSTANCE=instance-name
```

<details>
<summary><b>⚙️ Optional settings (pacing and limits)</b></summary>

<br>

| Variable | Default | Description |
|---|:-:|---|
| `DELAY_MIN_SEG` | `45` | Minimum delay between messages (seconds) |
| `DELAY_MAX_SEG` | `120` | Maximum delay between messages (seconds) |
| `LIMITE_DIARIO` | `40` | Maximum messages per day |
| `HORA_INICIO` | `8` | Only send from this hour... |
| `HORA_FIM` | `18` | ...until this hour |
| `DIGITANDO_MS` | `2500` | How long "typing..." shows before each message (ms) |

</details>

### 📋 Usage

#### 1️⃣ Build your list in `listas/`

```json
[
  { "nome": "Clínica Sorriso", "telefone": "41999998888", "cidade": "Curitiba", "segmento": "odontologia" }
]
```

<details>
<summary>Or use TXT, one business per line</summary>

```
Clínica Sorriso;41999998888;Curitiba
```

</details>

#### 2️⃣ Write your message in `templates/padrao.txt`

```
{Olá|Oi}, tudo bem? Falo com a equipe da *{{nome}}*?
...
_Se preferir não receber mensagens, é só responder SAIR._
```

#### 3️⃣ Simulate, then send

```bash
npm start -- --lista listas/clinicas-curitiba.json --dry-run   # preview
npm start -- --lista listas/clinicas-curitiba.json             # send
```

| Flag | Default | Description |
|---|---|---|
| `--lista`, `-l` | `listas/empresas.json` | List file (.json or .txt) |
| `--template`, `-t` | `templates/padrao.txt` | Message template |
| `--limite`, `-n` | `LIMITE_DIARIO` | Max messages for this run |
| `--dry-run` | — | Print messages without sending |
| `--ignorar-horario` | — | Ignore the sending-hours window |

Press **Ctrl+C** to stop safely after the message currently being sent.

<details>
<summary><b>🖥️ Running in the background on a server</b></summary>

```bash
pm2 start "npm start -- --lista listas/x.json" --name outreach --no-autorestart
```

</details>

### 📁 Project structure

```
├── src/index.ts          # the bot
├── templates/padrao.txt  # message template
├── listas/               # your business lists
├── data/
│   ├── enviados.json     # history of who has been contacted (generated)
│   ├── optout.txt        # numbers that must not be contacted
│   └── log-*.csv         # per-run log (generated)
└── PROMPT_BUSCA.md       # prompt for building lists with AI
```

### ⚠️ Responsible use

> [!WARNING]
> This project is meant for **small-scale B2B prospecting** using public business contacts. It is **not** a mass-messaging tool.

- **WhatsApp:** sending many messages to people who don't have your number saved can get the number **banned**. Use a dedicated number, start with only 15 to 20 messages a day, and increase slowly.
- **Privacy (LGPD/GDPR):** contact businesses, not individuals. Use only public business data, identify yourself in the message, offer a way to opt out, and honor removal requests (`data/optout.txt`).
- **Check your list:** data collected automatically or with AI can be wrong or out of date.

Whoever runs the tool is responsible for how it is used and for complying with WhatsApp's terms and applicable law.

### 📄 License

[MIT](LICENSE). Use, modify, and distribute freely.

<div align="right"><a href="#top">⬆ Back to top</a></div>

---

<a id="portugues"></a>

## 🇧🇷 Português

Envie mensagens personalizadas de prospecção pelo WhatsApp para uma lista de empresas, com intervalos humanizados, verificação de WhatsApp e controle de quem já foi contatado.

Feito para **consultorias, agências, freelancers e pequenos negócios** que fazem prospecção ativa B2B e querem sair do "copiar, colar e enviar" manual sem perder o controle do processo.

<details>
<summary><b>📑 Sumário</b></summary>

- [O que ele faz](#-o-que-ele-faz)
- [Como funciona](#-como-funciona)
- [Requisitos](#️-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura](#-estrutura)
- [Uso responsável](#️-uso-responsável)
- [Licença](#-licença)

</details>

### ✨ O que ele faz

| | Recurso | Descrição |
|:-:|---|---|
| 📄 | **Sua própria lista** | Lê JSON ou TXT com nome, telefone e quaisquer outros campos |
| ✍️ | **Mensagens personalizadas** | Variáveis (`{{nome}}`, `{{cidade}}`...) e variações de texto (`{Olá\|Oi}`) |
| ✅ | **Verifica o WhatsApp** | Pula números sem WhatsApp e ajusta o 9º dígito dos celulares |
| 🕐 | **Envio humanizado** | Intervalo aleatório, status "digitando...", limite diário e horário comercial |
| 🔁 | **Sem repetição** | Quem já recebeu é pulado, mesmo aparecendo em outra lista |
| 🚫 | **Opt-out** | Números em `data/optout.txt` nunca recebem mensagem |
| 📊 | **Log CSV** | Cada execução registra quem recebeu, quem não tem WhatsApp e quem deu erro |
| 🧪 | **Simulação** | `--dry-run` mostra exatamente o que seria enviado, sem enviar nada |

### 🧭 Como funciona

```
┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐    ┌─────────────┐
│ Lista de empresas│ →  │ Filtra envia-│ →  │ Verifica WhatsApp │ →  │ Envia com   │
│ (JSON / TXT)     │    │ dos e opt-out│    │ (Evolution API)   │    │ intervalos  │
└──────────────────┘    └──────────────┘    └───────────────────┘    └─────────────┘
```

> [!TIP]
> A lista pode vir de onde você quiser: CRM, planilha ou pesquisa manual. O arquivo [`PROMPT_BUSCA.md`](PROMPT_BUSCA.md) traz um prompt pronto para montar a lista com um assistente de IA com busca na web, já no formato que o bot entende.

### 🛠️ Requisitos

- **Node.js** 20+
- Uma instância da **[Evolution API](https://github.com/EvolutionAPI/evolution-api) v2** com um número de WhatsApp conectado

### 🚀 Instalação

```bash
git clone https://github.com/brunpena/bot-prospeccao.git
cd bot-prospeccao
npm install
cp .env.example .env
```

Depois preencha o `.env`:

```env
EVOLUTION_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=nome-da-instancia
```

<details>
<summary><b>⚙️ Configurações opcionais (ritmo e limites)</b></summary>

<br>

| Variável | Padrão | Descrição |
|---|:-:|---|
| `DELAY_MIN_SEG` | `45` | Intervalo mínimo entre mensagens (segundos) |
| `DELAY_MAX_SEG` | `120` | Intervalo máximo entre mensagens (segundos) |
| `LIMITE_DIARIO` | `40` | Máximo de envios por dia |
| `HORA_INICIO` | `8` | Só envia a partir desta hora... |
| `HORA_FIM` | `18` | ...e até esta hora |
| `DIGITANDO_MS` | `2500` | Tempo de "digitando..." antes de cada mensagem (ms) |

</details>

### 📋 Uso

#### 1️⃣ Monte a lista em `listas/`

```json
[
  { "nome": "Clínica Sorriso", "telefone": "41999998888", "cidade": "Curitiba", "segmento": "odontologia" }
]
```

<details>
<summary>Ou use TXT, uma empresa por linha</summary>

```
Clínica Sorriso;41999998888;Curitiba
```

</details>

#### 2️⃣ Escreva a mensagem em `templates/padrao.txt`

```
{Olá|Oi}, tudo bem? Falo com a equipe da *{{nome}}*?
...
_Se preferir não receber mensagens, é só responder SAIR._
```

#### 3️⃣ Simule e depois envie

```bash
npm start -- --lista listas/clinicas-curitiba.json --dry-run   # simula
npm start -- --lista listas/clinicas-curitiba.json             # envia
```

| Flag | Padrão | Descrição |
|---|---|---|
| `--lista`, `-l` | `listas/empresas.json` | Arquivo da lista (.json ou .txt) |
| `--template`, `-t` | `templates/padrao.txt` | Molde da mensagem |
| `--limite`, `-n` | `LIMITE_DIARIO` | Máximo de envios nesta execução |
| `--dry-run` | — | Mostra as mensagens sem enviar |
| `--ignorar-horario` | — | Ignora a janela de horário |

Aperte **Ctrl+C** para encerrar com segurança depois do envio em andamento.

<details>
<summary><b>🖥️ Rodando em segundo plano no servidor</b></summary>

```bash
pm2 start "npm start -- --lista listas/x.json" --name prospeccao --no-autorestart
```

</details>

### 📁 Estrutura

```
├── src/index.ts          # o bot
├── templates/padrao.txt  # molde da mensagem
├── listas/               # suas listas de empresas
├── data/
│   ├── enviados.json     # histórico de quem já recebeu (gerado)
│   ├── optout.txt        # números que não devem receber
│   └── log-*.csv         # log de cada execução (gerado)
└── PROMPT_BUSCA.md       # prompt para montar listas com IA
```

### ⚠️ Uso responsável

> [!WARNING]
> Este projeto é para **prospecção B2B em pequena escala**, com contatos comerciais públicos. Ele **não** serve para disparo em massa.

- **WhatsApp:** muitas mensagens para quem não tem seu número salvo podem fazer o número ser **banido**. Use um número dedicado, comece com poucos envios por dia (15 a 20) e aumente aos poucos.
- **LGPD:** contate empresas, não pessoas físicas. Use apenas dados comerciais públicos, identifique-se na mensagem, ofereça uma forma de sair e atenda os pedidos de remoção (`data/optout.txt`).
- **Verifique a lista:** dados coletados automaticamente ou por IA podem estar errados ou desatualizados.

O uso da ferramenta e o cumprimento dos termos do WhatsApp e da legislação são responsabilidade de quem a executa.

### 📄 Licença

[MIT](LICENSE). Use, modifique e distribua à vontade.

<div align="right"><a href="#top">⬆ Voltar ao topo</a></div>

---

<div align="center">

Made by / Feito por **[Bruno Pena](https://github.com/brunpena)** · MP Develop

</div>
