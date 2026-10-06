import { useEffect, useMemo, useState } from "react";
import { Check, Clapperboard, FolderOpen, Mic, Play, Sparkles, Square, Wand2 } from "lucide-react";
import type { Ctx } from "../App";
import { enviar, ler, midia, miniatura, type EtapaId, type Formato, type Musica, type Projeto as TP, type Versao } from "../api";
import { Girando, Onda, Ouvir, useAcao, useTocando } from "../componentes/base";
import { ListaVozes, useVozes } from "../componentes/Vozes";
import { link } from "../rota";
import { DESTINOS, mmss, nomeVoz, quando, tempoRender } from "../textos";

type Props = { ctx: Ctx; p: TP; etapa?: EtapaId };

export function Projeto({ ctx, p, etapa }: Props) {
  const prod = ctx.estado.produtor;
  const aqui = prod.rodando && prod.projeto === p.id;
  const outro = prod.rodando && prod.projeto !== p.id;
  const ultima = p.versoes.at(-1);
  const aba: EtapaId = etapa ?? (ultima ? "producao" : (p.etapas.find((e) => !e.ok && e.id !== "material")?.id ?? "producao"));
  const { rodando, rodar } = useAcao(ctx.avisar);
  const salvar = (campos: Partial<TP> | Record<string, unknown>, ok?: string) =>
    rodar("salvar", async () => { await enviar(`/api/projetos/${p.id}`, campos); await ctx.recarregar(); }, ok);
  const produzir = (tarefa: "narrar" | "previa" | "final" | "tudo") =>
    rodar(tarefa, async () => { await enviar(`/api/projetos/${p.id}/produzir`, { tarefa }); await ctx.recarregar(); });
  const status = aqui ? `${prod.etapa}…` : ultima ? `v${ultima.n} pronta` : p.copy ? "em preparo" : "rascunho";
  const semCopy = !p.copy.trim();
  const ctxP = { ctx, p, salvar, produzir, rodando, aqui, outro };
  return (
    <div className="tela tela-projeto">
      <div className="tela-topo">
        <div>
          <p className="eyebrow">Projeto · {p.formato} · {p.duracao_alvo} s{p.destino ? ` · ${p.destino}` : ""}</p>
          <h1>{p.nome} · <em>{status}</em></h1>
        </div>
        <div className="topo-acoes">
          <div className="seg" role="group" aria-label="Modo">
            <button type="button" aria-pressed={p.modo === "guiado"} onClick={() => salvar({ modo: "guiado" })}>Guiado</button>
            <button type="button" aria-pressed={p.modo === "automatico"} onClick={() => salvar({ modo: "automatico" })}>Automático</button>
          </div>
          <button className="btn btn-ghost" onClick={() => rodar("pasta", () => enviar("/api/abrir-pasta", { caminho: p.pasta }))}><FolderOpen size={17} />Abrir pasta</button>
          {p.modo === "automatico" ? (
            <button className="btn btn-primary" disabled={semCopy || prod.rodando || !!rodando} onClick={() => produzir("tudo")}
                    title={semCopy ? "Escreva a copy primeiro" : ""}><Wand2 size={17} />Produzir tudo</button>
          ) : (
            <button className="btn btn-primary" disabled={semCopy || prod.rodando || !!rodando} onClick={() => produzir("final")}
                    title={semCopy ? "Escreva a copy primeiro" : ""}><Sparkles size={17} />Nova versão</button>
          )}
        </div>
      </div>

      {aqui && (
        <div className="panel produzindo" role="status">
          <span className="live" aria-hidden />
          <div><b>{prod.etapa === "narrando" ? "Narrando com a MiniMax" : `Renderizando: ${prod.etapa}`}</b>
            <p className="meta">{mmss(prod.segundos)} decorridos · {Math.round(prod.progresso * 100)}%</p></div>
          <div className="bar grow"><span style={{ width: `${Math.max(3, prod.progresso * 100)}%` }} /></div>
          <button className="btn btn-stop btn-sm" onClick={() => rodar("parar", () => enviar("/api/parar"))}><Square size={14} />Parar</button>
        </div>
      )}
      {outro && <p className="meta aviso-linha">Outro projeto está produzindo agora; este fica na espera para render.</p>}

      <nav className="etapas" aria-label="Etapas do projeto">
        {p.etapas.map((e, i) => (
          <a key={e.id} href={link.projeto(p.id, e.id)} className={`panel etapa${aba === e.id ? " atual" : ""}`} aria-current={aba === e.id ? "step" : undefined}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            {e.ok && <span className="ok"><Check size={11} strokeWidth={3} /></span>}
            <b>{e.nome}</b><p>{e.resumo}</p>
          </a>
        ))}
      </nav>

      <div className="proj-grade">
        <div className="principal">
          {aba === "briefing" && <EtapaBriefing {...ctxP} />}
          {aba === "copy" && <EtapaCopy {...ctxP} />}
          {aba === "voz" && <EtapaVoz {...ctxP} />}
          {aba === "material" && <EtapaMaterial {...ctxP} />}
          {aba === "roteiro" && <EtapaRoteiro {...ctxP} />}
          {aba === "producao" && <EtapaProducao {...ctxP} />}
        </div>
        <Lado p={p} />
      </div>
    </div>
  );
}

