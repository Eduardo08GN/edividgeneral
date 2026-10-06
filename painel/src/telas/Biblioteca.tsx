import { useEffect, useState } from "react";
import type { Ctx } from "../App";
import { enviar, ler, type Efeito, type Musica } from "../api";
import { Girando, Ouvir } from "../componentes/base";
import { ListaVozes, useVozes } from "../componentes/Vozes";

type Aba = "vozes" | "musicas" | "efeitos";

export function Biblioteca({ ctx }: { ctx: Ctx }) {
  const [aba, setAba] = useState<Aba>("vozes");
  const vozes = useVozes(ctx.avisar);
  const [musicas, setMusicas] = useState<Musica[] | null>(null);
  const [efeitos, setEfeitos] = useState<Efeito[] | null>(null);
  useEffect(() => {
    ler<Musica[]>("/api/musicas").then(setMusicas).catch(() => setMusicas([]));
    ler<Efeito[]>("/api/sfx").then(setEfeitos).catch(() => setEfeitos([]));
  }, []);
  const amostra = async (id: string) => (await enviar<{ caminho: string }>("/api/vozes/amostra", { voz: id, velocidade: 1.0 })).caminho;
  return (
    <div className="tela">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Biblioteca</p>
          <h1>Vozes, trilhas e <em>efeitos</em></h1>
          <p className="lead">Tudo aqui pode ir para qualquer destino: as trilhas e os efeitos são de licença livre para uso comercial (Mixkit), com a origem registrada.</p>
        </div>
      </div>
      <div className="seg" role="tablist">
        {([["vozes", `Vozes${vozes ? ` · ${vozes.length}` : ""}`], ["musicas", `Trilhas${musicas ? ` · ${musicas.length}` : ""}`], ["efeitos", `Efeitos${efeitos ? ` · ${efeitos.length}` : ""}`]] as [Aba, string][]).map(([a, t]) => (
          <button key={a} type="button" role="tab" aria-pressed={aba === a} aria-selected={aba === a} onClick={() => setAba(a)}>{t}</button>
        ))}
      </div>
      {aba === "vozes" && (
        <section className="panel bloco">
          <h3>Vozes da MiniMax <small>a amostra lê uma frase padrão</small></h3>
          <ListaVozes vozes={vozes} amostra={amostra} />
        </section>
      )}
      {aba === "musicas" && (
        <section className="panel bloco">
          <h3>Trilhas livres</h3>
          {!musicas ? <div className="vazio-mini"><Girando /> carregando…</div> : (
            <ul className="musicas">
              {musicas.map((m) => (
                <li key={m.id}>
                  <Ouvir caminho={m.caminho} rotulo={`Ouvir ${m.titulo}`} />
                  <div className="grow"><b>{m.titulo}</b><small>{m.bpm} bpm · {m.clima}</small></div>
                  <span className="tag tag-neutra" title={m.licenca}>{m.fonte} · livre</span>
                  {!m.caminho && <span className="meta">falta baixar: python edt.py musica sync</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {aba === "efeitos" && (
        <section className="panel bloco">
          <h3>Efeitos sonoros <small>Mixkit · uso comercial sem crédito</small></h3>
          {!efeitos ? <div className="vazio-mini"><Girando /> carregando…</div> : (
            <div className="efeitos">
              {efeitos.map((e) => (
                <div key={e.nome} className="efeito"><Ouvir caminho={e.caminho} pequeno rotulo={`Ouvir ${e.nome}`} /><span>{e.nome.replace(/_/g, " ")}</span></div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
