import { useEffect, useState } from "react";
import type { EtapaId } from "./api";

// rotas por hash: #/ · #/novo · #/p/<id>[/<etapa>] · #/biblioteca · #/ajustes
export type Rota = { tela: "projetos" | "novo" | "projeto" | "biblioteca" | "ajustes"; id?: string; etapa?: EtapaId };

function ler(): Rota {
  const h = location.hash.replace(/^#\/?/, "");
  if (h.startsWith("p/")) {
    const [, id, etapa] = h.split("/");
    return { tela: "projeto", id: decodeURIComponent(id), etapa: (etapa || undefined) as EtapaId | undefined };
  }
  if (h.startsWith("novo")) return { tela: "novo" };
  if (h.startsWith("biblioteca")) return { tela: "biblioteca" };
  if (h.startsWith("ajustes")) return { tela: "ajustes" };
  return { tela: "projetos" };
}

export function useRota(): Rota {
  const [r, setR] = useState(ler());
  useEffect(() => {
    const f = () => setR(ler());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}

export const link = {
  projetos: "#/", novo: "#/novo", biblioteca: "#/biblioteca", ajustes: "#/ajustes",
  projeto: (id: string, etapa?: EtapaId) => `#/p/${encodeURIComponent(id)}${etapa ? `/${etapa}` : ""}`,
};
