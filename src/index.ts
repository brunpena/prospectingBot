import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

/* ============================================================
 * Bot de envio: lista de empresas (JSON/TXT) -> WhatsApp (Evolution API v2)
 *
 * Uso:
 *   npm start -- --dry-run
 *   npm start
 *   npm start -- --lista listas/dentistas-curitiba.json --template templates/padrao.txt --limite 20
 * ============================================================ */

type Empresa = {
  nome: string;
  telefone: string; // E.164 sem "+", ex: 5541999998888
  [campo: string]: string; // campos extras viram variáveis no molde: {{cidade}}, {{segmento}}...
};

type RegistroEnvio = { nome: string; lista: string; em: string };

// ---------- Config ----------
function env(chave: string, padrao?: string): string {
  const v = process.env[chave] ?? padrao;
  if (v === undefined || v === '') throw new Error(`Variável ${chave} ausente no .env`);
  return v;
}

const CFG = {
  evoUrl: () => env('EVOLUTION_URL').replace(/\/+$/, ''),
  evoKey: () => env('EVOLUTION_API_KEY'),
  evoInstancia: () => env('EVOLUTION_INSTANCE'),
  delayMin: Number(env('DELAY_MIN_SEG', '45')),
  delayMax: Number(env('DELAY_MAX_SEG', '120')),
  limiteDiario: Number(env('LIMITE_DIARIO', '40')),
  horaInicio: Number(env('HORA_INICIO', '8')),
  horaFim: Number(env('HORA_FIM', '18')),
  digitandoMs: Number(env('DIGITANDO_MS', '2500')),
};

const ARQ_ENVIADOS = 'data/enviados.json';
const ARQ_OPTOUT = 'data/optout.txt';

// ---------- Utils ----------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const aleatorio = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const hojeISO = () => new Date().toISOString().slice(0, 10);

function normalizarTelefone(bruto?: string): string | null {
  if (!bruto) return null;
  let d = String(bruto).replace(/\D/g, '');
  d = d.replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) d = '55' + d; // DDD + número
  if (!d.startsWith('55') || (d.length !== 12 && d.length !== 13)) return null;
  return d;
}

/** Spintax: "{Olá|Oi|Bom dia}" -> sorteia uma opção. Suporta aninhamento. */
function spintax(texto: string): string {
  const re = /\{([^{}]*\|[^{}]*)\}/;
  let t = texto;
  while (re.test(t)) {
    t = t.replace(re, (_, grupo: string) => {
      const opcoes = grupo.split('|');
      return opcoes[Math.floor(Math.random() * opcoes.length)];
    });
  }
  return t;
}

function renderizar(template: string, e: Empresa): string {
  return spintax(template)
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => e[k] ?? '')
    .trim();
}

function lerJSON<T>(arq: string, padrao: T): T {
  if (!existsSync(arq)) return padrao;
  try {
    return JSON.parse(readFileSync(arq, 'utf8')) as T;
  } catch {
    return padrao;
  }
}

function lerOptOut(): Set<string> {
  if (!existsSync(ARQ_OPTOUT)) return new Set();
  return new Set(
    readFileSync(ARQ_OPTOUT, 'utf8')
      .split(/\r?\n/)
      .map((l) => normalizarTelefone(l.trim()))
      .filter((x): x is string => !!x),
  );
}

function dentroDoHorario(): boolean {
  const h = new Date().getHours();
  return h >= CFG.horaInicio && h < CFG.horaFim;
}

