import React from "react";
import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Legenda, type PropsLegenda } from "./modelos/Legenda";

// Fontes locais (as mesmas do painel): o render nao depende de fonte instalada na maquina.
const espera = delayRender("fontes");
Promise.all([
  loadFont({ family: "Bricolage", url: staticFile("fontes/bricolage-latin.woff2"), weight: "200 800" }),
  loadFont({ family: "Bricolage", url: staticFile("fontes/bricolage-latin-ext.woff2"), weight: "200 800" }),
  loadFont({ family: "JBMono", url: staticFile("fontes/jbmono.woff2"), weight: "400" }),
]).then(() => continueRender(espera)).catch((e) => { console.error(e); continueRender(espera); });

const vazio: PropsLegenda = {
  largura: 1920, altura: 1080, fps: 30, total: 90, duracao: 2, titulo: "AutoTube", frases: [], narracao: "narracao.wav",
  musica: null, musica_vol: 0.2, musica_vol_fim: 0.42, sfx: [],
};

export const Root: React.FC = () => (
  <Composition id="Legenda" component={Legenda as React.FC<any>} defaultProps={vazio} durationInFrames={90} fps={30} width={1920} height={1080}
               calculateMetadata={({ props }) => {
                 const p = props as PropsLegenda;
                 return { durationInFrames: Math.max(1, p.total), fps: p.fps, width: p.largura, height: p.altura };
               }} />
);
