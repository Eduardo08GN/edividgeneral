import React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { C, MONO, lin } from "./base";

// Gravacao real do painel: 1920x1040 (tela 1, janela maximizada). So' filmada, sem cliques.
const SRC_W = 1920, SRC_H = 1040;

export type Evento = { em: number; hora: string; txt: string };

/** "Agora ha pouco" no MESMO desenho do painel (coordenadas da gravacao). Substitui o feed real, que ficou parado
 *  e mostrava um aviso; aqui cada evento novo entra no topo e empurra os outros. */
export const FeedMock: React.FC<{ f: number; eventos: Evento[]; x?: number; y?: number }> = ({ f, eventos, x = 1145, y = 185 }) => {
  const vis = eventos.filter((e) => f >= e.em).sort((a, b) => b.em - a.em).slice(0, 8);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 505, height: 362, background: "#0c1716", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 23, top: 12, fontFamily: MONO, fontSize: 10.5, letterSpacing: "0.24em", color: "#7d8c88" }}>AGORA HÁ POUCO</div>
      {vis.map((e, i) => {
        const ent = lin(f, e.em, e.em + 9, 0, 1);
        // os mais antigos deslizam para baixo quando um novo entra
        const novos = vis.filter((o) => o.em > e.em);
        const desl = novos.reduce((acc, o) => acc + lin(f, o.em, o.em + 9, 0, 40), 0);
        const yy = 44 + desl - (1 - ent) * 14;
        const brilho = lin(f, e.em, e.em + 24, 1, 0);
        return (
          <div key={e.em + e.txt} style={{ position: "absolute", left: 23, top: yy, width: 457, height: 40, opacity: ent,
                                           borderBottom: "1px solid rgba(239,233,220,0.07)", display: "flex", alignItems: "center",
                                           background: `rgba(94,214,197,${0.10 * brilho})` }}>
            <span style={{ fontFamily: MONO, fontSize: 12, color: "#7d8c88", width: 62 }}>{e.hora}</span>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: brilho > 0.05 ? C.teal : "#5f6f6b", marginRight: 13, boxShadow: brilho > 0.05 ? `0 0 ${10 * brilho}px ${C.teal}` : "none" }} />
            <span style={{ fontFamily: "PublicSans, sans-serif", fontSize: 13.2, color: "#c9d1cd" }}>{e.txt}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Recorte da gravacao real. `reg` em pixels da gravacao; `largura` = largura na tela.
 *  Mascaras: barra de titulo e lateral ficam fora do recorte (nome da ferramenta e idiomas); a chave
 *  de idiomas EN/FR/DE no topo e o feed sao cobertos. */
export const PainelReal: React.FC<{
  f: number; trim: number; reg: { x: number; y: number; w: number; h: number }; largura: number;
  eventos: Evento[]; style?: React.CSSProperties;
}> = ({ f, trim, reg, largura, eventos, style }) => {
  const s = largura / reg.w;
  return (
    <div style={{ position: "absolute", width: largura, height: reg.h * s, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", width: SRC_W, height: SRC_H, transformOrigin: "0 0", transform: `scale(${s}) translate(${-reg.x}px, ${-reg.y}px)` }}>
        <OffthreadVideo src={staticFile("studio/painel.mp4")} trimBefore={trim} muted style={{ width: SRC_W, height: SRC_H }} />
        {/* lateral + barra de titulo (nome "AutomaWeb Studio" e lista de idiomas) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: 232, height: SRC_H, background: "#020807" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: SRC_W, height: 38, background: "#020807" }} />
        {/* chave de idiomas EN / FR / DE */}
        <div style={{ position: "absolute", left: 1400, top: 104, width: 270, height: 50, background: "#0a110e" }} />
        <FeedMock f={f} eventos={eventos} />
      </div>
    </div>
  );
};
