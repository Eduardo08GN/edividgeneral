import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Pause, Play, X } from "lucide-react";
import { midia } from "../api";

export function Girando() { return <span className="spin" aria-hidden />; }

export interface Aviso { texto: string; tom: "ok" | "erro"; id: number }

export function Toast({ aviso, fechar }: { aviso: Aviso | null; fechar: () => void }) {
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(fechar, 6000);
    return () => window.clearTimeout(t);
  }, [aviso, fechar]);
  if (!aviso) return null;
  return (
    <div className={`toast ${aviso.tom === "erro" ? "erro" : ""}`} role={aviso.tom === "erro" ? "alert" : "status"} key={aviso.id}>
      {aviso.tom === "erro" ? <AlertTriangle size={18} aria-hidden /> : <Check size={18} aria-hidden />}
      <p>{aviso.texto}</p>
      <button className="btn btn-quiet btn-icon-sm" onClick={fechar} aria-label="Fechar aviso"><X size={16} /></button>
    </div>
  );
}

// um botao que mostra o girando enquanto a acao roda e avisa o resultado
export function useAcao(avisar: (t: string, tom?: "ok" | "erro") => void) {
  const [rodando, setRodando] = useState<string | null>(null);
  const rodar = async (nome: string, fn: () => Promise<unknown>, ok?: string) => {
    setRodando(nome);
    try { await fn(); if (ok) avisar(ok); }
    catch (x) { avisar((x as Error).message, "erro"); }
    finally { setRodando(null); }
  };
  return { rodando, rodar };
}

// ⭐ um audio so' para a janela inteira: tocar uma amostra para a anterior (ouvir 4 vozes nao vira coral)
const AUDIO = typeof Audio !== "undefined" ? new Audio() : null;
let tocandoAgora = "";
const ouvintes = new Set<() => void>();
AUDIO?.addEventListener("ended", () => { tocandoAgora = ""; ouvintes.forEach((f) => f()); });

export function tocar(caminho: string) {
  if (!AUDIO) return;
  if (tocandoAgora === caminho && !AUDIO.paused) { AUDIO.pause(); tocandoAgora = ""; }
  else { AUDIO.src = midia(caminho, Date.now()); AUDIO.play().catch(() => undefined); tocandoAgora = caminho; }
  ouvintes.forEach((f) => f());
}

export function useTocando(caminho?: string | null) {
  const [, setN] = useState(0);
  useEffect(() => { const f = () => setN((n) => n + 1); ouvintes.add(f); return () => { ouvintes.delete(f); }; }, []);
  return !!caminho && tocandoAgora === caminho;
}

/** Botao redondo de ouvir. `obter` gera o arquivo na hora (ex.: amostra de voz) se ainda nao existir. */
export function Ouvir({ caminho, obter, rotulo = "Ouvir", pequeno }: { caminho?: string | null; obter?: () => Promise<string>; rotulo?: string; pequeno?: boolean }) {
  const [gerando, setGerando] = useState(false);
  const [atual, setAtual] = useState<string | null>(caminho ?? null);
  useEffect(() => { if (caminho) setAtual(caminho); }, [caminho]);
  const tocando = useTocando(atual);
  const clicar = async () => {
    if (atual) { tocar(atual); return; }
    if (!obter) return;
    setGerando(true);
    try { const c = await obter(); setAtual(c); tocar(c); }
    finally { setGerando(false); }
  };
  return (
    <button type="button" className={`ouvir${pequeno ? " pequeno" : ""}${tocando ? " on" : ""}`} onClick={clicar} disabled={gerando}
            aria-label={tocando ? "Pausar" : rotulo} title={tocando ? "Pausar" : rotulo}>
      {gerando ? <Girando /> : tocando ? <Pause size={pequeno ? 12 : 14} /> : <Play size={pequeno ? 12 : 14} />}
    </button>
  );
}

/** Ondinha decorativa que mexe enquanto toca. */
export function Onda({ ativa }: { ativa: boolean }) {
  const ref = useRef([6, 14, 20, 10, 16, 8, 18, 12, 6, 15]);
  return (
    <span className={`onda${ativa ? " ativa" : ""}`} aria-hidden>
      {ref.current.map((h, i) => <i key={i} style={{ height: h, animationDelay: `${i * 70}ms` }} />)}
    </span>
  );
}
