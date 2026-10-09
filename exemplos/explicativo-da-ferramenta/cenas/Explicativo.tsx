import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, FPS, MONO, fr, pw } from "./base";
import { CENAS, Cem, Custo, Entrada, Fecho, Madrugada, Montagem, Plataformas, Sozinha, Veo, Virada, Volume } from "./Cenas";
import { DURACAO } from "./palavras";

export const TOTAL = 1215;

const COMP: Record<string, React.FC<{ inicio: number }>> = {
  plataformas: Plataformas, volume: Volume, custo: Custo, virada: Virada, entrada: Entrada, veo: Veo,
  montagem: Montagem, sozinha: Sozinha, madrugada: Madrugada, cem: Cem, fecho: Fecho,
};
const ROTULOS = ["Plataformas", "Volume", "Custo", "Virada", "Entrada", "Veo", "Montagem", "Piloto", "Madrugada", "Resultado", "Volume"];

// SFX: `em` = quadro em que o PICO do som deve cair; `pico` medido em cada arquivo (librosa).
type Sfx = { src: string; em: number; pico: number; vol: number; dur?: number; trim?: number };
const P: Record<string, number> = {
  pop_ui: 0.09, sweep: 0.31, whoosh_rapido: 1.10, impacto_fundo: 0.59, sweep_curto: 0.45, clique: 0.05, relogio_rapido: 0.07,
  pop_seco: 0.05, pop_longo: 0.06, whoosh_pop: 0.06, tech_slide: 0.14, check: 0.14, ui_zoom: 0.30, bleep_ok: 0.20,
  tech_select: 0.0, glitch_eletrico: 0.35, contador: 0.06, alarme_beep: 0.0, glitch_texto: 0.2, logo_impacto: 0.37,
};
const s = (src: string, em: number, vol: number, extra: Partial<Sfx> = {}): Sfx => ({ src, em, pico: P[src] ?? 0, vol, ...extra });
const clique = pw(44) + 2;
const SFX: Sfx[] = [
  s("pop_ui", pw(1), 0.45), s("pop_ui", pw(4), 0.45), s("pop_ui", pw(7), 0.45), s("sweep", pw(8), 0.45),
  s("whoosh_rapido", 165, 0.55), s("impacto_fundo", pw(16), 0.55, { dur: 1.2 }),
  s("sweep_curto", 210, 0.5), s("clique", pw(22) - 3, 0.5, { dur: 0.3 }), s("relogio_rapido", pw(22), 0.32, { dur: 2.2 }),
  ...[0, 1, 2].map((i) => s("pop_seco", pw(26) + 1 + i * 3, 0.42)),
  s("glitch_texto", 345, 0.33, { trim: 1.1, dur: 0.6 }), s("pop_longo", pw(34), 0.5), s("whoosh_pop", 393, 0.5),
  s("tech_slide", 402, 0.45),
  ...Array.from({ length: 8 }).map((_, i) => s("check", pw(38) + i * 2 + 1, 0.28)),
  s("ui_zoom", pw(41) + 8, 0.4), s("clique", clique, 0.7, { dur: 0.3 }), s("bleep_ok", clique + 8, 0.45),
  s("whoosh_rapido", 510, 0.5),
  ...[4, 22, 40, 56, 74].map((d) => s("tech_select", pw(49) + d, 0.3)),
  s("sweep", 597, 0.45), ...[58, 61, 65].map((i) => s("bleep_ok", pw(i) + 12, 0.35)), s("pop_longo", pw(66) + 5, 0.6),
  s("ui_zoom", 720, 0.45), s("glitch_eletrico", pw(70), 0.28),
  s("whoosh_rapido", 822, 0.5), s("contador", 830, 0.22, { dur: (pw(86) - 830) / FPS }), s("alarme_beep", pw(86) - 2, 0.35, { dur: 1.3 }),
  s("tech_slide", 982, 0.45), s("impacto_fundo", pw(95), 0.65, { dur: 1.3 }),
  s("whoosh_rapido", 1085, 0.45), s("logo_impacto", pw(102), 0.5, { trim: 4.0, dur: 3.0 }), s("pop_ui", pw(103) + 10, 0.3),
];

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const i = CENAS.findIndex((c) => f >= c.de && f < c.ate);
  const tc = (q: number) => { const t = Math.floor(q / FPS); return `00:00:${String(t).padStart(2, "0")}:${String(q % FPS).padStart(2, "0")}`; };
  const canto = (st: React.CSSProperties) => <div style={{ position: "absolute", width: 26, height: 26, borderColor: "#fff", borderStyle: "solid", borderWidth: 0, ...st }} />;
  const txt: React.CSSProperties = { position: "absolute", fontFamily: MONO, fontSize: 14, letterSpacing: "0.22em", color: "#fff", textTransform: "uppercase" };
  return (
    <AbsoluteFill style={{ mixBlendMode: "difference", opacity: 0.55, pointerEvents: "none" }}>
      {canto({ left: 36, top: 36, borderLeftWidth: 2, borderTopWidth: 2 })}
      {canto({ right: 36, top: 36, borderRightWidth: 2, borderTopWidth: 2 })}
      {canto({ left: 36, bottom: 36, borderLeftWidth: 2, borderBottomWidth: 2 })}
      {canto({ right: 36, bottom: 36, borderRightWidth: 2, borderBottomWidth: 2 })}
      <div style={{ ...txt, left: 76, top: 42 }}>● Produzindo ao vivo</div>
      <div style={{ ...txt, right: 76, top: 42 }}>{String(i + 1).padStart(2, "0")} / 11 · {ROTULOS[Math.max(0, i)]}</div>
      <div style={{ ...txt, left: 76, bottom: 42 }}>1920×1080 · 30 fps</div>
      <div style={{ ...txt, right: 76, bottom: 42 }}>{tc(f)}</div>
    </AbsoluteFill>
  );
};

export const Explicativo: React.FC = () => {
  const fimFala = fr(DURACAO);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {CENAS.map((c) => {
        const Comp = COMP[c.id];
        return (
          <Sequence key={c.id} from={c.de} durationInFrames={c.ate - c.de} premountFor={30}>
            <Comp inicio={c.de} />
          </Sequence>
        );
      })}
      <Hud />
      <Audio src={staticFile("narracao.wav")} />
      <Audio src={staticFile("musica.wav")} volume={(q) => interpolate(q, [0, 8, fimFala - 6, fimFala + 12, TOTAL - 20, TOTAL], [0, 0.2, 0.2, 0.42, 0.42, 0],
                                                                         { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      {SFX.map((x, k) => {
        const de = Math.max(0, x.em - Math.round(x.pico * FPS));
        return (
          <Sequence key={k} from={de} durationInFrames={x.dur ? Math.round(x.dur * FPS) : undefined}>
            <Audio src={staticFile(`sfx/${x.src}.mp3`)} volume={x.vol} trimBefore={x.trim ? Math.round(x.trim * FPS) : undefined} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
