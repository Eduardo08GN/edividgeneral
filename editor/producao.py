# -*- coding: utf-8 -*-
"""PRODUCAO — voz, narracao e render de um projeto do AutoTube (um trabalho por vez, em segundo plano).

    amostra_voz(voz, texto)   ~10 s da copy na voz escolhida (para escolher pelo ouvido)
    narrar(pid)               copy -> MiniMax -> narracao.wav + tempo de cada palavra (whisper + alinhamento forcado)
    renderizar(pid, previa)   Remotion -> loudnorm -14 LUFS -> versoes/vN.mp4 + folha de contato (1 quadro/s)

Licoes que valem aqui (do editingtool e do explicativo):
⛔ Porta propria por render (a 3000 e' do site Next.js do operador) e --public-dir proprio com LINKS, nao copias.
⛔ Concorrencia 6: a maquina divide CPU com outras ferramentas (o AutomaWeb Studio produz ao mesmo tempo).
⛔ O mix do Remotion nao tem loudnorm: o audio final passa por loudnorm em 2 passadas (-14 LUFS, pico -1,5).
⛔ Saida yuv420p bt709 (yuvj420p trava em celular), faststart.
"""
import json, os, re, shutil, subprocess, threading, time

from . import alinhar, config, musica, projeto, tts

REMOTION = os.path.join(config.RAIZ, "remotion")
NPX = "npx.cmd" if os.name == "nt" else "npx"
TEXTO_AMOSTRA = "Este é o AutoTube. Você escolhe a voz pelo ouvido, e ela narra o seu vídeo do começo ao fim."


# ── voz ───────────────────────────────────────────────────────────────────────
def trecho_amostra(copy, max_palavras=34):
    """O comeco da copy, cortado no fim de uma frase, com ~10 s."""
    ws = projeto.palavras_da_copy(copy)
    if not ws: return TEXTO_AMOSTRA
    corte = len(ws)
    if len(ws) > max_palavras:
        corte = max_palavras
        for i in range(max_palavras, 8, -1):
            if ws[i - 1][-1] in ".!?": corte = i; break
    return " ".join(ws[:corte])


def amostra_voz(voz, velocidade=1.0, texto=None, destino_dir=None):
    """mp3 com o trecho na voz. Cache da MiniMax por texto+voz: ouvir de novo nao paga de novo."""
    cfg = dict(config.padrao()["tts"], voz=voz, velocidade=float(velocidade))
    texto = (texto or TEXTO_AMOSTRA).strip()
    destino_dir = destino_dir or os.path.join(config.CACHE_DIR, "amostras")
    os.makedirs(destino_dir, exist_ok=True)
    mp3 = os.path.join(destino_dir, f"{config.slug(voz, 60)}_{float(velocidade):.2f}.mp3")
    wav = mp3[:-4] + ".wav"
    dur = tts.sintetizar(texto, wav, cfg, float(velocidade))
    config.ffmpeg(["-i", wav, "-b:a", "160k", mp3]); os.remove(wav)
    return mp3, dur


VOZES_CACHE = os.path.join(config.CACHE_DIR, "vozes.json")


def vozes(atualizar=False):
    """Vozes de sistema da MiniMax: [{id, descricao, idioma, genero}] com cache (a lista nao muda toda hora)."""
    d = config.ler_json(VOZES_CACHE)
    if d and not atualizar: return d
    bruto = tts._post("/v1/get_voice", {"voice_type": "system"})
    out = []
    for v in bruto.get("system_voice") or []:
        vid = v.get("voice_id", "")
        desc = " ".join(v.get("description") or []) if isinstance(v.get("description"), list) else (v.get("description") or "")
        idioma = vid.split("_", 1)[0] if "_" in vid else ""
        txt = (desc + " " + vid).lower()
        genero = "masculina" if re.search(r"\b(male|man|boy|gentleman|husband|godfather|santa|grinch|arnold|reaper|elder|leader|narrator male)\b", txt) and not re.search(r"\b(female|woman|girl|lady|queen)\b", txt) \
            else ("feminina" if re.search(r"\b(female|woman|girl|lady|queen|wife)\b", txt) else "")
        nome = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", vid.split("_", 1)[1] if "_" in vid else vid).replace("-", " ")
        out.append({"id": vid, "nome": nome, "descricao": desc, "idioma": idioma, "genero": genero})
    config.escrever_json(VOZES_CACHE, out)
    return out


