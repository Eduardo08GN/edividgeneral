import { useEffect, useState } from "react";
import type { Ctx } from "../App";
import { enviar, ler } from "../api";
import { Girando, useAcao } from "../componentes/base";
import { useVozes } from "../componentes/Vozes";
import { nomeVoz } from "../textos";

interface Aj {
  tts: { voz: string; velocidade: number; modelo: string };
  render: { concorrencia: number; crf: number; escala_previa: number };
  audio: { lufs: number; musica_vol: number; sfx: boolean };
  pastas: { projetos: string };
}

export function Ajustes({ ctx }: { ctx: Ctx }) {
  const [aj, setAj] = useState<Aj | null>(null);
  const vozes = useVozes(ctx.avisar);
  const { rodando, rodar } = useAcao(ctx.avisar);
  useEffect(() => { ler<Aj>("/api/ajustes").then(setAj).catch((x) => ctx.avisar((x as Error).message, "erro")); }, [ctx]);
  if (!aj) return <div className="tela"><div className="panel vazio"><Girando /></div></div>;
  const salvar = (novo: Partial<Aj>) => rodar("aj", async () => { setAj(await enviar<Aj>("/api/ajustes", novo)); await ctx.recarregar(); }, "Ajustes salvos");
  const pt = (vozes ?? []).filter((v) => v.idioma === "Portuguese");
  const c = ctx.estado.conexoes;
  return (
    <div className="tela tela-estreita">
      <div className="tela-topo"><div>
        <p className="eyebrow">Ajustes</p><h1>Padrões do <em>AutoTube</em></h1>
        <p className="lead">Valem para todo projeto novo. Cada projeto pode mudar a voz e a trilha nas próprias etapas.</p>
      </div>{rodando && <Girando />}</div>

      <section className="panel bloco">
        <h3>Voz padrão</h3>
        <div className="linha-2">
          <label className="campo-bloco"><span className="label">Voz</span>
            <select className="campo" value={aj.tts.voz} onChange={(e) => salvar({ tts: { ...aj.tts, voz: e.target.value } })}>
              {!pt.some((v) => v.id === aj.tts.voz) && <option value={aj.tts.voz}>{nomeVoz(aj.tts.voz)}</option>}
              {pt.map((v) => <option key={v.id} value={v.id}>{v.nome}{v.genero ? ` · ${v.genero}` : ""}</option>)}
            </select></label>
          <label className="campo-bloco"><span className="label">Velocidade · {aj.tts.velocidade.toFixed(2)}×</span>
            <input type="range" min={0.85} max={1.2} step={0.05} value={aj.tts.velocidade}
                   onChange={(e) => setAj({ ...aj, tts: { ...aj.tts, velocidade: Number(e.target.value) } })}
                   onMouseUp={() => salvar({ tts: aj.tts })} onKeyUp={() => salvar({ tts: aj.tts })} /></label>
        </div>
      </section>

      <section className="panel bloco">
        <h3>Render</h3>
        <div className="linha-2">
          <div className="campo-bloco"><span className="label">Abas de render ao mesmo tempo</span>
            <div className="filtros">{[4, 6, 8].map((n) => (
              <button key={n} type="button" className="filtro" aria-pressed={aj.render.concorrencia === n} onClick={() => salvar({ render: { ...aj.render, concorrencia: n } })}>{n}</button>
            ))}</div>
            <p className="meta">6 é o equilíbrio nesta máquina: ela divide a CPU com as outras ferramentas.</p></div>
          <div className="campo-bloco"><span className="label">Volume da trilha sob a voz · {Math.round(aj.audio.musica_vol * 100)}%</span>
            <input type="range" min={0.05} max={0.5} step={0.01} value={aj.audio.musica_vol}
                   onChange={(e) => setAj({ ...aj, audio: { ...aj.audio, musica_vol: Number(e.target.value) } })}
                   onMouseUp={() => salvar({ audio: aj.audio })} onKeyUp={() => salvar({ audio: aj.audio })} />
            <p className="meta">O áudio final sai sempre em {aj.audio.lufs} LUFS (padrão das redes).</p></div>
        </div>
      </section>

      <section className="panel bloco">
        <h3>Conexões e pastas</h3>
        <ul className="conexoes">
          <li className={c.minimax ? "on" : ""}><span className="dot" />MiniMax (voz) · {c.minimax ? "chave encontrada no .env" : "falta MINIMAX_API_KEY no .env"}</li>
          <li className={c.motor ? "on" : ""}><span className="dot" />Motor de vídeo (Remotion/Node) · {c.motor ? "pronto" : "instale o Node.js"}</li>
          <li className={c.claude ? "on" : ""}><span className="dot" />Claude · {c.claude ? "encontrado (copys e roteiro nas fases 3 e 4)" : "não encontrado"}</li>
        </ul>
        <p className="meta">Projetos em <code>{aj.pastas.projetos}</code></p>
      </section>
    </div>
  );
}
