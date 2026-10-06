import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { ler, type Voz } from "../api";
import { IDIOMA } from "../textos";
import { Girando, Ouvir } from "./base";

let CACHE: Voz[] | null = null;

export function useVozes(avisar: (t: string, tom?: "ok" | "erro") => void) {
  const [vozes, setVozes] = useState<Voz[] | null>(CACHE);
  useEffect(() => {
    if (CACHE) return;
    ler<Voz[]>("/api/vozes").then((v) => { CACHE = v; setVozes(v); }).catch((x) => avisar((x as Error).message, "erro"));
  }, [avisar]);
  return vozes;
}

export function ListaVozes({ vozes, escolhida, amostra, escolher, amostras = {} }: {
  vozes: Voz[] | null; escolhida?: string; amostra: (id: string) => Promise<string>;
  escolher?: (v: Voz) => void; amostras?: Record<string, string>;
}) {
  const [idioma, setIdioma] = useState("Portuguese");
  const [genero, setGenero] = useState("");
  const [busca, setBusca] = useState("");
  const idiomas = useMemo(() => {
    const n: Record<string, number> = {};
    (vozes ?? []).forEach((v) => { if (IDIOMA[v.idioma]) n[v.idioma] = (n[v.idioma] ?? 0) + 1; });
    return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [vozes]);
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (vozes ?? [])
      .filter((v) => (!idioma || v.idioma === idioma) && (!genero || v.genero === genero) && (!q || (v.nome + " " + v.descricao).toLowerCase().includes(q)))
      .sort((a, b) => Number(b.id === escolhida) - Number(a.id === escolhida) || Number(!!amostras[b.id]) - Number(!!amostras[a.id]));
  }, [vozes, idioma, genero, busca, escolhida, amostras]);
  if (!vozes) return <div className="vazio-mini"><Girando /> Buscando as vozes da MiniMax…</div>;
  return (
    <div className="vozes">
      <div className="vozes-filtros">
        <div className="filtros">
          {idiomas.map((i) => <button key={i} type="button" className="filtro" aria-pressed={idioma === i} onClick={() => setIdioma(i)}>{IDIOMA[i]}</button>)}
        </div>
        <div className="filtros">
          {[["", "Todas"], ["masculina", "Masculinas"], ["feminina", "Femininas"]].map(([g, t]) => (
            <button key={g} type="button" className="filtro" aria-pressed={genero === g} onClick={() => setGenero(g)}>{t}</button>
          ))}
          <label className="busca"><Search size={15} aria-hidden /><input placeholder="Buscar voz" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
        </div>
      </div>
      <ul className="vozes-lista">
        {lista.map((v) => (
          <li key={v.id} className={v.id === escolhida ? "on" : ""}>
            <Ouvir caminho={amostras[v.id]} obter={() => amostra(v.id)} rotulo={`Ouvir ${v.nome}`} />
            <div className="voz-txt"><b>{v.nome}</b><small>{v.descricao}</small></div>
            {v.genero && <span className="tag tag-neutra">{v.genero}</span>}
            {escolher && (v.id === escolhida ? <span className="tag tag-ok"><Check size={13} />Escolhida</span> :
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => escolher(v)}>Escolher</button>)}
          </li>
        ))}
        {lista.length === 0 && <li className="vazio-mini">Nenhuma voz com esse filtro.</li>}
      </ul>
    </div>
  );
}
