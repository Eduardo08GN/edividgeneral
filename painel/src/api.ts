// A ponte com o servidor local (editor/servidor.py). Toda rota /api pede a senha da sessao.

export interface Linha { hora: string; texto: string }
export type EtapaId = "briefing" | "copy" | "voz" | "material" | "roteiro" | "producao";
export interface Etapa { id: EtapaId; nome: string; ok: boolean; resumo: string }

export interface Produtor { rodando: boolean; projeto: string | null; etapa: string | null; progresso: number; segundos: number; erro: string | null }

export interface Resumo {
  id: string; nome: string; formato: Formato; destino: string; atualizado: string; versao: number | null;
  video: string | null; capa_t: number | null; folha: string | null; etapas: boolean[];
}

export interface Estado {
  versao: string; projetos: Resumo[]; produtor: Produtor;
  conexoes: { minimax: boolean; motor: boolean; claude: boolean };
  padrao: { voz: string; velocidade: number };
}

export type Formato = "16:9" | "9:16" | "1:1";
export interface Briefing { o_que: string; publico: string; objetivo: string; tom: string; referencias: string }
export interface Versao { n: number; tipo: string; arquivo: string; caminho: string; folha?: string; criado: string; duracao: number; lufs: number | null; render_s: number; modelo?: string; voz?: string }
export interface Material { tipo: string; titulo: string; arquivo: string; caminho: string }
export interface Cena { nome: string; de: number; ate: number }

export interface Projeto {
  id: string; nome: string; criado: string; formato: Formato; duracao_alvo: number; destino: string; modo: "guiado" | "automatico";
  briefing: Briefing; copys: { angulo: string; texto: string }[]; copy: string; copy_origem?: string;
  voz: { id?: string; nome?: string; velocidade?: number }; amostras: Record<string, string>;
  narracao: { ok: boolean; duracao: number; palavras: number; casamento: number; arquivo: string } | null;
  material: Material[]; roteiro: { modelo: "legenda" | "proprio"; composicao?: string; cenas?: Cena[] }; tem_cenas: boolean;
  musica: { id: string; titulo?: string; usada?: string };
  versoes: Versao[]; atividade: Linha[]; etapas: Etapa[]; pasta: string;
  estimativa: { palavras: number; segundos: number }; efetivo: { voz: string; velocidade: number };
}

export interface Voz { id: string; nome: string; descricao: string; idioma: string; genero: string }
export interface Musica { id: string; titulo: string; bpm: number; clima: string; fonte: string; licenca: string; caminho: string | null }
export interface Efeito { nome: string; id: number; pico: number; caminho: string | null }

// ⭐ a senha e' relida a CADA chamada: se o servidor reiniciar e a janela receber /#t=<nova>, ela vale na hora
function senha(): string {
  const m = location.hash.match(/[#&]t=([^&]+)/);
  if (m) { sessionStorage.setItem("edt_t", decodeURIComponent(m[1])); history.replaceState(null, "", "#/"); }
  return sessionStorage.getItem("edt_t") ?? "";
}
senha();

async function chamar<R>(metodo: "GET" | "POST", rota: string, corpo?: unknown): Promise<R> {
  const r = await fetch(rota, {
    method: metodo,
    headers: { "X-EDT-Token": senha(), ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const dado = await r.json().catch(() => ({}));
  if (r.status === 401) throw new Error("A sessão expirou. Feche esta janela e abra o AutoTube de novo.");
  if (!r.ok) throw new Error((dado as any).detail || (dado as any).erro || `erro ${r.status}`);
  return dado as R;
}

export const ler = <R,>(rota: string) => chamar<R>("GET", rota);
export const enviar = <R = { ok: boolean },>(rota: string, corpo: unknown = {}) => chamar<R>("POST", rota, corpo);

export const midia = (caminho: string, v?: string | number) =>
  `/api/midia?caminho=${encodeURIComponent(caminho)}&k=${encodeURIComponent(senha())}${v !== undefined ? `&v=${v}` : ""}`;
export const miniatura = (caminho: string, w = 360, t?: number) =>
  `/api/miniatura?caminho=${encodeURIComponent(caminho)}&w=${w}${t !== undefined ? `&t=${t}` : ""}&k=${encodeURIComponent(senha())}`;
