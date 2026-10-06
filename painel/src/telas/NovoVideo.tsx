import { useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Ctx } from "../App";
import { enviar, type Formato } from "../api";
import { useAcao, Girando } from "../componentes/base";
import { link } from "../rota";
import { DESTINOS } from "../textos";

const FORMATOS: { f: Formato; d: string }[] = [{ f: "16:9", d: "YouTube, apresentação" }, { f: "9:16", d: "Reels, TikTok, Shorts" }, { f: "1:1", d: "Feed" }];
const DURACOES = [15, 30, 45, 60, 90];

export function NovoVideo({ ctx }: { ctx: Ctx }) {
  const [nome, setNome] = useState("");
  const [formato, setFormato] = useState<Formato>("16:9");
  const [duracao, setDuracao] = useState(45);
  const [destinos, setDestinos] = useState<string[]>([]);
  const [b, setB] = useState({ o_que: "", publico: "", objetivo: "", tom: "", referencias: "" });
  const [modo, setModo] = useState<"guiado" | "automatico">("guiado");
  const { rodando, rodar } = useAcao(ctx.avisar);
  const criar = () => rodar("criar", async () => {
    const r = await enviar<{ id: string }>("/api/projetos", { nome, formato, duracao_alvo: duracao, destino: destinos.join(" · "), briefing: b, modo });
    await ctx.recarregar();
    location.hash = link.projeto(r.id, "copy");
  });
  const campo = (k: keyof typeof b, rotulo: string, dica: string, linhas = 2) => (
    <label className="campo-bloco">
      <span className="label">{rotulo}</span>
      <textarea className="campo" rows={linhas} placeholder={dica} value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} />
    </label>
  );
  return (
    <div className="tela tela-estreita">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Etapa 01 · Briefing</p>
          <h1>Novo <em>vídeo</em></h1>
          <p className="lead">Conte o que é o vídeo e para quem. Isso guia a copy, a voz e o roteiro.</p>
        </div>
      </div>
      <form className="panel form" onSubmit={(e) => { e.preventDefault(); criar(); }}>
        <label className="campo-bloco">
          <span className="label">Nome do projeto</span>
          <input className="campo campo-grande" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Explicativo da ferramenta" />
        </label>
        <div className="linha-2">
          <div className="campo-bloco">
            <span className="label">Formato</span>
            <div className="opcoes">
              {FORMATOS.map((x) => (
                <button type="button" key={x.f} className={`opcao${formato === x.f ? " on" : ""}`} onClick={() => setFormato(x.f)} aria-pressed={formato === x.f}>
                  <span className={`forma f${x.f.replace(":", "x")}`} aria-hidden /><b>{x.f}</b><small>{x.d}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="campo-bloco">
            <span className="label">Duração alvo</span>
            <div className="filtros">
              {DURACOES.map((d) => <button type="button" key={d} className="filtro" aria-pressed={duracao === d} onClick={() => setDuracao(d)}>{d} s</button>)}
            </div>
            <span className="label" style={{ marginTop: 14 }}>Para onde vai</span>
            <div className="filtros">
              {DESTINOS.map((d) => (
                <button type="button" key={d} className="filtro" aria-pressed={destinos.includes(d)}
                        onClick={() => setDestinos(destinos.includes(d) ? destinos.filter((x) => x !== d) : [...destinos, d])}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        {campo("o_que", "O que é o vídeo", "Ex.: vídeo de vendas da nossa ferramenta de vídeos com IA", 2)}
        <div className="linha-2">
          {campo("publico", "Para quem", "Ex.: quem vende no TikTok Shop, Instagram e Facebook")}
          {campo("objetivo", "Objetivo", "Ex.: mostrar que a ferramenta produz sozinha, em volume")}
        </div>
        <div className="linha-2">
          {campo("tom", "Tom", "Ex.: direto, tech, premium")}
          {campo("referencias", "Referências", "Links, vídeos que você gosta, o que evitar")}
        </div>
        <div className="form-pe">
          <div className="seg" role="group" aria-label="Modo">
            <button type="button" aria-pressed={modo === "guiado"} onClick={() => setModo("guiado")}>Guiado</button>
            <button type="button" aria-pressed={modo === "automatico"} onClick={() => setModo("automatico")}>Automático</button>
          </div>
          <p className="meta">{modo === "guiado" ? "Para em cada escolha para você aprovar." : "Escolhe sozinho e te mostra o vídeo pronto."}</p>
          <button className="btn btn-primary" type="submit" disabled={!nome.trim() || !!rodando}>{rodando ? <Girando /> : null}Criar e escrever a copy<ArrowRight size={18} /></button>
        </div>
      </form>
    </div>
  );
}
