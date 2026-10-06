# -*- coding: utf-8 -*-
"""PROJETO — um video do AutoTube, do briefing a' versao final.

    projetos/<id>/projeto.json      estado (briefing, copy, voz, roteiro, versoes, atividade)
    projetos/<id>/narracao.wav      narracao (+ palavras.json com o tempo de cada palavra)
    projetos/<id>/amostras/         amostras de voz para escolher
    projetos/<id>/material/         o que o video usa (capturas, videos, imagens)
    projetos/<id>/cenas/ + public/  roteiro "proprio": composicao Remotion escrita para este video
    projetos/<id>/versoes/vN.mp4    cada render (previa ou final), com a folha de contato

⭐ As 6 etapas: briefing -> copy -> voz -> material -> roteiro -> producao. O estado de cada uma e'
   DERIVADO do projeto (nao ha' "etapa atual" gravada que possa mentir).
⭐ A copy e' sagrada: vai literal para a voz e para a tela.
"""
import hashlib, os, re, shutil, threading
from datetime import datetime

from . import config

ETAPAS = [("briefing", "Briefing"), ("copy", "Copy"), ("voz", "Voz"), ("material", "Material"), ("roteiro", "Roteiro"), ("producao", "Produção")]
FORMATOS = ("16:9", "9:16", "1:1")
MODELOS = {"legenda": "Legenda cinética", "proprio": "Cenas próprias"}


def pasta(pid):
    return os.path.join(config.PROJETOS_DIR, pid)


def _agora():
    return datetime.now().isoformat(timespec="seconds")


def novo_id(nome):
    base = config.slug(nome, 40)
    pid, n = base, 2
    while os.path.exists(pasta(pid)):
        pid = f"{base}-{n}"; n += 1
    return pid


def criar(nome, formato="16:9", duracao_alvo=40, destino="", briefing=None, modo="guiado"):
    if formato not in FORMATOS: raise ValueError(f"formato {formato!r}: use {', '.join(FORMATOS)}")
    nome = (nome or "").strip() or "Vídeo sem nome"
    pid = novo_id(nome)
    p = {"id": pid, "nome": nome, "criado": _agora(), "formato": formato, "duracao_alvo": int(duracao_alvo or 0),
         "destino": destino, "modo": modo if modo in ("guiado", "automatico") else "guiado",
         "briefing": dict({"o_que": "", "publico": "", "objetivo": "", "tom": "", "referencias": ""}, **(briefing or {})),
         "copys": [], "copy": "", "voz": {}, "narracao": None, "material": [],
         "roteiro": {"modelo": "legenda"}, "musica": {"id": "auto"}, "versoes": [], "atividade": [], "ajustes": {}}
    os.makedirs(pasta(pid), exist_ok=True)
    registrar(p, "Projeto criado")
    salvar(p)
    return p


def carregar(pid):
    if not re.fullmatch(r"[a-z0-9-]+", pid or ""): raise FileNotFoundError(pid)
    p = config.ler_json(os.path.join(pasta(pid), "projeto.json"))
    if not p: raise FileNotFoundError(pid)
    return p


def salvar(p):
    p["atualizado"] = _agora()
    config.escrever_json(os.path.join(pasta(p["id"]), "projeto.json"), p)


TRAVA = threading.RLock()


def alterar(pid, fn):
    """Le o projeto FRESCO do disco, aplica `fn(p)` e salva, tudo sob trava: a producao em segundo plano e
    a tela podem mexer no mesmo projeto ao mesmo tempo sem uma apagar a mudanca da outra."""
    with TRAVA:
        p = carregar(pid)
        r = fn(p)
        salvar(p)
        return r if r is not None else p


def log(pid, texto):
    alterar(pid, lambda p: registrar(p, texto))


def registrar(p, texto):
    """Linha no 'Agora ha' pouco' do projeto (mais recente primeiro)."""
    p.setdefault("atividade", []).insert(0, {"hora": datetime.now().strftime("%H:%M"), "texto": str(texto)})
    del p["atividade"][200:]


def cfg(p):
    """Config efetiva do projeto: padrao < Ajustes da tela < ajustes do projeto; a voz escolhida por cima."""
    c = config.padrao(config.ler_json(os.path.join(config.CACHE_DIR, "ajustes.json"), {}) or {})
    c = config.mesclar(c, p.get("ajustes") or {})
    v = p.get("voz") or {}
    if v.get("id"): c["tts"]["voz"] = v["id"]
    if v.get("velocidade"): c["tts"]["velocidade"] = float(v["velocidade"])
    return c