# ── narracao ──────────────────────────────────────────────────────────────────
def narrar(pid, log=print):
    p = projeto.carregar(pid)
    copy = (p.get("copy") or "").strip()
    if not copy: raise SystemExit("escreva a copy antes de narrar")
    c = projeto.cfg(p)
    pasta = projeto.pasta(pid)
    wav = os.path.join(pasta, "narracao.wav")
    log(f"Narração: {c['tts']['voz']} a {c['tts']['velocidade']:.2f}×")
    dur = tts.sintetizar(copy, wav, c["tts"], c["tts"]["velocidade"])
    log(f"Narração gerada · {dur:.1f} s")
    pal, rel = alinhar.alinhar(wav, copy, c["whisper"])
    config.escrever_json(os.path.join(pasta, "palavras.json"), {"duracao": dur, "palavras": [list(x) for x in pal]})
    info = {"chave": projeto.chave_narracao(p), "duracao": round(dur, 2), "palavras": len(pal),
            "casamento": round(float(rel.get("razao") or 0), 3), "motor": rel.get("motor"), "fino": bool((rel.get("fino") or {}).get("usado"))}
    projeto.alterar(pid, lambda q: q.__setitem__("narracao", info))
    log(f"Narração alinhada · {len(pal)} palavras · {info['casamento'] * 100:.0f}% da copy")
    return info


