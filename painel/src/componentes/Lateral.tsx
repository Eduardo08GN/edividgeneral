import { Clapperboard, FolderOpen, Plus, SlidersHorizontal } from "lucide-react";
import type { Ctx } from "../App";
import { link, type Rota } from "../rota";

export function Lateral({ ctx, rota }: { ctx: Ctx; rota: Rota }) {
  const { estado } = ctx;
  const prod = estado.produtor;
  const itens = [
    { href: link.projetos, tela: "projetos", icone: <Clapperboard size={18} />, texto: "Projetos" },
    { href: link.novo, tela: "novo", icone: <Plus size={18} />, texto: "Novo vídeo" },
    { href: link.biblioteca, tela: "biblioteca", icone: <FolderOpen size={18} />, texto: "Biblioteca" },
    { href: link.ajustes, tela: "ajustes", icone: <SlidersHorizontal size={18} />, texto: "Ajustes" },
  ];
  const c = estado.conexoes;
  return (
    <aside className="side">
      <div className="lockup">
        <img src="/logo.svg" alt="" width={34} height={34} />
        <div className="marca"><span className="wordmark">AutoTube</span><span className="ver">{estado.versao}</span></div>
      </div>
      <nav aria-label="Telas">
        {itens.map((i) => (
          <a key={i.tela} className="nav-i" href={i.href} aria-current={rota.tela === i.tela ? "page" : undefined}>
            {i.icone}<span>{i.texto}</span>
          </a>
        ))}
      </nav>
      {estado.projetos.length > 0 && (
        <>
          <div className="sec-lateral">Recentes</div>
          <div className="recentes">
            {estado.projetos.slice(0, 6).map((p) => {
              const ativo = rota.tela === "projeto" && rota.id === p.id;
              const prod_aqui = prod.rodando && prod.projeto === p.id;
              return (
                <a key={p.id} href={link.projeto(p.id)} className={`recente${ativo ? " on" : ""}`} aria-current={ativo ? "page" : undefined}>
                  <span className={`d${prod_aqui ? " run" : p.versao ? " ok" : ""}`} aria-hidden />
                  <span className="n">{p.nome}</span>
                  <small>{prod_aqui ? `${Math.round(prod.progresso * 100)}%` : p.versao ? `v${p.versao}` : p.formato}</small>
                </a>
              );
            })}
          </div>
        </>
      )}
      <div className="foot">
        <div className={`conexao${c.minimax ? " on" : ""}`}><span className="dot" aria-hidden />{c.minimax ? "MiniMax · voz pronta" : "Falta a chave da MiniMax (.env)"}</div>
        <div className={`conexao${c.motor ? " on" : ""}`}><span className="dot" aria-hidden />{c.motor ? "Motor de vídeo pronto" : "Falta o Node.js"}</div>
        <div className={`conexao${c.claude ? " on" : ""}`}><span className="dot" aria-hidden />{c.claude ? "Claude conectado" : "Claude não encontrado"}</div>
      </div>
    </aside>
  );
}
