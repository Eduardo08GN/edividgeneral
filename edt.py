# -*- coding: utf-8 -*-
"""AutoTube — editor de video generico (narracao MiniMax, legenda cinetica, motion graphics no Remotion).

    python edt.py painel [--porta 8801] [--sem-janela]                 (abre a interface: o jeito normal de usar)
    python edt.py projetos                                              (lista os projetos)
    python edt.py novo "<nome>" [--formato 16:9|9:16|1:1] [--copy texto.txt] [--voz <id>]
    python edt.py narrar <projeto>
    python edt.py render <projeto> [--final]                            (sem --final: previa em meia resolucao)
    python edt.py vozes [--filtro portug]
    python edt.py musica sync                                           (baixa as trilhas livres do catalogo)
"""
import argparse, io, sys

from editor import config, producao, projeto, tts


def main(argv):
    ap = argparse.ArgumentParser(prog="edt", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("painel"); p.add_argument("--porta", type=int, default=8801); p.add_argument("--sem-janela", action="store_true")
    sub.add_parser("projetos")
    p = sub.add_parser("novo"); p.add_argument("nome"); p.add_argument("--formato", default="16:9"); p.add_argument("--copy"); p.add_argument("--voz")
    p = sub.add_parser("narrar"); p.add_argument("projeto")
    p = sub.add_parser("render"); p.add_argument("projeto"); p.add_argument("--final", action="store_true")
    p = sub.add_parser("vozes"); p.add_argument("--filtro", default="portug")
    p = sub.add_parser("musica"); p.add_argument("acao", choices=["sync", "listar"])
    a = ap.parse_args(argv)

    if a.cmd == "painel":
        from editor import servidor
        servidor.rodar(a.porta, janela=not a.sem_janela); return 0
    if a.cmd == "projetos":
        for r in projeto.lista():
            print(f"  {r['id']:<34} {r['formato']:<5} {'v' + str(r['versao']) if r['versao'] else '—':<4} {''.join('●' if e else '○' for e in r['etapas'])}")
        return 0
    if a.cmd == "novo":
        pj = projeto.criar(a.nome, a.formato)
        if a.copy or a.voz:
            def ed(q):
                if a.copy: q["copy"] = io.open(a.copy, encoding="utf-8").read().strip()
                if a.voz: q["voz"] = {"id": a.voz, "velocidade": 1.0}
            projeto.alterar(pj["id"], ed)
        print(pj["id"]); return 0
    if a.cmd == "narrar":
        producao.narrar(a.projeto); return 0
    if a.cmd == "render":
        def prog(x): print(f"\r  render {x * 100:5.1f}%", end="", flush=True)
        r = producao.renderizar(a.projeto, previa=not a.final, progresso=prog)
        print(f"\n{projeto.pasta(a.projeto)}\\{r['arquivo']}  ({r['duracao']} s, {r['lufs']} LUFS, render {r['render_s']} s)"); return 0
    if a.cmd == "vozes":
        for v in tts.listar_vozes(a.filtro): print(f"  {v['voice_id']:<42} {v['tipo']:<16} {v['desc'][:80]}")
        return 0
    if a.cmd == "musica":
        from editor import musica
        if a.acao == "sync": print(f"{musica.sincronizar()} faixa(s) baixada(s)")
        for f in musica.catalogo(): print(f"  {f['id']:<14} {f['titulo']:<22} {f['bpm']:>6} bpm  {f['clima']}")
        return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