# ── modelo "legenda cinetica" ─────────────────────────────────────────────────
def frases(palavras, max_palavras=6):
    """Agrupa as palavras em frases curtas para a tela. Cada sentenca (fim em . ! ?) vira pedacos de tamanho
    EQUILIBRADO, ate' `max_palavras` cada: "Quem posta todo dia / cresce mais rapido." (e nunca "rapido." sozinha)."""
    sentencas, cur = [], []
    for w, a, b in palavras:
        cur.append({"w": w, "de": round(a, 3), "ate": round(b, 3)})
        if w[-1:] in ".!?": sentencas.append(cur); cur = []
    if cur: sentencas.append(cur)
    out = []
    for s in sentencas:
        n = -(-len(s) // max_palavras)
        tam, resto = divmod(len(s), n)
        i = 0
        for k in range(n):
            j = i + tam + (1 if k < resto else 0)
            out.append(s[i:j]); i = j
    return [{"de": f[0]["de"], "ate": f[-1]["ate"], "palavras": f} for f in out]


def _props_legenda(p, pub, c):
    larg, alt = projeto.tamanho(p)
    fps = int(c["render"]["fps"])
    pal = projeto.palavras(p)
    dur = (p.get("narracao") or {}).get("duracao") or (pal[-1][2] if pal else 5)
    total = int(round((dur + 1.6) * fps))
    pasta = projeto.pasta(p["id"])
    projeto.ligar(os.path.join(pasta, "narracao.wav"), os.path.join(pub, "narracao.wav"))
    fontes = os.path.join(REMOTION, "public", "fontes")
    for f in os.listdir(fontes): projeto.ligar(os.path.join(fontes, f), os.path.join(pub, "fontes", f))
    mus = _musica(p, total / fps, pub, c)
    sfx = []
    if c["audio"].get("sfx", True):
        cat = {e["nome"]: e for e in (config.ler_json(os.path.join(config.SFX_DIR, "livre", "catalogo.json"), {}) or {}).get("efeitos", [])}
        for nome in ("whoosh_rapido", "pop_ui"):
            arq = os.path.join(config.SFX_DIR, "livre", f"{nome}.mp3")
            if os.path.exists(arq): projeto.ligar(arq, os.path.join(pub, "sfx", f"{nome}.mp3"))
        fr = frases(pal)
        for i, f in enumerate(fr):
            nome = "whoosh_rapido" if i == 0 or fr[i - 1]["palavras"][-1]["w"][-1:] in ".!?" else "pop_ui"
            if os.path.exists(os.path.join(pub, "sfx", f"{nome}.mp3")):
                sfx.append({"src": f"sfx/{nome}.mp3", "em": f["de"], "pico": (cat.get(nome) or {}).get("pico", 0), "vol": 0.35 if nome == "pop_ui" else 0.45})
    return {"largura": larg, "altura": alt, "fps": fps, "total": total, "duracao": dur, "titulo": p.get("nome", ""),
            "frases": frases(pal), "narracao": "narracao.wav", "musica": mus,
            "musica_vol": c["audio"].get("musica_vol", 0.2), "musica_vol_fim": c["audio"].get("musica_vol_fim", 0.42), "sfx": sfx}


def _musica(p, duracao, pub, c):
    """Trilha da biblioteca livre cortada no tempo do video. 'auto' = a primeira faixa disponivel do catalogo."""
    escolha = (p.get("musica") or {}).get("id", "auto")
    if escolha in ("", "nenhuma") or c["audio"].get("musica") in ("", None): return None
    disp = musica.disponiveis()
    if not disp: return None
    faixa = next((f for f in disp if f["id"] == escolha), disp[0])
    ini = musica.preparar(faixa["arquivo"], duracao, os.path.join(pub, "musica.wav"), (p.get("musica") or {}).get("inicio"))
    projeto.alterar(p["id"], lambda q: q.__setitem__("musica", dict(q.get("musica") or {}, usada=faixa["id"], titulo=faixa["titulo"], inicio_usado=ini)))
    return "musica.wav"


# ── render ────────────────────────────────────────────────────────────────────
_PORTAS = set()
_TRAVA_PORTA = threading.Lock()


def _porta(c):
    import socket
    with _TRAVA_PORTA:
        for p in range(int(c["render"].get("porta", 3131)), int(c["render"].get("porta", 3131)) + 40):
            if p in _PORTAS: continue
            with socket.socket() as s:
                if s.connect_ex(("127.0.0.1", p)) != 0:
                    _PORTAS.add(p); return p
    raise SystemExit("nenhuma porta livre para o render")


def preparar_remotion(log=print):
    """npm install na primeira vez (node_modules fica fora do git)."""
    if os.path.isdir(os.path.join(REMOTION, "node_modules", "@remotion", "cli")): return
    log("Instalando o motor de vídeo (só na primeira vez)…")
    r = config.run(["npm.cmd" if os.name == "nt" else "npm", "install", "--no-audit", "--no-fund"], cwd=REMOTION, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0: raise SystemExit("npm install falhou: " + (r.stderr or r.stdout)[-600:])


def _entrada(p):
    """(arquivo de entrada, id da composicao, public dir, props) conforme o modelo do roteiro."""
    c = projeto.cfg(p)
    rot = p.get("roteiro") or {}
    pasta = projeto.pasta(p["id"])
    if rot.get("modelo") == "proprio":
        cenas = os.path.join(pasta, "cenas")
        if not os.path.isdir(cenas): raise SystemExit("o roteiro 'cenas próprias' não tem a pasta cenas/")
        dest = os.path.join(REMOTION, "src", "_projetos", p["id"])
        shutil.rmtree(dest, ignore_errors=True); shutil.copytree(cenas, dest)
        pub = os.path.join(pasta, "public")
        projeto.ligar(os.path.join(pasta, "narracao.wav"), os.path.join(pub, "narracao.wav"))
        return f"src/_projetos/{p['id']}/index.ts", rot.get("composicao") or "Video", pub, {}
    pub = os.path.join(pasta, "_render", "public")
    shutil.rmtree(pub, ignore_errors=True); os.makedirs(pub)
    return "src/index.ts", "Legenda", pub, _props_legenda(p, pub, c)


def _rodar_remotion(args, progresso, parar):
    """Roda o CLI lendo a saida aos pedacos para mostrar o progresso ("123/1215")."""
    kw = {"creationflags": 0x08000000} if os.name == "nt" else {}
    proc = subprocess.Popen([NPX, "remotion"] + args, cwd=REMOTION, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, **kw)
    cauda, buf = [], b""
    while True:
        if parar is not None and parar.is_set():
            proc.kill(); raise SystemExit("render interrompido")
        pedaco = proc.stdout.read1(4096) if hasattr(proc.stdout, "read1") else proc.stdout.read(4096)
        if not pedaco:
            if proc.poll() is not None: break
            time.sleep(0.05); continue
        buf += pedaco
        partes = re.split(rb"[\r\n]", buf); buf = partes.pop()
        for linha in partes:
            t = linha.decode("utf-8", "replace").strip()
            if not t: continue
            cauda.append(t); del cauda[:-40]
            m = re.findall(r"(\d+)\s*/\s*(\d+)", t)
            if m and progresso:
                a, b = map(int, m[-1])
                if b > 10 and a <= b: progresso(a / b)
    if proc.wait() != 0: raise SystemExit("render falhou:\n" + "\n".join(cauda[-12:]))


def medir_lufs(arq):
    r = config.run([config.FFMPEG, "-hide_banner", "-i", arq, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = re.findall(r"I:\s*(-?\d+(?:\.\d+)?)\s*LUFS", r.stderr or "")
    return float(m[-1]) if m else None


def nivelar(bruto, saida, lufs=-14, pico=-1.5):
    """loudnorm em 2 passadas (medir, depois aplicar linear); o video e' copiado sem reencodar."""
    r = config.run([config.FFMPEG, "-hide_banner", "-i", bruto, "-af", f"loudnorm=I={lufs}:TP={pico}:LRA=11:print_format=json", "-f", "null", "-"],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
    d = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr or "", re.S).group(0))
    af = (f"loudnorm=I={lufs}:TP={pico}:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}"
          f":measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
    config.ffmpeg(["-i", bruto, "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", saida])
    if not os.path.exists(saida): raise SystemExit("nao consegui nivelar o audio")


def folha(video, saida, colunas=8):
    """Folha de contato: 1 quadro por segundo (a mesma leitura otica usada para conferir o explicativo)."""
    d = config.duracao(video)
    linhas = max(1, -(-int(d) // colunas))
    config.ffmpeg(["-i", video, "-vf", f"fps=1,scale=320:-2,tile={colunas}x{linhas}", "-frames:v", "1", "-q:v", "4", saida])


def renderizar(pid, previa=True, log=print, progresso=None, parar=None):
    p = projeto.carregar(pid)
    if not projeto.narracao_ok(p):
        narrar(pid, log); p = projeto.carregar(pid)
    preparar_remotion(log)
    c = projeto.cfg(p)
    entrada, comp, pub, props = _entrada(p)
    p = projeto.carregar(pid)
    pasta = projeto.pasta(pid)
    os.makedirs(os.path.join(pasta, "versoes"), exist_ok=True)
    n = max([v["n"] for v in p.get("versoes") or []] + [0]) + 1
    tipo = "prévia" if previa else "final"
    bruto = os.path.join(pasta, "_render", f"bruto_v{n}.mp4")
    os.makedirs(os.path.dirname(bruto), exist_ok=True)
    arq_props = os.path.join(pasta, "_render", "props.json")
    config.escrever_json(arq_props, props)
    porta = _porta(c)
    r = c["render"]
    args = ["render", entrada, comp, bruto, f"--props={arq_props}", f"--public-dir={pub}", "--codec=h264", f"--crf={r['crf']}",
            f"--x264-preset={r['preset']}", "--pixel-format=yuv420p", "--color-space=bt709", f"--concurrency={r['concorrencia']}",
            f"--port={porta}", "--audio-bitrate=256k"] + ([f"--scale={r.get('escala_previa', 0.5)}"] if previa else [])
    log(f"Renderizando a v{n} ({tipo})…")
    t0 = time.time()
    try:
        _rodar_remotion(args, progresso, parar)
    finally:
        with _TRAVA_PORTA: _PORTAS.discard(porta)
    seg = round(time.time() - t0)
    saida = os.path.join(pasta, "versoes", f"v{n}.mp4")
    nivelar(bruto, saida, c["audio"].get("lufs", -14), c["audio"].get("pico", -1.5))
    os.remove(bruto)
    folha(saida, os.path.join(pasta, "versoes", f"v{n}_folha.jpg"))
    lufs = medir_lufs(saida)
    info = {"n": n, "tipo": tipo, "arquivo": f"versoes/v{n}.mp4", "folha": f"versoes/v{n}_folha.jpg", "criado": projeto._agora(),
            "duracao": round(config.duracao(saida), 2), "lufs": round(lufs, 1) if lufs is not None else None, "render_s": seg,
            "modelo": (p.get("roteiro") or {}).get("modelo"), "voz": c["tts"]["voz"]}
    projeto.alterar(pid, lambda q: q.setdefault("versoes", []).append(info))
    log(f"v{n} pronta ({tipo}) · render {seg // 60} min {seg % 60:02d} s · {info['lufs']} LUFS")
    return info


# ── um trabalho por vez, em segundo plano ─────────────────────────────────────
class Ocupado(Exception):
    """Ja' tem trabalho rodando. ⛔ NAO e' SystemExit: dentro de uma rota do servidor, SystemExit escapa do
    FastAPI e DERRUBA o servidor inteiro (aconteceu no 1o teste do painel, 2026-10-06)."""


class Produtor:
    def __init__(self):
        self.trava = threading.Lock()
        self.thread = None
        self.parar = threading.Event()
        self.pid = None
        self.etapa = None
        self.progresso = 0.0
        self.inicio = None
        self.erro = None

    @property
    def rodando(self):
        return bool(self.thread and self.thread.is_alive())

    def estado(self):
        return {"rodando": self.rodando, "projeto": self.pid if self.rodando else None, "etapa": self.etapa if self.rodando else None,
                "progresso": round(self.progresso, 3), "segundos": round(time.time() - self.inicio) if self.rodando and self.inicio else 0,
                "erro": self.erro}

    def iniciar(self, pid, tarefa):
        """tarefa: 'narrar' | 'previa' | 'final' | 'tudo' (narra, se preciso, e faz a versao final)."""
        if self.rodando: raise Ocupado("já existe um trabalho rodando: espere terminar ou pare")
        projeto.carregar(pid)
        self.parar.clear(); self.pid = pid; self.progresso = 0.0; self.inicio = time.time(); self.erro = None
        self.etapa = {"narrar": "narrando", "previa": "prévia", "final": "versão final", "tudo": "produzindo"}[tarefa]

        def log(t): projeto.log(pid, t)

        def prog(x): self.progresso = max(self.progresso, x)      # o CLI conta de novo na fase de codificar

        def rodar():
            try:
                if tarefa == "narrar": narrar(pid, log)
                else: renderizar(pid, previa=(tarefa == "previa"), log=log, progresso=prog, parar=self.parar)
            except BaseException as e:                   # noqa: BLE001 (SystemExit inclusive)
                self.erro = str(e)[:600]; log(f"⚠ {str(e).splitlines()[0][:200]}")
        self.thread = threading.Thread(target=rodar, daemon=True); self.thread.start()


PRODUTOR = Produtor()
