# English

# WhatsApp Outreach Bot (Evolution API)

Send personalized outreach messages over WhatsApp to a list of businesses, with human-like pacing, WhatsApp number checks, and tracking of who has already been contacted.

Built for **consultancies, agencies, freelancers, and small businesses** doing B2B outbound prospecting who want to stop copying, pasting, and sending each message by hand without losing control of the process.

> The project was built for the Brazilian market. The CLI flags, console output, and message templates are in Portuguese, and phone numbers are normalized to the Brazilian format (+55).

---

## ✨ Features

- **Reads your list of businesses** from JSON or TXT, with a name, a phone number, and any other fields you want
- **Personalizes every message** with variables (`{{nome}}`, `{{cidade}}`, `{{segmento}}`...) and text variations (`{Olá|Oi|Bom dia}`)
- **Checks which numbers are on WhatsApp** before sending and fixes the 9th digit of Brazilian mobile numbers
- **Sends at a human-like pace:** random delay between messages, a "typing..." status, a daily cap, and business-hours sending
- **Never contacts anyone twice:** recipients are recorded and skipped, even if they appear in another list
- **Respects opt-outs:** numbers in `data/optout.txt` never get a message
- **Writes a CSV log** for every run, showing who received the message, who isn't on WhatsApp, and which sends failed
- **Simulation mode (`--dry-run`):** prints exactly what would be sent without sending anything

## 🧭 How it works

```
┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐    ┌─────────────┐
│ Business list    │ →  │ Skip already │ →  │ Check WhatsApp    │ →  │ Send with   │
│ (JSON / TXT)     │    │ sent/opt-outs│    │ (Evolution API)   │    │ delays      │
└──────────────────┘    └──────────────┘    └───────────────────┘    └─────────────┘
```

The list can come from anywhere: a CRM, a spreadsheet, or manual research. [`PROMPT_BUSCA.md`](PROMPT_BUSCA.md) contains a ready-to-use prompt for building the list with a web-search-enabled AI assistant, already in the format the bot expects.

## 🛠️ Requirements

