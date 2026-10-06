# -*- coding: utf-8 -*-
"""Testes sem rede e sem ffmpeg:  python -m pytest tests  (ou: python tests/test_basico.py)"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from editor import alinhar, producao, projeto, sfx



def test_casar_texto_usa_grafia_da_copy():
    ouvidas = [("A", 0, .2), ("Bíblia", .2, .5), ("tem", .5, .7), ("70", .7, 1.0), ("cards", 1.0, 1.3)]
    pal, rel = alinhar.casar_texto(ouvidas, "A Bíblia tem setenta cards")
    assert [p[0] for p in pal] == ["A", "Bíblia", "tem", "setenta", "cards"]


def test_ajuste_de_velocidade_nao_linear():
    """MiniMax: dur ~ 1/speed^2.4 (medido). O ajuste tem de chegar perto do alvo sem passar do ponto."""
    from editor import tts
    natural = {"x": 24.22}
    chamadas = []
    original = tts.sintetizar
    tts.sintetizar = lambda texto, saida, cfg, v=None: (chamadas.append(v), natural["x"] / (float(v) ** 2.4))[1]
    try:
        cfg = {"velocidade": 1.0, "ajustar_duracao": True, "tolerancia_s": 1.5, "velocidade_min": 0.9, "velocidade_max": 1.2}
        r = tts.narrar("copy", 20, "x.wav", cfg)
        assert abs(r["duracao"] - 20) <= 1.5, r
        natural["x"] = 27.2; chamadas.clear()
        r = tts.narrar("copy", 30, "x.wav", cfg)
        assert abs(r["duracao"] - 30) <= 1.5 and r["velocidade"] < 1.0, r
    finally:
        tts.sintetizar = original


def test_razao_em_texto_longo():
    """Regressao: autojunk do difflib derrubava a razao em copy longa (>200 caracteres)."""
    copy = ("Paizão, você trabalha o dia inteiro e sente que não consegue ensinar sobre Deus aos seus filhos? "
            "A Bíblia do Bebê ajuda nisso em cinco minutinhos por noite: um card, uma passagem da Bíblia curtinha "
            "e uma brincadeira pra fazer juntos. Garante o seu. Clique em saiba mais e confira.")
    ouvido = copy.replace("Paizão", "Paisão").replace("cinco", "5")
    ouvidas = [(w, i * .3, i * .3 + .25) for i, w in enumerate(ouvido.split())]
    _, rel = alinhar.casar_texto(ouvidas, copy)
    assert rel["razao"] > 0.9, rel


def test_afinar_sfx_na_escala():
    """Pop afinado no tom da musica: cai numa nota da escala, nunca mais de meia oitava de distancia."""
    import math
    from editor import sfx
    for tom in [(0, "maior"), (9, "menor"), (5, "maior")]:
        for f0 in (180.0, 440.0, 753.7, 2304.1):
            for grau in (0, 1, 2):
                s = sfx.semitons_para_escala(f0, tom, grau)
                assert -6 <= s <= 6, (f0, tom, grau, s)
                nota = round(12 * math.log2(f0 / 261.63) + s - tom[0]) % 12
                assert nota in sfx.ESCALA[tom[1]], (f0, tom, grau, nota)
    assert sfx.semitons_para_escala(0, (0, "maior")) == 0.0 and sfx.semitons_para_escala(440, None) == 0.0


def test_cta_aceita_clica():
    """Copy do time fecha com "Clica no botao aqui embaixo": o CTA precisa ser achado (fecho e SFX)."""
    from editor import sfx
    pal = [("Garante", 0, 1), ("Clica", 1, 2), ("no", 2, 3), ("botão", 3, 4)]
    assert sfx.indice_cta(pal) == 1 and sfx.indice_cta(pal, "clique") == 1
    assert sfx.indice_cta([("clicar", 0, 1)]) is None


def test_frases_equilibradas_sem_palavra_sozinha():
    """Legenda cinetica: a sentenca vira pedacos equilibrados ("rapido." nunca fica sozinha na tela)."""
    ws = "Quem posta todo dia cresce mais rápido. Mas editar vídeo toma o seu tempo.".split()
    fr = producao.frases([(w, i * .3, i * .3 + .25) for i, w in enumerate(ws)])
    tam = [len(f["palavras"]) for f in fr]
    assert sum(tam) == len(ws) and min(tam) >= 3 and max(tam) <= 6, tam
    assert all(f["palavras"][-1]["w"][-1] in ".," or f is not fr[-1] for f in fr)


def test_trecho_da_amostra_fecha_a_frase():
    copy = " ".join(["palavra"] * 20) + ". " + " ".join(["outra"] * 30) + "."
    t = producao.trecho_amostra(copy)
    assert t.endswith(".") and len(t.split()) == 20
    assert producao.trecho_amostra("") == producao.TEXTO_AMOSTRA


def test_ciclo_do_projeto():
    """Criar, mudar copy/voz: as etapas e a 'chave' da narracao acompanham (narracao velha nao vale)."""
    import tempfile
    from editor import config
    antes = config.PROJETOS_DIR
    config.PROJETOS_DIR = tempfile.mkdtemp()
    try:
        p = projeto.criar("Meu vídeo", "9:16", 30)
        assert p["id"] == "meu-video" and projeto.criar("Meu vídeo")["id"] == "meu-video-2"
        assert [e["ok"] for e in projeto.etapas(p)] == [False, False, False, False, True, False]
        p = projeto.alterar(p["id"], lambda q: q.update(copy="Um teste curto.", voz={"id": "Portuguese_ReliableMan", "velocidade": 1.0}))
        assert [e["ok"] for e in projeto.etapas(p)][:3] == [False, True, True]
        k1 = projeto.chave_narracao(p)
        p = projeto.alterar(p["id"], lambda q: q.update(copy="Outro texto."))
        assert projeto.chave_narracao(p) != k1 and not projeto.narracao_ok(p)
        assert projeto.tamanho(p) == (1080, 1920)
        assert [r["id"] for r in projeto.lista()] and projeto.carregar("meu-video")["atividade"][0]["texto"] == "Projeto criado"
    finally:
        config.PROJETOS_DIR = antes


if __name__ == "__main__":  # noqa
    for n, f in list(globals().items()):
        if n.startswith("test_"): f(); print("OK", n)
