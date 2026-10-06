// Base compartilhada dos videos do AutoTube (nasceu no explicativo da ferramenta, 2026-10-06).
import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const C = {
  bg: "#06100F", painel: "#0B1615", borda: "rgba(239,233,220,0.10)", ink: "#EFE9DC", mudo: "#8FA3A0",
  teal: "#5ED6C5", amber: "#F2A33A", red: "#FF5A4E", escuro: "#06100F",
};
export const SANS = "Bricolage, sans-serif";
export const MONO = "JBMono, monospace";

export const mola = (f: number, em: number, fps: number, cfg: Partial<{ damping: number; stiffness: number; mass: number }> = {}) =>
  spring({ frame: f - em, fps, config: { damping: 15, stiffness: 180, mass: 0.7, ...cfg } });

export const lin = (f: number, a: number, b: number, de: number, para: number, ease = Easing.bezier(0.22, 1, 0.36, 1)) =>
  interpolate(f, [a, b], [de, para], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Palavra que entra no quadro `em`: sobe, desfoca -> nitida, cresce. */
export const Palavra: React.FC<{ em: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ em, children, style }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = mola(f, em, fps, { damping: 13, stiffness: 210 });
  return (
    <span style={{ display: "inline-block", opacity: lin(f, em - 1, em + 4, 0, 1), transform: `translateY(${(1 - s) * 0.32}em) scale(${0.86 + 0.14 * s})`,
                   filter: `blur(${(1 - Math.min(1, s)) * 10}px)`, marginRight: "0.24em", ...style }}>{children}</span>
  );
};

export const GradePontos: React.FC<{ cor?: string; passo?: number; opacidade?: number }> = ({ cor = "rgba(239,233,220,0.10)", passo = 36, opacidade = 1 }) => (
  <AbsoluteFill style={{ opacity: opacidade, backgroundImage: `radial-gradient(${cor} 1.6px, transparent 1.7px)`, backgroundSize: `${passo}px ${passo}px` }} />
);

/** Cantos e rotulos de "camera" (mixBlendMode difference: legivel em fundo claro e escuro). */
export const Hud: React.FC<{ esquerda: string; direita: string }> = ({ esquerda, direita }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const m = Math.round(width * 0.019);
  const t = Math.floor(f / fps);
  const tc = `00:00:${String(t).padStart(2, "0")}:${String(f % fps).padStart(2, "0")}`;
  const canto = (st: React.CSSProperties) => <div style={{ position: "absolute", width: 26, height: 26, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, ...st }} />;
  const txt: React.CSSProperties = { position: "absolute", fontFamily: MONO, fontSize: 14, letterSpacing: "0.22em", color: "#fff", textTransform: "uppercase" };
  return (
    <AbsoluteFill style={{ mixBlendMode: "difference", opacity: 0.55, pointerEvents: "none" }}>
      {canto({ left: m, top: m, borderLeftWidth: 2, borderTopWidth: 2 })}
      {canto({ right: m, top: m, borderRightWidth: 2, borderTopWidth: 2 })}
      {canto({ left: m, bottom: m, borderLeftWidth: 2, borderBottomWidth: 2 })}
      {canto({ right: m, bottom: m, borderRightWidth: 2, borderBottomWidth: 2 })}
      <div style={{ ...txt, left: m + 40, top: m + 6 }}>{esquerda}</div>
      <div style={{ ...txt, right: m + 40, top: m + 6, maxWidth: width * 0.4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{direita}</div>
      <div style={{ ...txt, right: m + 40, bottom: m + 6 }}>{tc}</div>
    </AbsoluteFill>
  );
};
