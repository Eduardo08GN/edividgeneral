import { Plus } from "lucide-react";
import type { Ctx } from "../App";
import { miniatura } from "../api";
import { link } from "../rota";
import { quando } from "../textos";

const ETAPAS = ["Briefing", "Copy", "Voz", "Material", "Roteiro", "Produção"];

export function Projetos({ ctx }: { ctx: Ctx }) {
  const { projetos, produtor } = ctx.estado;
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">AutoTube · {projetos.length} {projetos.length === 1 ? "projeto" : "projetos"}</p>
          <h1>Seus <em>vídeos</em></h1>
          <p className="lead">Cada projeto passa por 6 etapas: briefing, copy, voz, material, roteiro e produção. Você aprova o que quiser no caminho.</p>
        </div>
        <a className="btn btn-primary" href={link.novo}><Plus size={18} />Novo vídeo</a>
      </div>
      {projetos.length === 0 ? (
        <div className="panel vazio"><h2>Nenhum vídeo ainda</h2><p>Comece pelo briefing: o que é o vídeo e para quem.</p>
          <a className="btn btn-primary" href={link.novo}><Plus size={18} />Novo vídeo</a></div>
      ) : (
        <div className="proj-lista">
          {projetos.map((p) => {
            const aqui = produtor.rodando && produtor.projeto === p.id;
            const feitas = p.etapas.filter(Boolean).length;
            return (
              <a key={p.id} className="panel proj-card" href={link.projeto(p.id)}>
                <div className={`proj-capa f${p.formato.replace(":", "x")}`}>
                  {p.video ? <img src={miniatura(p.video, 640, p.capa_t ?? undefined)} alt="" loading="lazy" /> : <div className="capa-vazia">{p.nome}</div>}
                  <span className="tag tag-neutra canto-sup">{p.formato}</span>
                  {aqui ? <span className="tag tag-run canto-inf"><span className="dot" />{produtor.etapa} · {Math.round(produtor.progresso * 100)}%</span>
                    : p.versao ? <span className="tag tag-ok canto-inf">v{p.versao}</span> : null}
                </div>
                <div className="proj-corpo">
                  <b>{p.nome}</b>
                  <p className="meta">{p.destino || "sem destino definido"}<b>/</b>{quando(p.atualizado)}</p>
                  <div className="trilho-etapas" aria-label={`${feitas} de 6 etapas prontas`}>
                    {p.etapas.map((ok, i) => <span key={i} className={ok ? "ok" : ""} title={ETAPAS[i]} />)}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
