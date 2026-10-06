# -*- coding: utf-8 -*-
r"""SERVIDOR — o AutoTube por HTTP, para o painel (painel/dist). Padrao herdado do ow_agente
(agente/servidor.py, so' consulta): FastAPI em 127.0.0.1, senha da sessao em toda rota /api.

    python edt.py painel [--porta 8801] [--sem-janela]

Leitura                                   Acoes (POST)
  GET /api/estado                           /api/projetos                    {nome, formato, duracao_alvo, destino, briefing, modo}
  GET /api/projetos/{id}                    /api/projetos/{id}               {campos que mudaram}
  GET /api/vozes[?atualizar=1]              /api/projetos/{id}/amostra       {voz, velocidade}
  GET /api/musicas  GET /api/sfx            /api/projetos/{id}/produzir      {tarefa: narrar|previa|final|tudo}
  GET /api/ajustes                          /api/vozes/amostra               {voz, velocidade}
  GET /api/midia?caminho=                   /api/ajustes  /api/parar  /api/abrir-pasta {caminho}
  GET /api/miniatura?caminho=&w=&t=
⛔ `?k=` (senha) tambem vale na URL: <video src> nao manda cabecalho.
⛔ Midia so' de dentro de projetos/, musica/, sfx/ e das amostras — o servidor nao serve o disco inteiro.
"""
import hashlib, os, secrets, shutil, socket, threading

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from . import config, musica, producao, projeto

PAINEL = os.path.join(config.RAIZ, "painel", "dist")
CACHE_MINI = os.path.join(config.CACHE_DIR, "miniaturas")
AJUSTES = os.path.join(config.CACHE_DIR, "ajustes.json")
RAIZES = [config.PROJETOS_DIR, os.path.join(config.RAIZ, "musica"), config.SFX_DIR, os.path.join(config.CACHE_DIR, "amostras")]
VERSAO = "1.0"


def _carregar(pid):
    try:
        return projeto.carregar(pid)
    except FileNotFoundError:
        raise HTTPException(404, "projeto não existe")


def detalhe(pid):
    p = _carregar(pid)
    pasta = projeto.pasta(pid)
    vs = projeto.versoes(p)
    for v in vs:
        if v.get("folha"): v["folha"] = os.path.join(pasta, v["folha"])
    mat = []
    for m in p.get("material") or []:
        arq = os.path.join(pasta, m["arquivo"]) if not os.path.isabs(m["arquivo"]) else m["arquivo"]
        if os.path.exists(arq): mat.append(dict(m, caminho=arq))
    amostras = {}
    for v, a in (p.get("amostras") or {}).items():
        arq = os.path.join(pasta, a)
        if os.path.exists(arq): amostras[v] = arq
    nar = p.get("narracao") or {}
    return dict(p, pasta=pasta, etapas=projeto.etapas(p), versoes=vs, material=mat, amostras=amostras,
                tem_cenas=os.path.isdir(os.path.join(pasta, "cenas")),
                narracao=dict(nar, ok=projeto.narracao_ok(p), arquivo=os.path.join(pasta, "narracao.wav")) if nar else None,
                estimativa={"palavras": len(projeto.palavras_da_copy(p.get("copy"))), "segundos": projeto.duracao_estimada(p.get("copy"))},
                efetivo={"voz": projeto.cfg(p)["tts"]["voz"], "velocidade": projeto.cfg(p)["tts"]["velocidade"]})


def _conexoes():
    return {"minimax": bool(os.environ.get("MINIMAX_API_KEY")),
            "motor": os.path.isdir(os.path.join(producao.REMOTION, "node_modules", "@remotion", "cli")) or bool(shutil.which("npm")),
            "claude": bool(shutil.which("claude"))}


def miniatura(caminho, largura=360, t=None):
    """JPEG pequeno: de imagem, redimensiona; de video, tira o quadro em `t` s (padrao: 30% do video)."""
    st = os.stat(caminho)
    chave = hashlib.sha1(f"{os.path.realpath(caminho)}|{st.st_size}|{st.st_mtime_ns}|{largura}|{t}".encode()).hexdigest()
    destino = os.path.join(CACHE_MINI, chave + ".jpg")
    if os.path.exists(destino): return destino
    os.makedirs(CACHE_MINI, exist_ok=True)
    if caminho.lower().endswith((".mp4", ".mov", ".m4v", ".webm", ".mkv")):
        tt = t if t is not None else max(0.0, config.duracao(caminho) * 0.3)
        config.ffmpeg(["-ss", f"{tt:.2f}", "-i", caminho, "-frames:v", "1", "-vf", f"scale={largura}:-2", "-q:v", "4", destino])
    else:
        from PIL import Image
        with Image.open(caminho) as im:
            im = im.convert("RGB"); im.thumbnail((largura, largura * 4)); im.save(destino, "JPEG", quality=82)
    if not os.path.exists(destino): raise HTTPException(500, "não consegui gerar a miniatura")
    return destino


