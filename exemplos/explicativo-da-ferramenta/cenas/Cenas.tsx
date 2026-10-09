import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, random, staticFile } from "remotion";
import { C, Cartao, Cursor, GradePontos, H, MONO, Palavra, Parede, Rotulo, SANS, W, fr, lin, mola, pw, useAbs } from "./base";
import { Evento, FeedMock, PainelReal } from "./Studio";

// Cenas (quadros absolutos). Cada cena recebe `inicio` para converter o quadro local em absoluto.
export const CENAS = [
  { id: "plataformas", de: 0, ate: 165 },
  { id: "volume", de: 165, ate: 210 },
  { id: "custo", de: 210, ate: 345 },
  { id: "virada", de: 345, ate: 400 },
  { id: "entrada", de: 400, ate: 510 },
  { id: "veo", de: 510, ate: 597 },
  { id: "montagem", de: 597, ate: 720 },
  { id: "sozinha", de: 720, ate: 822 },
  { id: "madrugada", de: 822, ate: 982 },
  { id: "cem", de: 982, ate: 1085 },
  { id: "fecho", de: 1085, ate: 1215 },
] as const;

const titulo: React.CSSProperties = { fontFamily: SANS, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.98 };

/* ───────────── 1. Plataformas ───────────── */
export const Plataformas: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const chips = [{ n: "TikTok Shop", em: pw(1) }, { n: "Instagram", em: pw(4) }, { n: "Facebook", em: pw(7) }];
  const sobe = mola(f, pw(8), { damping: 18 });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Parede f={f} opacidade={0.75} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(6,16,15,0.78) 0%, rgba(6,16,15,0.55) 55%, rgba(6,16,15,0.85) 100%)" }} />
      <div style={{ position: "absolute", top: 360 - sobe * 140, width: W, display: "flex", justifyContent: "center", gap: 28, transform: `scale(${1 - 0.18 * sobe})` }}>
        {chips.map((c, i) => {
          const s = mola(f, c.em, { damping: 12 });
          return (
            <div key={c.n} style={{ opacity: lin(f, c.em - 1, c.em + 3, 0, 1), transform: `translateY(${(1 - s) * 60}px) scale(${0.6 + 0.4 * s})`,
                                    padding: "20px 38px", borderRadius: 999, border: `1.5px solid rgba(239,233,220,0.22)`, background: "rgba(11,22,21,0.85)",
                                    display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: MONO, fontSize: 18, color: C.teal }}>0{i + 1}</span>
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: C.ink, letterSpacing: "-0.02em" }}>{c.n}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 470, width: W, textAlign: "center", ...titulo, fontSize: 150, color: C.ink }}>
        <div><Palavra f={f} em={pw(8)}>quem</Palavra><Palavra f={f} em={pw(9)}>posta</Palavra><Palavra f={f} em={pw(10)}>mais</Palavra></div>
        <div style={{ color: C.teal }}><Palavra f={f} em={pw(11)}>vende</Palavra><Palavra f={f} em={pw(12)}>mais.</Palavra></div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 2. Volume ───────────── */
export const Volume: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const abre = lin(f, inicio, inicio + 8, 0, 1);
  const vol = pw(16);
  const cresce = lin(f, vol, inicio + 45, 1, 1.14);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: C.teal, clipPath: `circle(${abre * 120}% at 50% 50%)` }}>
        <div style={{ position: "absolute", left: 150, top: 150, fontFamily: SANS, fontWeight: 700, fontSize: 60, color: C.escuro, letterSpacing: "-0.02em" }}>
          <Palavra f={f} em={pw(13)}>O</Palavra><Palavra f={f} em={pw(14)}>algoritmo</Palavra><Palavra f={f} em={pw(15)}>quer</Palavra>
        </div>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", transform: `scale(${cresce})` }}>
          {[-3, -2, -1, 1, 2, 3].map((k) => (
            <div key={k} style={{ position: "absolute", ...titulo, fontSize: 290, color: "transparent", WebkitTextStroke: `2.5px ${C.escuro}`,
                                  transform: `translateY(${k * 235 * lin(f, vol + Math.abs(k) * 2, vol + Math.abs(k) * 2 + 10, 0, 1)}px)`,
                                  opacity: lin(f, vol + Math.abs(k) * 2, vol + Math.abs(k) * 2 + 4, 0, 1 - Math.abs(k) * 0.22) }}>VOLUME</div>
          ))}
          <div style={{ ...titulo, fontSize: 290, color: C.escuro, transform: `scale(${0.5 + 0.5 * mola(f, vol, { damping: 11 })})`, opacity: lin(f, vol - 1, vol + 2, 0, 1) }}>VOLUME</div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 3. Custo (gravar o dia inteiro / pagar uma equipe) ───────────── */