- Node.js 20+
- An [Evolution API](https://github.com/EvolutionAPI/evolution-api) v2 instance with a connected WhatsApp number

## 🚀 Installation

```bash
git clone https://github.com/brunpena/bot-prospeccao.git
cd bot-prospeccao
npm install
cp .env.example .env
```

Fill in `.env`:

```env
EVOLUTION_URL=https://evolution.yourdomain.com
EVOLUTION_API_KEY=your-api-key
EVOLUTION_INSTANCE=instance-name

DELAY_MIN_SEG=45      # minimum delay between messages (seconds)
DELAY_MAX_SEG=120     # maximum delay between messages (seconds)
LIMITE_DIARIO=40      # maximum messages per day
HORA_INICIO=8         # only send from this hour...
HORA_FIM=18           # ...until this hour
DIGITANDO_MS=2500     # how long "typing..." shows before each message (ms)
```

## 📋 Usage

**1. Build your list** in `listas/`:

```json
[
  { "nome": "Clínica Sorriso", "telefone": "41999998888", "cidade": "Curitiba", "segmento": "odontologia" }
]
```

or as TXT, one business per line:

```
Clínica Sorriso;41999998888;Curitiba
```

**2. Write your message** in `templates/padrao.txt`:

```
{Olá|Oi}, tudo bem? Falo com a equipe da *{{nome}}*?
...
_Se preferir não receber mensagens, é só responder SAIR._
```

**3. Simulate, then send:**

```bash
npm start -- --lista listas/clinicas-curitiba.json --dry-run
npm start -- --lista listas/clinicas-curitiba.json
```

| Flag | Default | Description |
|---|---|---|
| `--lista`, `-l` | `listas/empresas.json` | List file (.json or .txt) |
| `--template`, `-t` | `templates/padrao.txt` | Message template |
| `--limite`, `-n` | `LIMITE_DIARIO` | Max messages for this run |
| `--dry-run` | — | Print messages without sending |
| `--ignorar-horario` | — | Ignore the sending-hours window |

Ctrl+C stops safely after the message currently being sent.

**Running in the background on a server:**

```bash
pm2 start "npm start -- --lista listas/x.json" --name outreach --no-autorestart
```

## 📁 Project structure

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

## ⚠️ Responsible use

This project is meant for **small-scale B2B prospecting** using public business contacts. It is **not** a mass-messaging tool.

- **WhatsApp:** sending many messages to people who don't have your number saved can get the number **banned**. Use a dedicated number, start with only 15 to 20 messages a day, and increase slowly.
- **Privacy (LGPD/GDPR):** contact businesses, not individuals. Use only public business data, identify yourself in the message, offer a way to opt out, and honor removal requests (`data/optout.txt`).
- **Check your list:** data collected automatically or with AI can be wrong or out of date.

Whoever runs the tool is responsible for how it is used and for complying with WhatsApp's terms and applicable law.

## 📄 License

MIT. Use, modify, and distribute freely.

---

Made by [Bruno Pena](https://github.com/brunpena) · MP Develop

# Português

# Bot de Prospecção via WhatsApp (Evolution API)
 
Envie mensagens personalizadas de prospecção pelo WhatsApp para uma lista de empresas, com intervalos humanizados, verificação de WhatsApp e controle de quem já foi contatado.
 
Feito para **consultorias, agências, freelancers e pequenos negócios** que fazem prospecção ativa B2B e querem sair do "copiar, colar e enviar" manual sem perder o controle do processo.
 
---
 
## ✨ O que ele faz
 
- **Lê sua lista de empresas** em JSON ou TXT, com nome, telefone e quaisquer outros campos
- **Personaliza cada mensagem** com variáveis (`{{nome}}`, `{{cidade}}`, `{{segmento}}`...) e variações de texto (`{Olá|Oi|Bom dia}`)
- **Confere quais números têm WhatsApp** antes de enviar e já ajusta o 9º dígito dos celulares brasileiros
- **Envia de forma humanizada:** intervalo aleatório entre mensagens, status "digitando...", limite diário e horário comercial
- **Não repete contatos:** quem já recebeu fica registrado e não recebe de novo, mesmo aparecendo em outra lista
- **Respeita o opt-out:** números em `data/optout.txt` nunca recebem mensagem
- **Gera um log CSV** de cada execução, com quem recebeu, quem não tem WhatsApp e quem deu erro
- **Modo simulação (`--dry-run`):** mostra exatamente o que seria enviado, sem enviar nada
## 🧭 Como funciona
 
```
┌──────────────────┐    ┌──────────────┐    ┌───────────────────┐    ┌─────────────┐
│ Lista de empresas│ →  │ Filtra envia-│ →  │ Verifica WhatsApp │ →  │ Envia com   │
│ (JSON / TXT)     │    │ dos e opt-out│    │ (Evolution API)   │    │ intervalos  │
└──────────────────┘    └──────────────┘    └───────────────────┘    └─────────────┘
```
 
A lista pode vir de onde você quiser: CRM, planilha ou pesquisa manual. O arquivo [`PROMPT_BUSCA.md`](PROMPT_BUSCA.md) traz um prompt pronto para montar a lista com um assistente de IA com busca na web, já no formato que o bot entende.
 
## 🛠️ Requisitos
 
- Node.js 20+
- Uma instância da [Evolution API](https://github.com/EvolutionAPI/evolution-api) v2 com um número de WhatsApp conectado
## 🚀 Instalação
 
```bash
git clone https://github.com/brunpena/bot-prospeccao.git
cd bot-prospeccao
npm install
cp .env.example .env
```
 
Preencha o `.env`:
 
```env
EVOLUTION_URL=https://evolution.seudominio.com.br
EVOLUTION_API_KEY=sua-api-key
EVOLUTION_INSTANCE=nome-da-instancia
 
DELAY_MIN_SEG=45      # intervalo mínimo entre mensagens
DELAY_MAX_SEG=120     # intervalo máximo entre mensagens
LIMITE_DIARIO=40      # máximo de envios por dia
HORA_INICIO=8         # só envia a partir desta hora
HORA_FIM=18           # e até esta hora
DIGITANDO_MS=2500     # tempo de "digitando..." antes de cada mensagem
```
 
## 📋 Uso
 
**1. Monte a lista** em `listas/`:
 
```json
[
  { "nome": "Clínica Sorriso", "telefone": "41999998888", "cidade": "Curitiba", "segmento": "odontologia" }
]
```
 
ou em TXT, uma empresa por linha:
 
```
Clínica Sorriso;41999998888;Curitiba
```
 
**2. Escreva a mensagem** em `templates/padrao.txt`:
 
```
{Olá|Oi}, tudo bem? Falo com a equipe da *{{nome}}*?
...
_Se preferir não receber mensagens, é só responder SAIR._
```
 
**3. Simule e depois envie:**
 
```bash
npm start -- --lista listas/clinicas-curitiba.json --dry-run
npm start -- --lista listas/clinicas-curitiba.json
```
 
| Flag | Padrão | Descrição |
|---|---|---|
| `--lista`, `-l` | `listas/empresas.json` | Arquivo da lista (.json ou .txt) |
| `--template`, `-t` | `templates/padrao.txt` | Molde da mensagem |
| `--limite`, `-n` | `LIMITE_DIARIO` | Máximo de envios nesta execução |
| `--dry-run` | — | Mostra as mensagens sem enviar |
| `--ignorar-horario` | — | Ignora a janela de horário |
 
Ctrl+C encerra com segurança depois do envio em andamento.
 
**Rodando em segundo plano no servidor:**
 
```bash
pm2 start "npm start -- --lista listas/x.json" --name prospeccao --no-autorestart
```
 
## 📁 Estrutura
 
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
 
## ⚠️ Uso responsável
 
Este projeto é para **prospecção B2B em pequena escala**, com contatos comerciais públicos. Ele **não** serve para disparo em massa.
 
- **WhatsApp:** muitas mensagens para quem não tem seu número salvo podem fazer o número ser **banido**. Use um número dedicado, comece com poucos envios por dia (15 a 20) e aumente aos poucos.
- **LGPD:** contate empresas, não pessoas físicas. Use apenas dados comerciais públicos, identifique-se na mensagem, ofereça uma forma de sair e atenda os pedidos de remoção (`data/optout.txt`).
- **Verifique a lista:** dados coletados automaticamente ou por IA podem estar errados ou desatualizados.
O uso da ferramenta e o cumprimento dos termos do WhatsApp e da legislação são responsabilidade de quem a executa.
 
## 📄 Licença
 
MIT. Use, modifique e distribua à vontade.
 
---
 
Feito por [Bruno Pena](https://github.com/brunpena) · MP Develop
 