def dentro(caminho):
    real = os.path.realpath(caminho)
    return any(real.startswith(os.path.realpath(r) + os.sep) for r in RAIZES)


# ── app ───────────────────────────────────────────────────────────────────────
class Novo(BaseModel):
    nome: str
    formato: str = "16:9"
    duracao_alvo: int = 40
    destino: str = ""
    briefing: dict = {}
    modo: str = "guiado"


class Amostra(BaseModel):
    voz: str
    velocidade: float = 1.0


class Produzir(BaseModel):
    tarefa: str = "previa"


class Caminho(BaseModel):
    caminho: str


def _amostra(voz, velocidade, texto=None, pasta=None):
    """Amostra de voz sem derrubar nada: falha da MiniMax (rede, chave, voz) vira erro legivel na tela."""
    try:
        return producao.amostra_voz(voz, velocidade, texto, pasta)
    except BaseException as e:                                   # noqa: BLE001 (SystemExit inclusive)
        raise HTTPException(502, f"a MiniMax não gerou a amostra: {str(e)[:200]}")


EDITAVEIS = {"nome", "formato", "duracao_alvo", "destino", "modo", "briefing", "copy", "voz", "roteiro", "musica"}


def _editar(pid, novo):
    novo = {k: v for k, v in novo.items() if k in EDITAVEIS}
    if "formato" in novo and novo["formato"] not in projeto.FORMATOS: raise HTTPException(400, "formato inválido")

    def ed(p):
        antes_copy = p.get("copy", "")
        for k, v in novo.items():
            if k in ("briefing", "voz", "roteiro", "musica") and isinstance(v, dict): p.setdefault(k, {}).update(v)
            else: p[k] = v
        if "copy" in novo and (novo["copy"] or "").strip() != (antes_copy or "").strip():
            projeto.registrar(p, f"Copy salva · {len(projeto.palavras_da_copy(novo['copy']))} palavras")
        if "voz" in novo and novo["voz"].get("id"):
            projeto.registrar(p, f"Voz escolhida: {novo['voz'].get('nome') or novo['voz']['id']} · {float(p['voz'].get('velocidade', 1.0)):.2f}×")
        if "roteiro" in novo: projeto.registrar(p, f"Roteiro: {projeto.MODELOS.get(p['roteiro'].get('modelo'), '—')}")
        if "briefing" in novo: projeto.registrar(p, "Briefing atualizado")
    projeto.alterar(pid, ed)