function csv(v: string) {
  return `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

// ---------- Leitura da lista ----------
/**
 * JSON: [{ "nome": "...", "telefone": "...", "cidade": "...", ... }]
 * TXT:  uma empresa por linha -> nome;telefone;cidade   (linhas com # são ignoradas)
 */
function lerLista(arq: string): { validas: Empresa[]; invalidas: string[] } {
  if (!existsSync(arq)) throw new Error(`Lista não encontrada: ${arq}`);
  const bruto = readFileSync(arq, 'utf8').trim();
  let itens: Record<string, unknown>[];

  if (arq.endsWith('.json') || bruto.startsWith('[')) {
    // aceita a resposta do Claude mesmo se vier dentro de ```json ... ```
    const limpo = bruto.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(limpo);
    itens = Array.isArray(parsed) ? parsed : parsed.empresas ?? [];
  } else {
    itens = bruto
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const [nome, telefone, cidade] = l.split(';').map((s) => s?.trim());
        return { nome, telefone, cidade };
      });
  }

  const validas: Empresa[] = [];
  const invalidas: string[] = [];
  const vistos = new Set<string>();

  for (const item of itens) {
    const nome = String(item.nome ?? '').trim();
    const tel = normalizarTelefone(item.telefone as string);
    if (!nome || !tel) {
      invalidas.push(`${nome || '(sem nome)'} → ${item.telefone ?? '(sem telefone)'}`);
      continue;
    }
    if (vistos.has(tel)) continue;
    vistos.add(tel);

    const extras = Object.fromEntries(
      Object.entries(item)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    );
    validas.push({ ...extras, nome, telefone: tel });
  }
  return { validas, invalidas };
}

// ---------- Evolution API v2 ----------
async function evo<T = any>(rota: string, body: unknown): Promise<T> {
  const url = `${CFG.evoUrl()}${rota}/${encodeURIComponent(CFG.evoInstancia())}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: CFG.evoKey() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Evolution ${rota} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** Retorna Map<telefoneDaLista, numeroWhatsApp> só para quem tem WhatsApp. */
async function filtrarComWhatsApp(telefones: string[]): Promise<Map<string, string>> {
  const ok = new Map<string, string>();
  for (let i = 0; i < telefones.length; i += 50) {
    const lote = telefones.slice(i, i + 50);
    const resp = await evo<Array<{ exists: boolean; jid?: string; number?: string }>>(
      '/chat/whatsappNumbers',
      { numbers: lote },
    );
    resp.forEach((r, idx) => {
      if (!r.exists || !r.jid) return;
      const original = lote.find((t) => normalizarTelefone(r.number) === t) ?? lote[idx];
      ok.set(original, r.jid.split('@')[0]); // jid corrige o 9º dígito
    });
  }
  return ok;
}

async function enviarTexto(numero: string, texto: string) {
  return evo('/message/sendText', { number: numero, text: texto, delay: CFG.digitandoMs });
}

// ---------- Main ----------
async function main() {
  const { values } = parseArgs({
    options: {
      lista: { type: 'string', short: 'l', default: 'listas/empresas.json' },
      template: { type: 'string', short: 't', default: 'templates/padrao.txt' },
      limite: { type: 'string', short: 'n' },
      'dry-run': { type: 'boolean', default: false },
      'ignorar-horario': { type: 'boolean', default: false },
    },
  });

  const arqLista = values.lista!;
  const dryRun = values['dry-run']!;
  const template = readFileSync(values.template!, 'utf8');
  mkdirSync('data', { recursive: true });

  const { validas, invalidas } = lerLista(arqLista);
  const enviados = lerJSON<Record<string, RegistroEnvio>>(ARQ_ENVIADOS, {});
  const optOut = lerOptOut();

  const jaHoje = Object.values(enviados).filter((r) => r.em.startsWith(hojeISO())).length;
  const restanteHoje = Math.max(0, CFG.limiteDiario - jaHoje);
  const limite = Math.min(values.limite ? Number(values.limite) : restanteHoje, restanteHoje);

  console.log(`📄 Lista: ${arqLista} → ${validas.length} válidas, ${invalidas.length} com telefone inválido`);
  invalidas.forEach((x) => console.log(`   ⚠️  ${x}`));
  console.log(`📊 Enviados hoje: ${jaHoje}/${CFG.limiteDiario} → até ${limite} nesta execução${dryRun ? ' (DRY-RUN)' : ''}`);
  if (limite === 0 && !dryRun) return console.log('Limite diário atingido. Rode amanhã.');

  const novas = validas.filter((e) => !enviados[e.telefone] && !optOut.has(e.telefone));
  console.log(`🏢 ${novas.length} ainda não contatadas`);
  if (novas.length === 0) return;

  const comWpp = await filtrarComWhatsApp(novas.map((e) => e.telefone));
  const semWpp = novas.filter((e) => !comWpp.has(e.telefone));
  const alvos = novas.filter((e) => comWpp.has(e.telefone)).slice(0, dryRun ? novas.length : limite);
  console.log(`💬 ${comWpp.size} com WhatsApp · ${semWpp.length} sem · ${alvos.length} na fila\n`);

  const arqLog = `data/log-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  writeFileSync(arqLog, 'data_hora,empresa,telefone,status,detalhe\n');
  const log = (e: Empresa, status: string, detalhe = '') =>
    appendFileSync(arqLog, [new Date().toISOString(), e.nome, e.telefone, status, detalhe].map(csv).join(',') + '\n');
  semWpp.forEach((e) => log(e, 'sem-whatsapp'));

  let parar = false;
  process.on('SIGINT', () => {
    console.log('\n⏹  Encerrando após o envio atual...');
    parar = true;
  });

  let ok = 0;
  for (const [i, emp] of alvos.entries()) {
    if (parar) break;
    if (!dryRun && !values['ignorar-horario'] && !dentroDoHorario()) {
      console.log(`⏰ Fora do horário (${CFG.horaInicio}h–${CFG.horaFim}h). Parando.`);
      break;
    }

    const numero = comWpp.get(emp.telefone)!;
    const msg = renderizar(template, emp);
    const pos = `[${i + 1}/${alvos.length}]`;

    if (dryRun) {
      console.log(`${pos} ${emp.nome} (${numero})\n${msg}\n${'-'.repeat(40)}`);
      log(emp, 'dry-run');
      continue;
    }

    try {
      await enviarTexto(numero, msg);
      enviados[emp.telefone] = { nome: emp.nome, lista: arqLista, em: new Date().toISOString() };
      writeFileSync(ARQ_ENVIADOS, JSON.stringify(enviados, null, 2));
      log(emp, 'enviado');
      ok++;
      console.log(`✅ ${pos} ${emp.nome} (${numero})`);
    } catch (err: any) {
      log(emp, 'erro', err.message);
      console.log(`❌ ${pos} ${emp.nome}: ${err.message}`);
    }

    if (i < alvos.length - 1 && !parar) {
      const espera = aleatorio(CFG.delayMin, CFG.delayMax);
      console.log(`   ⏳ aguardando ${espera}s...`);
      for (let s = 0; s < espera && !parar; s++) await sleep(1000);
    }
  }

  console.log(`\n🏁 Fim. ${dryRun ? 'Simulação concluída' : `${ok} mensagens enviadas`}. Log: ${arqLog}`);
}

main().catch((e) => {
  console.error('💥', e.message);
  process.exit(1);
});