type P2 = { ctx: Ctx; p: TP; salvar: (c: Record<string, unknown>, ok?: string) => Promise<void>; produzir: (t: "narrar" | "previa" | "final" | "tudo") => Promise<void>;
            rodando: string | null; aqui: boolean; outro: boolean };

/* ───────── 1. Briefing ───────── */
function EtapaBriefing({ p, salvar, rodando }: P2) {
  const [b, setB] = useState(p.briefing);
  const [nome, setNome] = useState(p.nome);
  const [formato, setFormato] = useState<Formato>(p.formato);
  const [dur, setDur] = useState(p.duracao_alvo);
  const [destino, setDestino] = useState(p.destino);
  const mudou = JSON.stringify([b, nome, formato, dur, destino]) !== JSON.stringify([p.briefing, p.nome, p.formato, p.duracao_alvo, p.destino]);
  const campo = (k: keyof typeof b, rotulo: string, linhas = 2) => (
    <label className="campo-bloco"><span className="label">{rotulo}</span>
      <textarea className="campo" rows={linhas} value={b[k] ?? ""} onChange={(e) => setB({ ...b, [k]: e.target.value })} /></label>
  );
  return (
    <section className="panel bloco">
      <h3>Briefing</h3>
      <div className="linha-2">
        <label className="campo-bloco"><span className="label">Nome</span><input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
        <div className="campo-bloco"><span className="label">Formato e duração</span>
          <div className="filtros">
            {(["16:9", "9:16", "1:1"] as Formato[]).map((f) => <button key={f} type="button" className="filtro" aria-pressed={formato === f} onClick={() => setFormato(f)}>{f}</button>)}
            <input className="campo campo-num" type="number" min={5} max={600} value={dur} onChange={(e) => setDur(Number(e.target.value))} aria-label="Duração alvo em segundos" /><span className="meta">s</span>
          </div></div>
      </div>
      <div className="campo-bloco"><span className="label">Para onde vai</span>
        <div className="filtros">{DESTINOS.map((d) => {
          const on = destino.split(" · ").includes(d);
          return <button key={d} type="button" className="filtro" aria-pressed={on}
                         onClick={() => setDestino((on ? destino.split(" · ").filter((x) => x !== d) : [...destino.split(" · ").filter(Boolean), d]).join(" · "))}>{d}</button>;
        })}</div></div>
      {campo("o_que", "O que é o vídeo")}
      <div className="linha-2">{campo("publico", "Para quem")}{campo("objetivo", "Objetivo")}</div>
      <div className="linha-2">{campo("tom", "Tom")}{campo("referencias", "Referências")}</div>
      <div className="bloco-pe">
        <button className="btn btn-primary" disabled={!mudou || !!rodando}
                onClick={() => salvar({ briefing: b, nome, formato, duracao_alvo: dur, destino }, "Briefing salvo")}>Salvar briefing</button>
        <a className="btn btn-ghost" href={link.projeto(p.id, "copy")}>Ir para a copy</a>
      </div>
    </section>
  );
}