def criar_app(token, hosts):
    app = FastAPI(title="autotube", docs_url=None, redoc_url=None, openapi_url=None)

    @app.middleware("http")
    async def portao(request: Request, call_next):
        host = (request.headers.get("host") or "").split(":")[0]
        if host not in hosts: return JSONResponse({"erro": "host"}, status_code=403)       # DNS rebinding
        if request.url.path.startswith("/api/"):
            dado = request.headers.get("x-edt-token") or request.query_params.get("k")
            if not dado or not secrets.compare_digest(dado, token):
                return JSONResponse({"erro": "senha"}, status_code=401)
        try:
            return await call_next(request)
        except SystemExit as e:          # ⛔ o motor avisa erro de uso com SystemExit (BaseException): vira 400 legivel
            return JSONResponse({"erro": str(e)}, status_code=400)

    @app.get("/api/estado")
    def estado():
        return {"versao": VERSAO, "projetos": projeto.lista(), "produtor": producao.PRODUTOR.estado(), "conexoes": _conexoes(),
                "padrao": config.padrao(config.ler_json(AJUSTES, {}) or {})["tts"]}

    @app.post("/api/projetos")
    def criar(b: Novo):
        try:
            p = projeto.criar(b.nome, b.formato, b.duracao_alvo, b.destino, b.briefing, b.modo)
        except ValueError as e:
            raise HTTPException(400, str(e))
        return {"id": p["id"]}

    @app.get("/api/projetos/{pid}")
    def ver(pid: str):
        return detalhe(pid)

    @app.post("/api/projetos/{pid}")
    async def editar(pid: str, request: Request):
        _carregar(pid)
        if producao.PRODUTOR.rodando and producao.PRODUTOR.pid == pid:
            novo = await request.json()
            if any(k in novo for k in ("copy", "voz", "formato", "roteiro")):
                raise HTTPException(409, "espere o trabalho atual terminar para mudar copy, voz, formato ou roteiro")
        else:
            novo = await request.json()
        _editar(pid, novo)
        return detalhe(pid)

    @app.post("/api/projetos/{pid}/amostra")
    def amostra(pid: str, b: Amostra):
        p = _carregar(pid)
        arq, dur = _amostra(b.voz, b.velocidade, producao.trecho_amostra(p.get("copy")), os.path.join(projeto.pasta(pid), "amostras"))
        rel = os.path.relpath(arq, projeto.pasta(pid))
        projeto.alterar(pid, lambda q: q.setdefault("amostras", {}).__setitem__(f"{b.voz}|{b.velocidade:.2f}", rel))
        return {"caminho": arq, "duracao": round(dur, 1)}

    @app.post("/api/projetos/{pid}/produzir")
    def produzir(pid: str, b: Produzir):
        if b.tarefa not in ("narrar", "previa", "final", "tudo"): raise HTTPException(400, "tarefa inválida")
        p = _carregar(pid)
        if not (p.get("copy") or "").strip(): raise HTTPException(400, "escreva a copy antes de produzir")
        try:
            producao.PRODUTOR.iniciar(pid, b.tarefa)
        except producao.Ocupado as e:
            raise HTTPException(409, str(e))
        return {"ok": True}

    @app.post("/api/parar")
    def parar():
        producao.PRODUTOR.parar.set()
        if producao.PRODUTOR.pid: projeto.log(producao.PRODUTOR.pid, "Parada pedida")
        return {"ok": True}

    @app.get("/api/vozes")
    def vozes(atualizar: int = 0):
        try:
            return producao.vozes(bool(atualizar))
        except Exception as e:                                   # noqa: BLE001 (sem rede / sem chave)
            raise HTTPException(502, f"não consegui listar as vozes da MiniMax: {e}")

    @app.post("/api/vozes/amostra")
    def amostra_livre(b: Amostra):
        arq, dur = _amostra(b.voz, b.velocidade)
        return {"caminho": arq, "duracao": round(dur, 1)}

    @app.get("/api/musicas")
    def musicas():
        return [dict(f, caminho=musica.arquivo(f) if os.path.exists(musica.arquivo(f)) else None) for f in musica.catalogo()]

    @app.get("/api/sfx")
    def efeitos():
        cat = config.ler_json(os.path.join(config.SFX_DIR, "livre", "catalogo.json"), {}) or {}
        out = []
        for e in cat.get("efeitos", []):
            arq = os.path.join(config.SFX_DIR, "livre", f"{e['nome']}.mp3")
            out.append(dict(e, caminho=arq if os.path.exists(arq) else None))
        return out

    @app.get("/api/ajustes")
    def ver_ajustes():
        c = config.padrao(config.ler_json(AJUSTES, {}) or {})
        return {"tts": {k: c["tts"][k] for k in ("voz", "velocidade", "modelo")}, "render": c["render"], "audio": c["audio"],
                "pastas": {"projetos": config.PROJETOS_DIR}}

    @app.post("/api/ajustes")
    async def salvar_ajustes(request: Request):
        novo = await request.json()
        aj = config.ler_json(AJUSTES, {}) or {}
        for sec in ("tts", "render", "audio"):
            if isinstance(novo.get(sec), dict): aj.setdefault(sec, {}).update(novo[sec])
        config.escrever_json(AJUSTES, aj)
        return ver_ajustes()

    @app.post("/api/abrir-pasta")
    def abrir_pasta(b: Caminho):
        alvo = b.caminho if os.path.isdir(b.caminho) else os.path.dirname(b.caminho)
        if not (os.path.isdir(alvo) and (dentro(os.path.join(alvo, "x")))): raise HTTPException(404, "pasta fora da ferramenta")
        if os.name == "nt": os.startfile(alvo)                   # noqa: S606 (abre o Explorer na pasta)
        return {"ok": True}

    @app.get("/api/midia")
    def midia(caminho: str):
        if not (os.path.isfile(caminho) and dentro(caminho)): raise HTTPException(404, "mídia fora das pastas da ferramenta")
        return FileResponse(caminho)

    @app.get("/api/miniatura")
    def mini(caminho: str, w: int = 360, t: float = None):
        if not (os.path.isfile(caminho) and dentro(caminho)): raise HTTPException(404, "arquivo fora das pastas da ferramenta")
        return FileResponse(miniatura(caminho, max(80, min(w, 1280)), t), media_type="image/jpeg", headers={"Cache-Control": "max-age=86400"})

    if os.path.isdir(PAINEL):
        @app.get("/{resto:path}")
        def spa(resto: str):
            alvo = os.path.realpath(os.path.join(PAINEL, resto))
            if resto and alvo.startswith(os.path.realpath(PAINEL)) and os.path.isfile(alvo): return FileResponse(alvo)
            return FileResponse(os.path.join(PAINEL, "index.html"))
    return app


