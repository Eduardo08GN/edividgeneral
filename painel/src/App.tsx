import { useCallback, useEffect, useRef, useState } from "react";
import { ler, type Estado, type Projeto as TProjeto } from "./api";
import { useRota } from "./rota";
import { Lateral } from "./componentes/Lateral";
import { Toast, type Aviso } from "./componentes/base";
import { Projetos } from "./telas/Projetos";
import { NovoVideo } from "./telas/NovoVideo";
import { Projeto } from "./telas/Projeto";
import { Biblioteca } from "./telas/Biblioteca";
import { Ajustes } from "./telas/Ajustes";

export interface Ctx {
  estado: Estado;
  recarregar: () => Promise<void>;
  avisar: (texto: string, tom?: "ok" | "erro") => void;
}

// ⭐ o painel le' o servidor de tempos em tempos: rapido enquanto produz, devagar parado
function useServidor(idAberto?: string) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [proj, setProj] = useState<TProjeto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const vivo = useRef(true);
  const puxar = useCallback(async () => {
    try {
      const e = await ler<Estado>("/api/estado");
      if (!vivo.current) return;
      setEstado(e); setErro(null);
      if (idAberto) setProj(await ler<TProjeto>(`/api/projetos/${encodeURIComponent(idAberto)}`));
    } catch (x) { if (vivo.current) setErro((x as Error).message); }
  }, [idAberto]);
  useEffect(() => {
    vivo.current = true; setProj(null); puxar();
    return () => { vivo.current = false; };
  }, [puxar]);
  const rodando = estado?.produtor.rodando;
  useEffect(() => {
    const t = window.setInterval(puxar, rodando ? 1200 : 4000);
    return () => window.clearInterval(t);
  }, [puxar, rodando]);
  return { estado, proj, erro, puxar };
}

export function App() {
  const rota = useRota();
  const { estado, proj, erro, puxar } = useServidor(rota.tela === "projeto" ? rota.id : undefined);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const avisar = useCallback((texto: string, tom: "ok" | "erro" = "ok") => setAviso({ texto, tom, id: Date.now() }), []);

  if (!estado) {
    return (
      <div className="tela"><div className="panel vazio">
        <h2>{erro ? "Não consegui falar com o AutoTube" : "Abrindo…"}</h2>
        {erro && <p>Feche esta janela e abra de novo pelo atalho AutoTube. ({erro})</p>}
      </div></div>
    );
  }
  const ctx: Ctx = { estado, recarregar: puxar, avisar };
  return (
    <div className="app">
      <Lateral ctx={ctx} rota={rota} />
      <main>
        {rota.tela === "projetos" && <Projetos ctx={ctx} />}
        {rota.tela === "novo" && <NovoVideo ctx={ctx} />}
        {rota.tela === "projeto" && (proj && proj.id === rota.id ? <Projeto ctx={ctx} p={proj} etapa={rota.etapa} /> :
          <div className="tela"><div className="panel vazio"><h2>{erro ? "Projeto não encontrado" : "Abrindo o projeto…"}</h2></div></div>)}
        {rota.tela === "biblioteca" && <Biblioteca ctx={ctx} />}
        {rota.tela === "ajustes" && <Ajustes ctx={ctx} />}
      </main>
      <Toast aviso={aviso} fechar={() => setAviso(null)} />
    </div>
  );
}
