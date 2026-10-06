# -*- coding: utf-8 -*-
"""MUSICA — trilha livre de direitos para o AutoTube.

⭐ Biblioteca LIVRE (musica/livre/): faixas do Mixkit (licenca gratuita, uso comercial, sem credito).
   O catalogo (musica/livre/catalogo.json) vai no git com a origem e a licenca de cada faixa; os arquivos
   ficam fora do git e se baixam com `python edt.py musica sync`.
⛔ A Meta Sound Collection (do editingtool) NAO entra aqui: a licenca dela so' vale dentro dos apps da Meta,
   e o AutoTube faz video para YouTube, Instagram, TikTok, cliente...
⭐ `janela()`: o trecho da faixa que acompanha o video comeca NUMA BATIDA, com energia alta e estavel, e de
   preferencia logo onde a musica "entra" (salto de energia) — foi assim no explicativo da ferramenta.
"""
import os, urllib.request

from . import config

DIR = os.path.join(config.RAIZ, "musica", "livre")
CATALOGO = os.path.join(DIR, "catalogo.json")


def catalogo():
    return (config.ler_json(CATALOGO, {}) or {}).get("faixas", [])


def arquivo(faixa):
    return os.path.join(DIR, f"{faixa['id']}.mp3")


def sincronizar(log=print):
    """Baixa as faixas do catalogo que faltam (so' de fontes com licenca livre registrada)."""
    os.makedirs(DIR, exist_ok=True)
    n = 0
    for f in catalogo():
        alvo = arquivo(f)
        if os.path.exists(alvo): continue
        log(f"baixando {f['titulo']} ({f['fonte']})")
        req = urllib.request.Request(f["url"], headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(alvo + ".tmp", "wb") as o: o.write(r.read())
        os.replace(alvo + ".tmp", alvo); n += 1
    return n


def disponiveis():
    return [dict(f, arquivo=arquivo(f)) for f in catalogo() if os.path.exists(arquivo(f))]


BATIDAS = os.path.join(config.CACHE_DIR, "batidas.json")


def _carregar(arq, sr=22050, segundos=None):
    import tempfile, librosa
    wav = os.path.join(tempfile.gettempdir(), f"autotube_mus_{os.getpid()}.wav")
    config.ffmpeg((["-t", str(segundos)] if segundos else []) + ["-i", arq, "-ac", "1", "-ar", str(sr), wav])
    try:
        y, _ = librosa.load(wav, sr=sr)
    finally:
        try: os.remove(wav)
        except OSError: pass
    return y


def batidas(arq):
    """(bpm, [instantes das batidas em s]) da faixa inteira, com cache."""
    st = os.stat(arq); chave = f"{os.path.abspath(arq)}|{st.st_size}|{int(st.st_mtime)}"
    cache = config.ler_json(BATIDAS, {}) or {}
    if chave in cache: return cache[chave]["bpm"], cache[chave]["t"]
    import librosa
    y = _carregar(arq)
    bpm, quadros = librosa.beat.beat_track(y=y, sr=22050, units="frames")
    t = [round(float(x), 3) for x in librosa.frames_to_time(quadros, sr=22050)]
    bpm = round(float(bpm[0] if hasattr(bpm, "__len__") else bpm), 1)
    cache[chave] = {"bpm": bpm, "t": t}; config.escrever_json(BATIDAS, cache)
    return bpm, t


def janela(arq, duracao):
    """Inicio (s) do melhor trecho de `duracao` s: comeca numa batida, energia alta e estavel, com um
    salto de energia logo no comeco. Medido no explicativo: 'Deep Urban' -> 15,5 s (onde a faixa entra)."""
    import numpy as np, librosa
    _, bat = batidas(arq)
    y = _carregar(arq)
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    tt = librosa.times_like(rms, sr=22050, hop_length=512)
    total = len(y) / 22050

    def media(a, b):
        m = (tt >= a) & (tt < b)
        return float(rms[m].mean()) if m.any() else 0.0
    melhor = (-1e9, 0.0)
    for b in bat:
        if b + duracao + 1 > total: break
        e = [media(b + i, b + i + 4) for i in range(0, max(4, int(duracao)), 4)]
        nota = np.mean(e) - np.std(e) + 0.5 * (media(b, b + 1.5) - media(b - 2, b))
        if nota > melhor[0]: melhor = (nota, b)
    return round(melhor[1], 2)


def preparar(arq, duracao, destino, inicio=None):
    """Corta a trilha para o video: comeca em `inicio` (ou na melhor janela), some no fim. Devolve o inicio."""
    ini = janela(arq, duracao) if inicio is None else float(inicio)
    fade = min(2.5, duracao / 6)
    config.ffmpeg(["-ss", f"{ini:.2f}", "-t", f"{duracao + 0.6:.2f}", "-i", arq,
                   "-af", f"afade=t=in:d=0.15,afade=t=out:st={max(0, duracao - fade):.2f}:d={fade:.2f}", "-ar", "48000", destino])
    return ini


TONS = os.path.join(config.CACHE_DIR, "tons.json")
_PERFIL_MAIOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
_PERFIL_MENOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]


def tom(arq):
    """(tonica 0-11 com 0=Do, "maior"|"menor") da faixa, com cache. Para afinar os SFX na musica."""
    st = os.stat(arq); chave = f"{os.path.abspath(arq)}|{st.st_size}|{int(st.st_mtime)}"
    cache = config.ler_json(TONS, {}) or {}
    if chave in cache: return tuple(cache[chave])
    import numpy as np, librosa
    y = _carregar(arq, segundos=90)
    croma = librosa.feature.chroma_cqt(y=y, sr=22050).mean(axis=1)
    melhor = (-9, 0, "maior")
    for t in range(12):
        for modo, perfil in (("maior", _PERFIL_MAIOR), ("menor", _PERFIL_MENOR)):
            r = float(np.corrcoef(croma, np.roll(perfil, t))[0, 1])
            if r > melhor[0]: melhor = (r, t, modo)
    cache[chave] = [melhor[1], melhor[2]]; config.escrever_json(TONS, cache)
    return melhor[1], melhor[2]