def porta_livre(preferida):
    for p in [preferida] + list(range(preferida + 1, preferida + 20)):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", p)) != 0: return p
    raise SystemExit("nenhuma porta livre")


PERFIL_JANELA = os.path.join(config.CACHE_DIR, "janela_edge")


def fechar_janelas():
    """Fecha as janelas da ferramenta abertas antes. ⛔ 2026-10-05: cada reinicio abria mais uma janela
    (o operador ficou com 4). A janela roda num perfil PROPRIO do Edge (--user-data-dir), entao da' para
    achar e fechar so' ela, sem tocar no Edge normal do operador."""
    if os.name != "nt": return
    import subprocess
    alvo = PERFIL_JANELA.replace("'", "''")
    ps = ("Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
          f"Where-Object {{ $_.CommandLine -like '*{alvo}*' }} | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}")
    config.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True)
    # ⛔ abrir antes de o Edge antigo terminar de fechar = a janela nova "some" (o perfil ainda esta' preso)
    import time
    for _ in range(40):
        r = config.run(["powershell", "-NoProfile", "-Command",
                        f"(Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\" | "
                        f"Where-Object {{ $_.CommandLine -like '*{alvo}*' }}).Count"], capture_output=True, text=True)
        if (r.stdout or "0").strip() in ("", "0"): break
        time.sleep(0.25)
    time.sleep(0.5)


def abrir_janela(url):
    """UMA janela de aplicativo (Edge/Chrome em modo app, perfil proprio); sem eles, o navegador padrao."""
    import shutil, subprocess, webbrowser
    fechar_janelas()
    for exe in (shutil.which("msedge"), r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Microsoft\Edge\Application\msedge.exe", shutil.which("chrome"),
                r"C:\Program Files\Google\Chrome\Application\chrome.exe"):
        if exe and os.path.exists(exe):
            subprocess.Popen([exe, f"--app={url}", "--window-size=1440,900", f"--user-data-dir={PERFIL_JANELA}",
                              "--no-first-run", "--no-default-browser-check"]); return
    webbrowser.open(url)


def ja_aberta():
    """URL do painel se ja' houver um servidor da ferramenta rodando (e respondendo), senao None."""
    import urllib.request
    d = config.ler_json(os.path.join(config.CACHE_DIR, "painel_api.json")) or {}
    if not d.get("porta"): return None
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{d['porta']}/api/estado", headers={"X-EDT-Token": d.get("token", "")})
        with urllib.request.urlopen(req, timeout=2) as r:
            return d.get("url") if r.status == 200 else None
    except Exception:                                            # noqa: BLE001
        return None


def rodar(porta=8801, janela=True):
    import uvicorn
    # ⭐ instancia UNICA: se a ferramenta ja' esta' rodando, so' traz a janela de volta (nao abre outra)
    url = ja_aberta()
    if url:
        print(f"o AutoTube ja' esta' aberto: {url}")
        if janela: abrir_janela(url)
        return
    porta = porta_livre(porta)
    token = secrets.token_urlsafe(18)
    app = criar_app(token, {"127.0.0.1", "localhost"})
    url = f"http://127.0.0.1:{porta}/#t={token}"
    config.escrever_json(os.path.join(config.CACHE_DIR, "painel_api.json"), {"porta": porta, "token": token, "url": url})
    print(f"painel: {url}")
    if janela: threading.Timer(1.0, abrir_janela, args=(url,)).start()
    uvicorn.run(app, host="127.0.0.1", port=porta, log_level="warning")
