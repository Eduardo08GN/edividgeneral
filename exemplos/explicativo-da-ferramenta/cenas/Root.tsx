import React from "react";
import { Composition, continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import { Explicativo, TOTAL } from "./Explicativo";

// Fontes locais (as mesmas do painel e da landing): o render nao depende de fonte instalada.
const espera = delayRender("fontes");
Promise.all([
  loadFont({ family: "Bricolage", url: staticFile("fontes/bricolage-latin.woff2"), weight: "200 800" }),
  loadFont({ family: "Bricolage", url: staticFile("fontes/bricolage-latin-ext.woff2"), weight: "200 800" }),
  loadFont({ family: "JBMono", url: staticFile("fontes/jbmono.woff2"), weight: "400" }),
  loadFont({ family: "PublicSans", url: staticFile("fontes/publicsans-400.woff2"), weight: "400" }),
  loadFont({ family: "PublicSans", url: staticFile("fontes/publicsans-500.woff2"), weight: "500" }),
]).then(() => continueRender(espera)).catch((e) => { console.error(e); continueRender(espera); });

export const Root: React.FC = () => (
  <Composition id="Explicativo" component={Explicativo} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
);
