// Modelo "Legenda cinetica": a narracao vira tipografia em movimento, frase a frase, palavra a palavra.
// Serve para qualquer projeto que ja' tem copy + narracao, em 16:9, 9:16 ou 1:1 (props vem do Python: editor/producao.py).
import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, GradePontos, Hud, Palavra, SANS, lin } from "../base";

type P = { w: string; de: number; ate: number };
type Frase = { de: number; ate: number; palavras: P[] };
type Sfx = { src: string; em: number; pico: number; vol: number };
export type PropsLegenda = {
  largura: number; altura: number; fps: number; total: number; duracao: number; titulo: string; frases: Frase[];
  narracao: string; musica: string | null; musica_vol: number; musica_vol_fim: number; sfx: Sfx[];
};

const destaque = (f: Frase) => {
  // a palavra mais "pesada" da frase (a mais longa, ou um numero) ganha a cor de destaque
  let melhor = -1, tam = 4;
  f.palavras.forEach((p, i) => {
    const l = p.w.replace(/[^\p{L}\p{N}]/gu, "").length + (/\d/.test(p.w) ? 4 : 0);
    if (l > tam) { tam = l; melhor = i; }
  });
  return melhor;
};

const Fundo: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const x = 50 + 18 * Math.sin(f / 90), y = 40 + 12 * Math.cos(f / 110);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: `radial-gradient(${width * 0.6}px ${height * 0.5}px at ${x}% ${y}%, rgba(94,214,197,0.10), transparent 70%),
                                          radial-gradient(${width * 0.5}px ${height * 0.4}px at ${100 - x}% ${100 - y}%, rgba(242,163,58,0.07), transparent 70%)` }} />
      <GradePontos opacidade={0.55} />
    </AbsoluteFill>
  );
};

export const Legenda: React.FC<PropsLegenda> = (p) => {
  const f = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const retrato = height > width;
  const fs = Math.round(Math.min(width * (retrato ? 0.118 : 0.07), height * 0.12));
  const q = (t: number) => Math.round(t * fps);
  const atual = p.frases.reduce((acc, fr, i) => (q(fr.de) - 3 <= f ? i : acc), -1);
  const fimFala = q(p.duracao);
  const fecho = lin(f, fimFala + 6, durationInFrames - 4, 0, 1);
  return (
    <AbsoluteFill>
      <Fundo />
      {p.frases.map((fr, i) => {
        if (i < atual - 1 || i > atual) return null;
        const sai = i < atual ? lin(f, q(p.frases[atual].de) - 3, q(p.frases[atual].de) + 4, 0, 1) : 0;
        const novaFrase = i === 0 || /[.!?]$/.test(p.frases[i - 1].palavras.at(-1)!.w);
        const soco = novaFrase ? 1 + 0.05 * Math.max(0, 1 - (f - q(fr.de)) / 8) : 1;
        const d = destaque(fr);
        return (
          <AbsoluteFill key={i} style={{ justifyContent: "center", alignItems: "center", opacity: (1 - sai) * (1 - fecho),
                                         transform: `translateY(${-sai * fs * 0.6}px) scale(${soco})`, filter: `blur(${sai * 12}px)` }}>
            <div style={{ maxWidth: width * 0.84, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: fs, lineHeight: 1.04,
                          letterSpacing: "-0.035em", color: C.ink }}>
              {fr.palavras.map((w, k) => (
                <Palavra key={k} em={q(w.de)} style={{ color: k === d ? C.teal : C.ink }}>{w.w}</Palavra>
              ))}
            </div>
          </AbsoluteFill>
        );
      })}
      <div style={{ position: "absolute", left: width / 2 - 12, top: height * (retrato ? 0.72 : 0.78), width: 24, height: 24, borderRadius: 12,
                    background: C.teal, boxShadow: `0 0 30px ${C.teal}`, opacity: 0.85 * (1 - fecho), transform: `scale(${1 + 0.18 * Math.sin(f / 4)})` }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${Math.min(1, f / Math.max(1, fimFala)) * 100}%`, background: C.teal, opacity: 0.8 }} />
      <Hud esquerda="● AutoTube" direita={p.titulo} />
      <Audio src={staticFile(p.narracao)} />
      {p.musica && (
        <Audio src={staticFile(p.musica)} volume={(t) => interpolate(t, [0, 8, fimFala - 6, fimFala + 12, durationInFrames - 20, durationInFrames],
                                                                    [0, p.musica_vol, p.musica_vol, p.musica_vol_fim, p.musica_vol_fim, 0],
                                                                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      )}
      {p.sfx.map((s, k) => (
        <Sequence key={k} from={Math.max(0, q(s.em) - Math.round(s.pico * fps))} durationInFrames={q(1.5)}>
          <Audio src={staticFile(s.src)} volume={s.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