const Icone: React.FC<{ tipo: "camera" | "tesoura" | "pessoa" }> = ({ tipo }) => (
  <svg width={64} height={64} viewBox="0 0 32 32" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    {tipo === "camera" && (<><rect x="3" y="9" width="20" height="15" rx="3" /><path d="M23 14 L29 10 L29 23 L23 19" /></>)}
    {tipo === "tesoura" && (<><circle cx="8" cy="23" r="4" /><circle cx="22" cy="23" r="4" /><path d="M10.5 20 L22 4 M19.5 20 L8 4" /></>)}
    {tipo === "pessoa" && (<><circle cx="16" cy="10" r="5.5" /><path d="M5 28 C6 20 26 20 27 28" /></>)}
  </svg>
);

export const Custo: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const fim = 345;
  const fecha = lin(f, fim - 9, fim, 1, 0, (t) => t * t);
  const rec = pw(22);
  const horas = Math.min(8 * 3600, Math.max(0, (f - rec) / 30) * 3600 * 4.2);
  const hh = String(Math.floor(horas / 3600)).padStart(2, "0"), mm = String(Math.floor((horas % 3600) / 60)).padStart(2, "0"), ss = String(Math.floor(horas % 60)).padStart(2, "0");
  const recIn = mola(f, rec - 3, { damping: 14 });
  const equipe = [{ t: "CÂMERA", i: "camera" as const }, { t: "EDITOR", i: "tesoura" as const }, { t: "ATOR", i: "pessoa" as const }];
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill style={{ background: C.amber, clipPath: `circle(${fecha * 120}% at 50% 50%)` }}>
        <div style={{ position: "absolute", left: 140, top: 150, fontFamily: SANS, fontWeight: 700, fontSize: 56, color: C.escuro, letterSpacing: "-0.02em" }}>
          <Palavra f={f} em={pw(17)}>E</Palavra><Palavra f={f} em={pw(18)}>volume,</Palavra>
          <Palavra f={f} em={pw(19)} style={{ background: C.escuro, color: C.amber, padding: "0 14px", borderRadius: 8 }}>até hoje,</Palavra>
        </div>
        <div style={{ position: "absolute", left: 140, top: 300, ...titulo, fontSize: 104, color: C.escuro, width: 960 }}>
          <div><Palavra f={f} em={pw(22)}>gravar</Palavra><Palavra f={f} em={pw(23)}>o</Palavra><Palavra f={f} em={pw(24)}>dia</Palavra><Palavra f={f} em={pw(25)}>inteiro</Palavra></div>
          <div style={{ marginTop: 40, opacity: 0.9 }}><Palavra f={f} em={pw(26)}>ou</Palavra><Palavra f={f} em={pw(27)}>pagar</Palavra><Palavra f={f} em={pw(28)}>uma</Palavra><Palavra f={f} em={pw(29)}>equipe.</Palavra></div>
        </div>
        {/* REC */}
        <div style={{ position: "absolute", left: 1170, top: 190, width: 610, height: 300, borderRadius: 26, background: C.escuro,
                      transform: `translateX(${(1 - recIn) * 300}px) rotate(${(1 - recIn) * 6}deg)`, opacity: recIn, padding: 38, boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: 11, background: C.red, opacity: Math.floor(f / 8) % 2 ? 1 : 0.35 }} />
            <span style={{ fontFamily: MONO, fontSize: 26, color: C.red, letterSpacing: "0.2em" }}>REC</span>
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 18, color: C.mudo, letterSpacing: "0.2em" }}>GRAVANDO</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 108, color: C.ink, marginTop: 34, letterSpacing: "-0.02em" }}>{hh}:{mm}:{ss}</div>
          <div style={{ marginTop: 26, height: 8, borderRadius: 4, background: "rgba(239,233,220,0.12)" }}>
            <div style={{ height: 8, borderRadius: 4, width: `${(horas / (8 * 3600)) * 100}%`, background: C.red }} />
          </div>
        </div>
        {/* equipe */}
        <div style={{ position: "absolute", left: 1170, top: 540, width: 610, display: "flex", gap: 20 }}>
          {equipe.map((e, i) => {
            const em = pw(26) - 2 + i * 3;
            const s = mola(f, em, { damping: 11 });
            return (
              <div key={e.t} style={{ flex: 1, height: 250, borderRadius: 24, background: C.escuro, opacity: lin(f, em - 1, em + 3, 0, 1),
                                      transform: `translateY(${(1 - s) * 120}px) rotate(${(1 - s) * (i - 1) * 10}deg)`, display: "flex", flexDirection: "column",
                                      alignItems: "center", justifyContent: "center", gap: 18 }}>
                <Icone tipo={e.i} />
                <span style={{ fontFamily: MONO, fontSize: 20, color: C.ink, letterSpacing: "0.2em" }}>{e.t}</span>
                <span style={{ fontFamily: MONO, fontSize: 18, color: C.amber }}>R$ ••••</span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ───────────── 4. Virada ───────────── */
export const Virada: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const pulso = 1 + 0.25 * Math.sin((f - inicio) / 3);
  const abre = lin(f, 391, 400, 0, 1, (t) => t * t);
  const sub = lin(f, pw(34) + 2, pw(34) + 12, 0, 1);
  return (
    <AbsoluteFill style={{ background: C.bg, justifyContent: "center", alignItems: "center" }}>
      <GradePontos opacidade={0.5} />
      <div style={{ position: "absolute", top: 300, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 60, color: C.mudo }}>
        <Palavra f={f} em={pw(30)}>Essa</Palavra><Palavra f={f} em={pw(31)}>ferramenta</Palavra>
      </div>
      <div style={{ position: "absolute", top: 400, width: W, textAlign: "center", ...titulo, fontSize: 190, color: C.ink }}>
        <Palavra f={f} em={pw(32)}>mudou</Palavra><Palavra f={f} em={pw(33)}>a</Palavra><Palavra f={f} em={pw(34)} style={{ color: C.teal }}>conta.</Palavra>
        <div style={{ margin: "18px auto 0", height: 12, borderRadius: 6, background: C.teal, width: 1180 * sub }} />
      </div>
      <div style={{ position: "absolute", left: W / 2 - 18, top: 800, width: 36, height: 36, borderRadius: 18, background: C.teal, transform: `scale(${pulso})`, boxShadow: `0 0 40px ${C.teal}` }} />
      <AbsoluteFill style={{ background: "#0A1413", clipPath: `circle(${abre * 120}% at 50% 76%)` }} />
    </AbsoluteFill>
  );
};

/* ───────────── 5. Entrada: escolhe os videos + aperta um botao ───────────── */
export const Entrada: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const jan = mola(f, inicio + 2, { damping: 16 });
  const sel0 = pw(38);
  const voa = lin(f, pw(41) + 4, pw(42) + 2, 0, 1);
  const painel = mola(f, pw(41), { damping: 15 });
  const clique = pw(44) + 2;
  const cx = interpolate(f, [pw(42), clique - 2], [1500, 1388], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cy = interpolate(f, [pw(42), clique - 2], [940, 707], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const apertou = f >= clique;
  const onda = lin(f, clique, clique + 16, 0, 1);
  const toast = mola(f, clique + 8, { damping: 14 });
  const n = Math.min(8, Math.max(0, Math.floor((f - (pw(41) + 4)) / 2.5)));
  return (
    <AbsoluteFill style={{ background: "#0A1413" }}>
      <GradePontos opacidade={0.6} />
      <div style={{ position: "absolute", top: 70, width: W, textAlign: "center", fontFamily: SANS, fontWeight: 700, fontSize: 64, color: C.ink, letterSpacing: "-0.02em" }}>
        {f < pw(42) ? (
          <><Palavra f={f} em={pw(35)}>Você</Palavra><Palavra f={f} em={pw(36)} style={{ color: C.teal }}>escolhe</Palavra><Palavra f={f} em={pw(37)}>os</Palavra><Palavra f={f} em={pw(38)}>vídeos</Palavra></>
        ) : (
          <><Palavra f={f} em={pw(42)}>e</Palavra><Palavra f={f} em={pw(43)} style={{ color: C.teal }}>aperta</Palavra><Palavra f={f} em={pw(44)}>um</Palavra><Palavra f={f} em={pw(45)}>botão.</Palavra></>
        )}
      </div>
      {/* janela "seu computador" */}
      <Cartao style={{ left: 150, top: 200, width: 900, height: 700, opacity: jan, transform: `translateY(${(1 - jan) * 80}px) scale(${0.92 + 0.08 * jan})` }}>
        <div style={{ height: 58, display: "flex", alignItems: "center", gap: 10, padding: "0 22px", borderBottom: `1.5px solid ${C.borda}` }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
          <span style={{ marginLeft: 18, fontFamily: MONO, fontSize: 17, color: C.mudo, letterSpacing: "0.08em" }}>Este computador  ›  Vídeos</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 15, color: C.teal, letterSpacing: "0.18em", opacity: lin(f, pw(40), pw(40) + 6, 0, 1) }}>HD LOCAL</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 22, padding: 30 }}>
          {Array.from({ length: 8 }).map((_, i) => {
            const em = sel0 + i * 2;
            const sel = lin(f, em, em + 5, 0, 1);
            const sai = lin(f, pw(41) + 4 + i * 2.5, pw(41) + 12 + i * 2.5, 0, 1);
            return (
              <div key={i} style={{ position: "relative", height: 280, borderRadius: 14, overflow: "hidden", outline: `${4 * sel}px solid ${C.teal}`, outlineOffset: 3,
                                    transform: `translate(${sai * (1250 - 190 * (i % 4))}px, ${sai * (40 - 300 * Math.floor(i / 4))}px) scale(${1 - 0.6 * sai})`, opacity: 1 - sai * 0.9 }}>
                <Img src={staticFile(`posters/${String(i + 1).padStart(2, "0")}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "8px 10px", background: "linear-gradient(transparent, rgba(0,0,0,.8))", fontFamily: MONO, fontSize: 13, color: C.ink }}>video_0{i + 1}.mp4</div>
                <div style={{ position: "absolute", right: 10, top: 10, width: 30, height: 30, borderRadius: 15, background: C.teal, transform: `scale(${sel})`, display: "flex", alignItems: "center", justifyContent: "center", color: C.escuro, fontWeight: 900, fontSize: 18 }}>✓</div>
              </div>
            );
          })}
        </div>
      </Cartao>
      {/* nova leva + modo */}
      <Cartao style={{ left: 1150, top: 260, width: 620, height: 580, opacity: painel, transform: `translateX(${(1 - painel) * 120}px)`, padding: 40, boxSizing: "border-box" }}>
        <Rotulo cor={C.teal}>Nova leva</Rotulo>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 84, color: C.ink, marginTop: 10, letterSpacing: "-0.03em" }}>{n} vídeos</div>
        <div style={{ display: "flex", gap: 8, marginTop: 18, height: 96 }}>
          {Array.from({ length: n }).map((_, i) => (
            <Img key={i} src={staticFile(`posters/${String(i + 1).padStart(2, "0")}.jpg`)} style={{ width: 54, height: 96, objectFit: "cover", borderRadius: 8 }} />
          ))}
        </div>
        <Rotulo style={{ marginTop: 50 }}>Modo</Rotulo>
        <div style={{ display: "flex", marginTop: 16, border: `1.5px solid ${C.borda}`, borderRadius: 16, padding: 6, gap: 6, background: "#081110" }}>
          {["Manual", "Automático", "Turbo"].map((m) => {
            const ativo = m === "Automático" && apertou;
            return (
              <div key={m} style={{ position: "relative", flex: 1, textAlign: "center", padding: "20px 0", borderRadius: 12, fontFamily: SANS, fontWeight: 700, fontSize: 30,
                                    color: ativo ? C.escuro : C.mudo, background: ativo ? C.teal : "transparent", transform: `scale(${ativo ? 1 + 0.06 * (1 - onda) : 1})`, overflow: "visible" }}>
                {m}
                {m === "Automático" && apertou && (
                  <div style={{ position: "absolute", left: "50%", top: "50%", width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: 20,
                                border: `3px solid ${C.teal}`, transform: `scale(${1 + onda * 7})`, opacity: 1 - onda }} />
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 34, display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 22px", borderRadius: 999, background: "rgba(94,214,197,0.12)",
                      border: `1.5px solid rgba(94,214,197,0.35)`, opacity: toast, transform: `translateY(${(1 - toast) * 30}px)` }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.teal, boxShadow: `0 0 14px ${C.teal}` }} />
          <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 26, color: C.ink }}>Piloto ligado</span>
        </div>
      </Cartao>
      {f >= pw(42) && <Cursor x={cx} y={cy} escala={apertou ? 1 - 0.12 * (1 - onda) : 1} />}
    </AbsoluteFill>
  );
};

/* ───────────── 6. Veo ───────────── */
const EV_VEO = (b: number): Evento[] => [
  { em: b - 400, hora: "18:20", txt: "Take 5 do vídeo 33: imagens limpas" },
  { em: b - 390, hora: "18:20", txt: "Take 2 do vídeo 33 baixado" },
  { em: b - 380, hora: "18:20", txt: "Take 6 do vídeo 33: imagens limpas" },
  { em: b - 370, hora: "18:21", txt: "Take 7 do vídeo 33: imagens limpas" },
  { em: b - 360, hora: "18:21", txt: "Take 2 do vídeo 33 pronto" },
  { em: b + 4, hora: "18:21", txt: "Take 1 do vídeo 34 enviado ao Veo" },
  { em: b + 22, hora: "18:21", txt: "Take 2 do vídeo 34 enviado ao Veo" },
  { em: b + 40, hora: "18:22", txt: "Take 3 do vídeo 33 pronto" },
  { em: b + 56, hora: "18:22", txt: "Take 3 do vídeo 34 enviado ao Veo" },
  { em: b + 74, hora: "18:22", txt: "Take 1 do vídeo 34 baixado" },
];
export const Veo: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const ent = mola(f, inicio, { damping: 17 });
  const zoom = lin(f, inicio + 10, inicio + 87, 1, 1.18, (t) => t);
  const ev = EV_VEO(pw(49));
  const card = mola(f, pw(49) - 2, { damping: 14 });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <GradePontos opacidade={0.4} />
      <div style={{ position: "absolute", left: 130, top: 300, width: 640 }}>
        <Rotulo cor={C.teal} style={{ opacity: lin(f, pw(46), pw(46) + 5, 0, 1) }}>A IA de vídeo do Google</Rotulo>
        <div style={{ ...titulo, fontSize: 200, color: C.ink, marginTop: 10 }}><Palavra f={f} em={pw(49)}>Veo</Palavra></div>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 52, color: C.mudo, marginTop: 6 }}>
          <Palavra f={f} em={pw(52)}>monta</Palavra><Palavra f={f} em={pw(54)} style={{ color: C.ink }}>cada</Palavra><Palavra f={f} em={pw(55)} style={{ color: C.ink }}>cena</Palavra>
        </div>
      </div>
      <div style={{ position: "absolute", left: 800, top: 170, width: 1000, height: 740, perspective: 1800 }}>
        <div style={{ width: 1000, height: 740, borderRadius: 22, overflow: "hidden", border: `1.5px solid ${C.borda}`, boxShadow: "0 50px 120px rgba(0,0,0,.6)",
                      transform: `rotateY(${-12 + 6 * ent}deg) translateX(${(1 - ent) * 400}px)`, opacity: ent }}>
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "40% 90%" }}>
            <PainelReal f={f} trim={fr(20)} reg={{ x: 470, y: 160, w: 1200, h: 880 }} largura={1000} eventos={ev} />
          </div>
        </div>
      </div>
      {/* o feed em tamanho legivel, saltando para frente */}
      <div style={{ position: "absolute", left: 610, top: 640, transform: `scale(${1.5 * card})`, transformOrigin: "0 0", opacity: card,
                    borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.7)", border: `1.5px solid rgba(94,214,197,0.35)` }}>
        <div style={{ position: "relative", width: 505, height: 250, overflow: "hidden" }}>
          <FeedMock f={f} eventos={ev} x={0} y={0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 7. Montagem: narracao, legenda, finalizado ───────────── */
const Onda: React.FC<{ f: number; ativo: number }> = ({ f, ativo }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, height: 60 }}>
    {Array.from({ length: 26 }).map((_, i) => (
      <div key={i} style={{ width: 6, borderRadius: 3, background: C.teal, height: 8 + ativo * 48 * Math.abs(Math.sin(f / 3.2 + i * 0.7) * Math.sin(i * 1.3 + f / 7)) }} />
    ))}
  </div>
);
export const Montagem: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const fone = mola(f, inicio, { damping: 16 });
  const passos = [
    { t: "Narração", em: pw(58) },
    { t: "Legenda", em: pw(61) },
    { t: "Vídeo finalizado", em: pw(65) },
  ];
  const pronto = mola(f, pw(66) + 4, { damping: 9, stiffness: 260 });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <GradePontos opacidade={0.4} />
      <div style={{ position: "absolute", left: 250, top: 120, width: 470, height: 836, borderRadius: 44, border: "10px solid #141c1b", overflow: "hidden",
                    boxShadow: "0 50px 120px rgba(0,0,0,.6)", transform: `translateY(${(1 - fone) * 300}px) rotate(${(1 - fone) * -8}deg)`, opacity: fone }}>
        <OffthreadVideo src={staticFile("landing/05.mp4")} trimBefore={fr(1)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: `rgba(6,16,15,${0.55 * lin(f, pw(65), pw(65) + 8, 1, 0)})` }} />
      </div>
      <div style={{ position: "absolute", left: 300, top: 420, width: 400, textAlign: "center", transform: `rotate(-9deg) scale(${pronto * 1})`, opacity: lin(f, pw(66) + 3, pw(66) + 6, 0, 1),
                    border: `6px solid ${C.teal}`, borderRadius: 18, padding: "16px 0", background: "rgba(6,16,15,0.75)", ...titulo, fontSize: 92, color: C.teal }}>PRONTO</div>
      <div style={{ position: "absolute", left: 860, top: 210, width: 920, display: "flex", flexDirection: "column", gap: 34 }}>
        {passos.map((p, i) => {
          const s = mola(f, p.em - 2, { damping: 15 });
          const ok = mola(f, p.em + 12, { damping: 10 });
          const ativo = lin(f, p.em, p.em + 6, 0, 1) * lin(f, (passos[i + 1]?.em ?? 9999), (passos[i + 1]?.em ?? 9999) + 8, 1, 0.3);
          return (
            <Cartao key={p.t} style={{ position: "relative", height: 180, padding: "0 40px", display: "flex", alignItems: "center", gap: 34, opacity: s,
                                      transform: `translateX(${(1 - s) * 200}px)`, borderColor: ativo > 0.6 ? "rgba(94,214,197,0.5)" : C.borda }}>
              <div style={{ fontFamily: MONO, fontSize: 22, color: C.teal }}>0{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.ink, letterSpacing: "-0.03em" }}>{p.t}</div>
                {i === 0 && <Onda f={f} ativo={ativo} />}
                {i === 1 && (
                  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, marginTop: 6 }}>
                    {["palavra", "por", "palavra"].map((w, k) => (
                      <span key={k} style={{ marginRight: 12, color: f > p.em + 5 + k * 5 ? C.amber : "rgba(239,233,220,0.35)" }}>{w}</span>
                    ))}
                  </div>
                )}
                {i === 2 && (
                  <div style={{ marginTop: 14, height: 12, borderRadius: 6, background: "rgba(239,233,220,0.1)", width: 560 }}>
                    <div style={{ height: 12, borderRadius: 6, background: C.teal, width: 560 * lin(f, p.em, p.em + 12, 0, 1) }} />
                  </div>
                )}
              </div>
              <div style={{ width: 70, height: 70, borderRadius: 35, background: C.teal, color: C.escuro, display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 40, fontWeight: 900, transform: `scale(${ok})` }}>✓</div>
            </Cartao>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 8. Sozinha ───────────── */
const EV_SOZ = (b: number): Evento[] => [
  { em: b - 300, hora: "18:22", txt: "Take 3 do vídeo 34 enviado ao Veo" },
  { em: b - 290, hora: "18:22", txt: "Take 1 do vídeo 34 baixado" },
  { em: b - 280, hora: "18:22", txt: "Take 1 do vídeo 34 pronto" },
  { em: b - 270, hora: "18:23", txt: "Take 2 do vídeo 34 baixado" },
  { em: b - 260, hora: "18:23", txt: "Vídeo 33 entregue" },
  { em: b + 10, hora: "18:23", txt: "Take 4 do vídeo 34 enviado ao Veo" },
  { em: b + 34, hora: "18:23", txt: "Take 2 do vídeo 34 pronto" },
  { em: b + 58, hora: "18:24", txt: "Take 1 do vídeo 35 enviado ao Veo" },
  { em: b + 80, hora: "18:24", txt: "Take 3 do vídeo 34 baixado" },
];
export const Sozinha: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const ent = mola(f, inicio, { damping: 18 });
  const push = lin(f, inicio, inicio + 102, 1.0, 1.1, (t) => t);
  const sem = pw(68), mexer = pw(70);
  const risco = lin(f, mexer, mexer + 8, 0, 1);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <div style={{ position: "absolute", left: 160, top: 70, width: 1600, height: Math.round(1002 * 1600 / 1688), borderRadius: 22, overflow: "hidden", border: `1.5px solid ${C.borda}`,
                    transform: `scale(${(0.9 + 0.1 * ent) * push})`, transformOrigin: "30% 30%", boxShadow: "0 50px 120px rgba(0,0,0,.6)" }}>
        <PainelReal f={f} trim={fr(100)} reg={{ x: 232, y: 38, w: 1688, h: 1002 }} largura={1600} eventos={EV_SOZ(inicio)} />
        {/* anel pulsando no "Piloto trabalhando" (x 515, y 205 na gravacao) */}
        <div style={{ position: "absolute", left: (515 - 232) * (1600 / 1688) - 30, top: (205 - 38) * (1600 / 1688) - 30, width: 60, height: 60, borderRadius: 30,
                      border: `3px solid ${C.teal}`, transform: `scale(${1 + ((f % 30) / 30) * 1.6})`, opacity: 1 - (f % 30) / 30 }} />
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(6,16,15,0.96) 0%, rgba(6,16,15,0.75) 30%, transparent 58%)" }} />
      <div style={{ position: "absolute", left: 150, bottom: 110 }}>
        <div style={{ ...titulo, fontSize: 170, color: C.ink }}><Palavra f={f} em={pw(67)}>Sozinha.</Palavra></div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 58, color: C.mudo, marginTop: 8, letterSpacing: "-0.02em" }}>
          <Palavra f={f} em={sem}>sem</Palavra><Palavra f={f} em={pw(69)}>você</Palavra><Palavra f={f} em={mexer} style={{ color: C.ink }}>mexer</Palavra><Palavra f={f} em={pw(71)}>em</Palavra><Palavra f={f} em={pw(72)} style={{ color: C.ink }}>nada.</Palavra>
        </div>
      </div>
      {f >= sem && (
        <div style={{ position: "absolute", left: 1500, top: 760, width: 150, height: 150, opacity: lin(f, sem, sem + 6, 0, 1) }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 75, background: "rgba(255,90,78,0.12)", border: `3px solid ${C.red}` }} />
          <Cursor x={52} y={38} escala={1.3} />
          <div style={{ position: "absolute", left: 18, top: 72, width: 114 * risco, height: 7, background: C.red, borderRadius: 4, transform: "rotate(-45deg)", transformOrigin: "57px 3px", marginLeft: 0 }} />
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ───────────── 9. Madrugada ───────────── */
export const Madrugada: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const acordar = pw(86);
  const dia = lin(f, acordar - 4, acordar + 10, 0, 1);
  const prog = lin(f, inicio + 6, acordar, 0, 1, (t) => t);
  const minutos = Math.round(prog * 480);
  const h = (23 + Math.floor(minutos / 60)) % 24, m = minutos % 60;
  const relogio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const total = 32;
  const feitos = Math.floor(prog * total);
  const cont = Math.floor(prog * 96);
  const tinta = dia > 0.5 ? C.escuro : C.ink;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.noite1} 0%, ${C.noite2} 100%)` }} />
      {Array.from({ length: 90 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", left: random(`x${i}`) * W, top: random(`y${i}`) * H * 0.8, width: 2 + random(`s${i}`) * 2.5, height: 2 + random(`s${i}`) * 2.5,
                              borderRadius: 3, background: "#fff", opacity: (0.25 + 0.6 * Math.abs(Math.sin(f / 9 + i))) * (1 - dia) }} />
      ))}
      <div style={{ position: "absolute", left: 820, top: 120 + prog * 200, width: 110, height: 110, borderRadius: 55, background: "#F4EBD3",
                    boxShadow: "0 0 80px rgba(244,235,211,.45)", opacity: 1 - dia }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #F6D9A0 0%, #EFE9DC 70%)", opacity: dia }} />
      <div style={{ position: "absolute", left: 760, top: 900 - dia * 260, width: 230, height: 230, borderRadius: 115, background: C.amber, boxShadow: `0 0 120px ${C.amber}`, opacity: dia }} />
      <div style={{ position: "absolute", left: 140, top: 230 }}>
        <Rotulo cor={dia > 0.5 ? "#6b5a3a" : "#8d93c4"}>{dia > 0.5 ? "Bom dia" : "Enquanto você dorme"}</Rotulo>
        <div style={{ fontFamily: MONO, fontSize: 200, color: tinta, letterSpacing: "-0.04em", marginTop: 6 }}>{relogio}</div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 56, color: tinta, letterSpacing: "-0.02em", marginTop: 20, width: 720, lineHeight: 1.12 }}>
          {f < pw(78) ? (
            <><Palavra f={f} em={pw(73)}>A</Palavra><Palavra f={f} em={pw(74)}>ferramenta</Palavra><Palavra f={f} em={pw(75)}>trabalha</Palavra><Palavra f={f} em={pw(76)}>produzindo</Palavra><Palavra f={f} em={pw(77)} style={{ color: C.teal }}>sozinha</Palavra></>
          ) : (
            <><Palavra f={f} em={pw(80)}>entrega</Palavra><Palavra f={f} em={pw(81)}>os</Palavra><Palavra f={f} em={pw(82)}>vídeos</Palavra><Palavra f={f} em={pw(83)}>prontos</Palavra>
              <Palavra f={f} em={pw(84)} style={{ color: dia > 0.5 ? "#B36B00" : C.amber }}>ao</Palavra><Palavra f={f} em={pw(85)} style={{ color: dia > 0.5 ? "#B36B00" : C.amber }}>você</Palavra><Palavra f={f} em={pw(86)} style={{ color: dia > 0.5 ? "#B36B00" : C.amber }}>acordar.</Palavra></>
          )}
        </div>
      </div>
      <div style={{ position: "absolute", left: 1060, top: 150, width: 740 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: MONO, fontSize: 96, color: dia > 0.5 ? C.escuro : C.teal }}>{cont}</span>
          <Rotulo cor={dia > 0.5 ? "#6b5a3a" : "#8d93c4"}>vídeos prontos</Rotulo>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 10, marginTop: 18 }}>
          {Array.from({ length: total }).map((_, i) => {
            const vis = i < feitos;
            const s = vis ? mola(f, inicio + 6 + (i / total) * (acordar - inicio - 6), { damping: 12 }) : 0;
            return (
              <div key={i} style={{ height: 150, borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {vis && <Img src={staticFile(`posters/${String((i % 12) + 1).padStart(2, "0")}.jpg`)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${0.4 + 0.6 * s})`, opacity: s }} />}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 10. Mais de cem ───────────── */
export const Cem: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const cem = pw(95);
  const n = Math.round(lin(f, pw(93), cem, 96, 100, (t) => t));
  const mais = mola(f, cem, { damping: 9, stiffness: 240 });
  const bate = 1 + 0.08 * Math.exp(-(f - cem) / 4) * (f >= cem ? 1 : 0);
  const nav = mola(f, inicio + 4, { damping: 17 });
  const rola = lin(f, inicio + 26, inicio + 103, 0, 1150, (t) => t * (2 - t));
  return (
    <AbsoluteFill style={{ background: "#EFE9DC" }}>
      <GradePontos cor="rgba(6,16,15,0.08)" />
      <div style={{ position: "absolute", left: 120, top: 210 }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 52, color: "#3d4a47", letterSpacing: "-0.02em" }}>
          <Palavra f={f} em={pw(87)}>Uma</Palavra><Palavra f={f} em={pw(88)}>noite</Palavra><Palavra f={f} em={pw(89)}>de</Palavra><Palavra f={f} em={pw(90)}>trabalho</Palavra>
        </div>
        <div style={{ ...titulo, fontSize: 330, color: C.escuro, display: "flex", alignItems: "flex-start", transform: `scale(${bate})`, transformOrigin: "0 50%",
                      opacity: lin(f, pw(92), pw(92) + 4, 0, 1) }}>
          <span style={{ color: "#0E8C7E", display: "inline-block", width: 200 * mais, transform: `scale(${mais})`, overflow: "visible" }}>+</span>
          <span>{n}</span>
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 64, color: C.escuro, letterSpacing: "-0.02em", marginTop: -10 }}>
          <Palavra f={f} em={pw(96)}>vídeos</Palavra><Palavra f={f} em={pw(97)}>de</Palavra><Palavra f={f} em={pw(98)} style={{ color: "#0E8C7E" }}>manhã.</Palavra>
        </div>
      </div>
      <div style={{ position: "absolute", left: 1010, top: 140, width: 820, height: 800, borderRadius: 20, overflow: "hidden", background: "#06100F",
                    boxShadow: "0 50px 110px rgba(6,16,15,.35)", transform: `translateX(${(1 - nav) * 700}px) rotate(${(1 - nav) * 5}deg)` }}>
        <div style={{ height: 46, display: "flex", alignItems: "center", gap: 9, padding: "0 18px", background: "#0E1A19" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
          <div style={{ marginLeft: 16, flex: 1, height: 26, borderRadius: 13, background: "#06100F", fontFamily: MONO, fontSize: 13, color: C.mudo, display: "flex", alignItems: "center", paddingLeft: 14 }}>portfólio · vídeos gerados</div>
        </div>
        <Img src={staticFile("landing/pagina_inteira.png")} style={{ width: 820, transform: `translateY(${-rola}px)` }} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────── 11. Fecho ───────────── */
export const Fecho: React.FC<{ inicio: number }> = ({ inicio }) => {
  const f = useAbs(inicio);
  const fim = 1215;
  const some = lin(f, fim - 16, fim - 2, 0, 1);
  const risco = lin(f, pw(103) + 2, pw(103) + 10, 0, 1);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Parede f={f} opacidade={0.16 * (1 - some)} vel={2.4} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(6,16,15,0.5) 0%, #06100F 75%)" }} />
      <div style={{ position: "absolute", top: 330, width: W, textAlign: "center", ...titulo, fontSize: 170, color: C.ink, opacity: 1 - some, transform: `scale(${1 - 0.1 * some})` }}>
        <div><Palavra f={f} em={pw(99)}>Volume</Palavra><Palavra f={f} em={pw(100)}>de</Palavra><Palavra f={f} em={pw(101)}>agência,</Palavra></div>
        <div style={{ marginTop: 20 }}>
          <Palavra f={f} em={pw(102)} style={{ color: C.amber }}>sem</Palavra>
          <Palavra f={f} em={pw(103)} style={{ color: C.teal, position: "relative" }}>
            agência.
            <span style={{ position: "absolute", left: 0, bottom: -14, height: 12, borderRadius: 6, width: `${risco * 100}%`, background: C.teal }} />
          </Palavra>
        </div>
      </div>
      <div style={{ position: "absolute", left: W / 2 - 16, top: 820, width: 32, height: 32, borderRadius: 16, background: C.teal, boxShadow: `0 0 40px ${C.teal}`,
                    opacity: lin(f, pw(103) + 10, pw(103) + 16, 0, 1) * (1 - lin(f, fim - 6, fim, 0, 1)), transform: `scale(${1 + some * 0.6})` }} />
    </AbsoluteFill>
  );
};