/* ───────── 2. Copy ───────── */
function EtapaCopy({ p, salvar, rodando, aqui }: P2) {
  const [texto, setTexto] = useState(p.copy);
  useEffect(() => setTexto(p.copy), [p.copy]);
  const palavras = texto.split(/\s+/).filter(Boolean).length;
  const est = Math.round(palavras / 2.7);
  const fora = p.duracao_alvo && Math.abs(est - p.duracao_alvo) > Math.max(5, p.duracao_alvo * 0.2);
  return (
    <>
      <section className="panel bloco">
        <h3>Copy falada <small>{palavras} palavras · ~{est} s{p.duracao_alvo ? ` · alvo ${p.duracao_alvo} s` : ""}</small></h3>
        {p.copy_origem && <p className="meta">Origem: {p.copy_origem}</p>}
        <textarea className="campo copy-editor" rows={9} value={texto} onChange={(e) => setTexto(e.target.value)} disabled={aqui}
                  placeholder="O texto que a voz vai falar, exatamente como deve ser dito. A copy é sagrada: vai literal para a voz e para a tela." />
        {fora ? <p className="meta aviso-linha">A duração estimada está longe do alvo de {p.duracao_alvo} s.</p> : null}
        <div className="bloco-pe">
          <button className="btn btn-primary" disabled={texto.trim() === p.copy.trim() || !!rodando || aqui} onClick={() => salvar({ copy: texto }, "Copy salva")}>Salvar copy</button>
          <a className="btn btn-ghost" href={link.projeto(p.id, "voz")}>Escolher a voz</a>
          <span className="meta empurra"><Sparkles size={13} /> Gerar 10 opções com o Claude chega na fase 3</span>
        </div>
      </section>
      {p.copys.length > 0 && (
        <section className="bloco">
          <h3 className="h-fora">{p.copys.length} opções de copy</h3>
          <div className="opcoes-copy">
            {p.copys.map((c, i) => {
              const usada = c.texto.trim() === texto.trim();
              return (
                <article key={i} className={`panel opcao-copy${usada ? " on" : ""}`}>
                  <span className="label">{String(i + 1).padStart(2, "0")} · {c.angulo}</span>
                  <p>{c.texto}</p>
                  <button className="btn btn-quiet btn-sm" onClick={() => setTexto(c.texto)} disabled={aqui}>{usada ? "No editor" : "Usar esta"}</button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

/* ───────── 3. Voz ───────── */
function EtapaVoz({ ctx, p, salvar, produzir, rodando, aqui }: P2) {
  const vozes = useVozes(ctx.avisar);
  const [vel, setVel] = useState(p.voz.velocidade ?? 1.0);
  useEffect(() => setVel(p.voz.velocidade ?? 1.0), [p.voz.velocidade]);
  const amostras = useMemo(() => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(p.amostras)) { const [id, vv] = k.split("|"); if (Math.abs(Number(vv) - vel) < 0.001) o[id] = v; }
    return o;
  }, [p.amostras, vel]);
  const amostra = async (id: string) => {
    const r = await enviar<{ caminho: string }>(`/api/projetos/${p.id}/amostra`, { voz: id, velocidade: vel });
    ctx.recarregar(); return r.caminho;
  };
  return (
    <>
      <section className="panel bloco">
        <h3>Voz <small>{p.voz.id ? `${p.voz.nome ?? nomeVoz(p.voz.id)} · ${(p.voz.velocidade ?? 1).toFixed(2)}×` : "ainda não escolhida"}</small></h3>
        <p className="meta">As amostras leem o começo da sua copy. Ouça, compare e escolha pelo ouvido.</p>
        <div className="vel">
          <span className="label">Velocidade</span>
          <input type="range" min={0.85} max={1.2} step={0.05} value={vel} onChange={(e) => setVel(Number(e.target.value))} aria-label="Velocidade da voz" />
          <b>{vel.toFixed(2)}×</b>
          {p.voz.id && vel !== (p.voz.velocidade ?? 1) && <button className="btn btn-ghost btn-sm" onClick={() => salvar({ voz: { velocidade: vel } }, "Velocidade salva")}>Salvar velocidade</button>}
        </div>
        <ListaVozes vozes={vozes} escolhida={p.voz.id} amostras={amostras} amostra={amostra}
                    escolher={(v) => salvar({ voz: { id: v.id, nome: v.nome, velocidade: vel } }, `Voz escolhida: ${v.nome}`)} />
      </section>
      <section className="panel bloco narracao">
        <Mic size={20} aria-hidden />
        <div className="grow"><b>Narração</b>
          <p className="meta">{p.narracao?.ok ? `${p.narracao.duracao.toFixed(1)} s · ${p.narracao.palavras} palavras · ${Math.round(p.narracao.casamento * 100)}% da copy` :
            p.narracao ? "a copy ou a voz mudou: narre de novo" : "ainda não narrada (a produção narra sozinha se precisar)"}</p></div>
        {p.narracao?.ok && <Ouvir caminho={p.narracao.arquivo} rotulo="Ouvir a narração" />}
        <button className="btn btn-ghost" disabled={!p.copy.trim() || !p.voz.id || !!rodando || aqui || ctx.estado.produtor.rodando} onClick={() => produzir("narrar")}>
          {aqui && ctx.estado.produtor.etapa === "narrando" ? <Girando /> : <Mic size={16} />}{p.narracao?.ok ? "Narrar de novo" : "Narrar agora"}</button>
      </section>
    </>
  );
}

/* ───────── 4. Material ───────── */
function EtapaMaterial({ p }: P2) {
  const grupos: Record<string, string> = { janela: "Janelas gravadas", site: "Sites capturados", video: "Vídeos", imagem: "Imagens" };
  const por = p.material.reduce<Record<string, typeof p.material>>((a, m) => { (a[m.tipo] ||= []).push(m); return a; }, {});
  return (
    <section className="panel bloco">
      <h3>Material <small>{p.material.length} itens</small></h3>
      <p className="meta">Gravar uma janela (só filmando, sem clicar), capturar um site escondendo marcas e baixar vídeos de uma página chegam na fase 2.</p>
      {p.material.length === 0 ? <div className="vazio-mini">Nenhum material. A legenda cinética não precisa de material.</div> :
        Object.entries(por).map(([tipo, itens]) => (
          <div key={tipo} className="mat-grupo">
            <span className="label">{grupos[tipo] ?? tipo} · {itens.length}</span>
            <div className={`mat-grade${tipo === "video" ? " vert" : ""}`}>
              {itens.map((m) => (
                <a key={m.arquivo} className="mat-item" href={midia(m.caminho)} target="_blank" rel="noreferrer" title={m.titulo}>
                  <img src={miniatura(m.caminho, 480, tipo === "janela" ? 100 : undefined)} alt="" loading="lazy" />
                  <span>{m.titulo}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
}

/* ───────── 5. Roteiro ───────── */
function EtapaRoteiro({ ctx, p, salvar, aqui }: P2) {
  const [musicas, setMusicas] = useState<Musica[] | null>(null);
  useEffect(() => { ler<Musica[]>("/api/musicas").then(setMusicas).catch(() => setMusicas([])); }, []);
  const modelos = [
    { id: "legenda", nome: "Legenda cinética", desc: "A narração vira tipografia em movimento, frase a frase, com trilha e efeitos. Serve para qualquer copy, em qualquer formato.", ok: true },
    { id: "proprio", nome: "Cenas próprias", desc: "Motion graphics escritos para este vídeo, cena a cena, no tempo da fala (como o explicativo da ferramenta).", ok: p.tem_cenas },
  ];
  const total = p.roteiro.cenas?.at(-1)?.ate ?? 0;
  return (
    <>
      <section className="panel bloco">
        <h3>Roteiro visual</h3>
        <div className="modelos">
          {modelos.map((m) => (
            <button key={m.id} type="button" className={`panel modelo${p.roteiro.modelo === m.id ? " on" : ""}`} disabled={!m.ok || aqui}
                    onClick={() => salvar({ roteiro: { modelo: m.id } })} aria-pressed={p.roteiro.modelo === m.id}>
              <b>{m.nome}</b><p>{m.desc}</p>
              {!m.ok && <span className="meta">Este projeto ainda não tem cenas próprias (o Claude escreve na fase 4).</span>}
            </button>
          ))}
        </div>
        {p.roteiro.modelo === "proprio" && p.roteiro.cenas && (
          <div className="cenas-lista">
            <span className="label">{p.roteiro.cenas.length} cenas · {mmss(total)}</span>
            <div className="linha-tempo">
              {p.roteiro.cenas.map((c, i) => (
                <div key={i} className="cena-bloco" style={{ flex: c.ate - c.de }} title={`${c.nome} · ${mmss(c.de)}–${mmss(c.ate)}`}>
                  <b>{c.nome}</b><small>{mmss(c.de)}</small>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
      <section className="panel bloco">
        <h3>Trilha <small>biblioteca livre · uso comercial</small></h3>
        {!musicas ? <div className="vazio-mini"><Girando /> carregando…</div> : (
          <ul className="musicas">
            <li className={p.musica?.id === "auto" ? "on" : ""}>
              <span className="ouvir-vazio" /><div className="grow"><b>Automática</b><small>a primeira faixa disponível, cortada na batida</small></div>
              {p.musica?.id === "auto" ? <span className="tag tag-ok"><Check size={13} />Escolhida</span> : <button className="btn btn-ghost btn-sm" disabled={aqui} onClick={() => salvar({ musica: { id: "auto" } })}>Escolher</button>}
            </li>
            {musicas.map((m) => (
              <li key={m.id} className={p.musica?.id === m.id ? "on" : ""}>
                <Ouvir caminho={m.caminho} rotulo={`Ouvir ${m.titulo}`} />
                <div className="grow"><b>{m.titulo}</b><small>{m.bpm} bpm · {m.clima} · {m.fonte}</small></div>
                {p.musica?.id === m.id ? <span className="tag tag-ok"><Check size={13} />Escolhida</span> :
                  <button className="btn btn-ghost btn-sm" disabled={aqui || !m.caminho} onClick={() => salvar({ musica: { id: m.id, titulo: m.titulo } }, `Trilha: ${m.titulo}`)}>Escolher</button>}
              </li>
            ))}
            <li className={p.musica?.id === "nenhuma" ? "on" : ""}>
              <span className="ouvir-vazio" /><div className="grow"><b>Sem música</b><small>só a narração e os efeitos</small></div>
              {p.musica?.id === "nenhuma" ? <span className="tag tag-ok"><Check size={13} />Escolhida</span> : <button className="btn btn-ghost btn-sm" disabled={aqui} onClick={() => salvar({ musica: { id: "nenhuma" } })}>Escolher</button>}
            </li>
          </ul>
        )}
        {p.roteiro.modelo === "proprio" && <p className="meta">Nas cenas próprias a trilha já está montada na edição (“{p.musica?.titulo ?? "—"}”).</p>}
        <span className="meta">{ctx.estado.conexoes.motor ? "" : "Falta o Node.js para renderizar."}</span>
      </section>
    </>
  );
}

/* ───────── 6. Producao ───────── */
function EtapaProducao({ ctx, p, produzir, rodando }: P2) {
  const [sel, setSel] = useState<number | null>(null);
  const vs = p.versoes;
  const v: Versao | undefined = vs.find((x) => x.n === sel) ?? vs.at(-1);
  const bloqueado = !p.copy.trim() || ctx.estado.produtor.rodando || !!rodando;
  const vertical = p.formato === "9:16";
  return (
    <>
      <section className="panel bloco player">
        {v ? (
          <>
            <div className={`tela-video${vertical ? " vertical" : p.formato === "1:1" ? " quadrado" : ""}`}>
              <video key={v.caminho} src={midia(v.caminho, v.criado)} controls playsInline poster={miniatura(v.caminho, 1280, Math.min(3, v.duracao / 3))} />
            </div>
            <div className="linha-meta">
              <span className="label">v{v.n} · {v.tipo} · {quando(v.criado)}</span>
              <span className="meta">{mmss(v.duracao)}<b>/</b>{v.lufs ?? "—"} LUFS<b>/</b>render {tempoRender(v.render_s)}</span>
            </div>
            {p.roteiro.modelo === "proprio" && p.roteiro.cenas && (
              <div className="marcas-cenas">
                {p.roteiro.cenas.map((c, i) => <span key={i} style={{ flex: c.ate - c.de }} title={c.nome}>{c.nome}</span>)}
              </div>
            )}
          </>
        ) : (
          <div className="sem-versao"><Clapperboard size={30} /><b>Nenhuma versão ainda</b>
            <p className="meta">Faça uma prévia rápida (meia resolução) para conferir, e depois a versão final.</p></div>
        )}
        <div className="bloco-pe">
          <button className="btn btn-ghost" disabled={bloqueado} onClick={() => produzir("previa")}><Play size={16} />Prévia rápida</button>
          <button className="btn btn-primary" disabled={bloqueado} onClick={() => produzir("final")}><Sparkles size={16} />Versão final</button>
          <span className="meta empurra">Pedir ajustes ao Claude (“troque a música”, “cena 6 mais longa”) chega na fase 3</span>
        </div>
      </section>
      {v?.folha && (
        <section className="panel bloco">
          <h3>Leitura quadro a quadro <small>1 quadro por segundo</small></h3>
          <img className="folha" src={midia(v.folha, v.criado)} alt={`Folha de contato da v${v.n}`} loading="lazy" />
        </section>
      )}
      {vs.length > 1 && (
        <section className="panel bloco">
          <h3>Versões</h3>
          <ul className="versoes">
            {[...vs].reverse().map((x) => (
              <li key={x.n} className={x.n === v?.n ? "on" : ""}>
                <button type="button" onClick={() => setSel(x.n)}>
                  <img src={miniatura(x.caminho, 240, Math.min(3, x.duracao / 3))} alt="" loading="lazy" />
                  <span><b>v{x.n} · {x.tipo}</b><small>{quando(x.criado)} · {mmss(x.duracao)}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ───────── coluna da direita ───────── */
function Lado({ p }: { p: TP }) {
  const narrando = useTocando(p.narracao?.arquivo);
  return (
    <aside className="lado">
      <section className="panel cx">
        <h3>Copy e voz <small>{p.narracao?.ok ? `${p.narracao.duracao.toFixed(1)} S · ${p.narracao.palavras} PALAVRAS` : `~${p.estimativa.segundos} S`}</small></h3>
        <p className="copy-resumo">{p.copy || "Sem copy ainda."}</p>
        <div className="voz-chip">
          {p.narracao?.ok ? <Ouvir caminho={p.narracao.arquivo} rotulo="Ouvir a narração" /> : <span className="ouvir-vazio" />}
          <div><b>{p.voz.nome ?? nomeVoz(p.efetivo.voz)}</b><small>MINIMAX · {p.efetivo.velocidade.toFixed(1)}×{p.voz.id ? "" : " · padrão"}</small></div>
          <Onda ativa={narrando} />
        </div>
      </section>
      <section className="panel cx">
        <h3>Material <small>{p.material.length} ITENS</small></h3>
        {p.material.length === 0 ? <p className="meta">Nenhum ainda.</p> : (
          <div className="mat-mini">
            {p.material.slice(0, 6).map((m) => <img key={m.arquivo} src={miniatura(m.caminho, 240, m.tipo === "janela" ? 100 : undefined)} alt="" title={m.titulo} loading="lazy" />)}
          </div>
        )}
      </section>
      <section className="panel cx">
        <h3>Agora há pouco</h3>
        <ul className="feed">
          {p.atividade.slice(0, 9).map((l, i) => (
            <li key={i}><time>{l.hora}</time><span className={`p${l.texto.startsWith("⚠") ? " erro" : ""}`} aria-hidden /><span>{l.texto}</span></li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