def tamanho(p):
    return tuple(config.padrao()["formatos"][p.get("formato", "16:9")])


def palavras_da_copy(texto):
    return [w for w in (texto or "").split() if w.strip()]


def duracao_estimada(texto, pps=None):
    pps = pps or config.padrao().get("palavras_por_segundo", 2.7)
    return round(len(palavras_da_copy(texto)) / pps, 1)


def chave_narracao(p):
    """Muda quando a copy, a voz ou a velocidade mudam: ai' a narracao precisa ser refeita."""
    t = cfg(p)["tts"]
    return hashlib.sha1(f"{p.get('copy', '').strip()}|{t['voz']}|{t['velocidade']}|{t['modelo']}".encode("utf-8")).hexdigest()[:12]


def narracao_ok(p):
    n = p.get("narracao") or {}
    return bool(n.get("chave") == chave_narracao(p) and os.path.exists(os.path.join(pasta(p["id"]), "narracao.wav")))


def palavras(p):
    return (config.ler_json(os.path.join(pasta(p["id"]), "palavras.json"), {}) or {}).get("palavras", [])


def versoes(p):
    """So' versoes cujo arquivo ainda existe."""
    out = []
    for v in p.get("versoes") or []:
        arq = os.path.join(pasta(p["id"]), v["arquivo"])
        if os.path.exists(arq): out.append(dict(v, caminho=arq))
    return out


def etapas(p):
    """[{id, nome, ok, resumo}] — derivado do estado."""
    b = p.get("briefing") or {}
    copy = (p.get("copy") or "").strip()
    v = p.get("voz") or {}
    mat = p.get("material") or []
    rot = p.get("roteiro") or {}
    vs = versoes(p)
    n_pal = len(palavras_da_copy(copy))
    nar = p.get("narracao") or {}
    out = {
        "briefing": (bool(b.get("o_que")), " · ".join(x for x in (b.get("o_que", "")[:40], b.get("publico", "")[:40]) if x) or "o que é o vídeo e para quem"),
        "copy": (bool(copy), (f"{n_pal} palavras · ~{duracao_estimada(copy):.0f} s" + (f" · {len(p.get('copys') or [])} opções" if p.get("copys") else "")) if copy else "o texto falado"),
        "voz": (bool(v.get("id")), (f"{v.get('nome') or v['id']} · {float(v.get('velocidade', 1.0)):.2f}×" + (" · narrada" if narracao_ok(p) else "")) if v.get("id") else "escolha pelo ouvido"),
        "material": (bool(mat), f"{len(mat)} itens" if mat else "opcional nesta versão"),
        "roteiro": (bool(rot.get("modelo")), MODELOS.get(rot.get("modelo"), "—") + (f" · {len(rot.get('cenas') or [])} cenas" if rot.get("cenas") else "")),
        "producao": (bool(vs), (f"v{vs[-1]['n']} · {vs[-1].get('tipo', '')}" + (f" · {vs[-1]['lufs']} LUFS" if vs[-1].get("lufs") is not None else "")) if vs else
                     (f"narração {nar.get('duracao', 0):.1f} s pronta" if narracao_ok(p) else "prévia e versão final")),
    }
    return [{"id": i, "nome": n, "ok": out[i][0], "resumo": out[i][1]} for i, n in ETAPAS]


def resumo(p):
    vs = versoes(p)
    ult = vs[-1] if vs else None
    return {"id": p["id"], "nome": p["nome"], "formato": p.get("formato"), "destino": p.get("destino", ""),
            "atualizado": p.get("atualizado") or p.get("criado"), "versao": ult["n"] if ult else None,
            "video": ult["caminho"] if ult else None, "capa_t": round(ult["duracao"] * 0.85, 1) if ult and ult.get("duracao") else None, "folha": os.path.join(pasta(p["id"]), ult["folha"]) if ult and ult.get("folha") else None,
            "etapas": [e["ok"] for e in etapas(p)]}


def lista():
    out = []
    if not os.path.isdir(config.PROJETOS_DIR): return out
    for d in os.listdir(config.PROJETOS_DIR):
        try: out.append(resumo(carregar(d)))
        except (FileNotFoundError, KeyError): continue
    return sorted(out, key=lambda r: r.get("atualizado") or "", reverse=True)


def ligar(origem, destino):
    """Hardlink (instantaneo, nao duplica o arquivo); se nao der (outro disco), copia."""
    if os.path.exists(destino): os.remove(destino)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    try: os.link(origem, destino)
    except OSError: shutil.copyfile(origem, destino)
