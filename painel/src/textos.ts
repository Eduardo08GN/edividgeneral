export const numero = (n: number) => n.toLocaleString("pt-BR");
export const seg = (s: number | null | undefined) => (s == null ? "—" : `${Math.round(s)} s`);
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const tempoRender = (s: number) => (s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`);

export function quando(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  const hh = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `hoje, ${hh}`;
  return `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}, ${hh}`;
}

/** "Portuguese_Deep-VoicedGentleman" -> "Deep-Voiced Gentleman" */
export const nomeVoz = (id?: string) => (id ? id.replace(/^[A-Za-z]+_/, "").replace(/(?<=[a-z])(?=[A-Z])/g, " ") : "—");

export const IDIOMA: Record<string, string> = {
  Portuguese: "Português", English: "Inglês", Spanish: "Espanhol", French: "Francês", German: "Alemão", Italian: "Italiano",
};

export const DESTINOS = ["YouTube", "Instagram", "TikTok", "WhatsApp", "Cliente"];
