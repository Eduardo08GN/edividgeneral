import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import { PALAVRAS } from "./palavras";

export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#06100F", painel: "#0B1615", borda: "rgba(239,233,220,0.10)", ink: "#EFE9DC", mudo: "#8FA3A0",
  teal: "#5ED6C5", amber: "#F2A33A", red: "#FF5A4E", escuro: "#06100F", noite1: "#060A1C", noite2: "#151C45",
};
export const SANS = "Bricolage, sans-serif";
export const MONO = "JBMono, monospace";

/** segundos -> quadro */
export const fr = (t: number) => Math.round(t * FPS);
/** quadro (absoluto) em que a palavra i comeca a ser dita */
export const pw = (i: number) => fr(PALAVRAS[i][1]);

/** quadro absoluto dentro de uma <Sequence from={inicio}> */
export const useAbs = (inicio: number) => useCurrentFrame() + inicio;

export const mola = (f: number, em: number, cfg: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
  spring({ frame: f - em, fps: FPS, config: { damping: 15, stiffness: 180, mass: 0.7, ...cfg } });

export const lin = (f: number, a: number, b: number, de: number, para: number, ease = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(f, [a, b], [de, para], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Palavra que entra quando e' dita: sobe, desfoca->nitida, cresce. */
export const Palavra: React.FC<{ f: number; em: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ f, em, children, style }) => {
  const s = mola(f, em, { damping: 13, stiffness: 210 });
  const o = lin(f, em - 1, em + 4, 0, 1);
  return (
    <span style={{ display: "inline-block", opacity: o, transform: `translateY(${(1 - s) * 46}px) scale(${0.86 + 0.14 * s})`,
                   filter: `blur(${(1 - Math.min(1, s)) * 10}px)`, marginRight: "0.24em", ...style }}>{children}</span>
  );
};

/** Grade de pontos (estilo das referencias). */
export const GradePontos: React.FC<{ cor?: string; passo?: number; opacidade?: number }> = ({ cor = "rgba(239,233,220,0.10)", passo = 36, opacidade = 1 }) => (
  <AbsoluteFill style={{ opacity: opacidade, backgroundImage: `radial-gradient(${cor} 1.6px, transparent 1.7px)`, backgroundSize: `${passo}px ${passo}px` }} />
);

/** Parede de videos (posters 9:16) rolando para cima. */
export const Parede: React.FC<{ f: number; opacidade?: number; giro?: number; vel?: number }> = ({ f, opacidade = 0.4, giro = -7, vel = 1.6 }) => {
  const cw = 250, ch = 444, gap = 22, cols = 8;
  return (
    <AbsoluteFill style={{ opacity: opacidade, transform: `rotate(${giro}deg) scale(1.25)`, display: "flex", flexDirection: "row", justifyContent: "center", gap }}>
      {Array.from({ length: cols }).map((_, c) => {
        const ciclo = 6 * (ch + gap);
        const y = -(((f * vel * (c % 2 ? 1.25 : 0.85)) + c * 137) % ciclo);
        return (
          <div key={c} style={{ display: "flex", flexDirection: "column", gap, transform: `translateY(${y - 200}px)` }}>
            {Array.from({ length: 12 }).map((_, k) => (
              <Img key={k} src={staticFile(`posters/${String(((c * 5 + k) % 12) + 1).padStart(2, "0")}.jpg`)}
                   style={{ width: cw, height: ch, objectFit: "cover", borderRadius: 18 }} />
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** Cursor de mouse desenhado. */
export const Cursor: React.FC<{ x: number; y: number; escala?: number; style?: React.CSSProperties }> = ({ x, y, escala = 1, style }) => (
  <svg width={44} height={56} viewBox="0 0 22 28" style={{ position: "absolute", left: x, top: y, transform: `scale(${escala})`, transformOrigin: "0 0", filter: "drop-shadow(0 6px 10px rgba(0,0,0,.45))", ...style }}>
    <path d="M1 1 L1 22 L6.5 17 L10.5 26 L14 24.5 L10 15.8 L17.5 15.8 Z" fill="#fff" stroke="#111" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

/** Janela no estilo do painel (cartao escuro com borda fina). */
export const Cartao: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ position: "absolute", background: C.painel, border: `1.5px solid ${C.borda}`, borderRadius: 20,
                boxShadow: "0 40px 90px rgba(0,0,0,.55)", overflow: "hidden", ...style }}>{children}</div>
);

export const Rotulo: React.FC<{ children: React.ReactNode; cor?: string; style?: React.CSSProperties }> = ({ children, cor = C.mudo, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: "0.22em", textTransform: "uppercase", color: cor, ...style }}>{children}</div>
);
