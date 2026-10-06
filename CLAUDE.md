# AutoTube (repo edividgeneral) — editor de vídeo genérico. Leia isto primeiro.

O AutoTube faz vídeos de qualquer tipo (YouTube, Instagram, TikTok, WhatsApp, cliente) a partir de uma
**copy falada**: voz MiniMax, tipografia em movimento ou motion graphics próprios, trilha e efeitos livres.
O Eduardo não é técnico: quem roda comando, testa e conserta é você. Respostas curtas, em português
simples, e **mostre o resultado** (vídeo, print), não só a explicação.

> ⛔ **Não é o motor de criativos low ticket.** Este repo nasceu em 2026-10-06 como cópia do
> [editingtool](https://github.com/Eduardo08GN/editingtool), que continua sendo da operação low ticket.
> - **Nunca** faça push para o remote `upstream-editingtool` (o push dele está desligado no git) nem para o
>   repo do time (`lucasmottasilva18-coder/low-ticket`). O pipeline de campanhas 5×5, selos, preço, CTA e a
>   publicação **foram removidos** daqui.
> - **Não mexa** em `C:\Users\edlut\editingtool_work`, no `ow_agente` (só consulta) nem no MazyOS/AutomaWeb.
> - Porta do painel **8801** (o editingtool usa 8791), atalho **`AutoTube.cmd`**, perfil do Edge em `.cache/janela_edge`.

## As 6 etapas de um projeto

`projetos/<id>/projeto.json` guarda tudo; o estado de cada etapa é **derivado** (`editor/projeto.py`).

| etapa | o que é | onde |
|---|---|---|
| 1. Briefing | o que é o vídeo, para quem, objetivo, tom, referências, formato, duração, destino | tela Novo vídeo / Briefing |
| 2. Copy | o texto falado. **A copy é sagrada**: vai literal para a voz e para a tela | Copy (fase 3: o Claude gera 10 opções) |
| 3. Voz | voz MiniMax escolhida **pelo ouvido** (amostras com o começo da copy) e velocidade | Voz |
| 4. Material | janelas gravadas, sites capturados, vídeos, imagens | Material (fase 2: captura pela própria ferramenta) |
| 5. Roteiro | modelo `legenda` (Legenda cinética, serve para tudo) ou `proprio` (cenas Remotion escritas para o vídeo) + trilha | Roteiro |
| 6. Produção | prévia (meia resolução) e versão final: Remotion → loudnorm −14 LUFS → `versoes/vN.mp4` + folha 1 quadro/s | Produção |

Modos: **Guiado** (para em cada escolha) e **Automático** (botão "Produzir tudo": narra se precisar e faz a final).

## A interface (o jeito normal de usar)

Dois cliques em **`AutoTube.cmd`** (ou `python edt.py painel`) abre a janela única: **Projetos**, **Novo vídeo**,
**Projeto** (as 6 etapas + player + "Agora há pouco"), **Biblioteca** (vozes, trilhas, efeitos) e **Ajustes**.
Código: `editor/servidor.py` (FastAPI, só 127.0.0.1, senha por sessão, instância e janela únicas) + `painel/`
(React/Vite; `npm run build` gera `painel/dist`, que vai no git).
⛔ Dentro de uma rota do servidor **nunca** deixe escapar `SystemExit`: ele derruba o servidor inteiro (aconteceu
em 2026-10-06). Erro de uso na rota = `HTTPException`; o `SystemExit` do motor só roda no trabalho em segundo plano.

## Comandos (para você, quando precisar)

| para quê | comando |
|---|---|
| abrir a interface | `python edt.py painel` |
| listar projetos | `python edt.py projetos` |
| projeto novo pela linha de comando | `python edt.py novo "Nome" --formato 9:16 --copy texto.txt --voz <id>` |
| narrar / renderizar | `python edt.py narrar <id>` · `python edt.py render <id> [--final]` |
| vozes da MiniMax | `python edt.py vozes --filtro portug` |
| baixar as trilhas livres do catálogo | `python edt.py musica sync` |
| testes | `python tests/test_basico.py` |

## Motor de vídeo (`remotion/`)

- `src/modelos/Legenda.tsx`: o modelo genérico (props montadas em `editor/producao.py::_props_legenda`).
- Roteiro `proprio`: o código fica em `projetos/<id>/cenas/` e os arquivos em `projetos/<id>/public/`; no render,
  as cenas são copiadas para `remotion/src/_projetos/<id>/` (fora do git). Exemplo vivo: o projeto
  **Explicativo da ferramenta** (11 cenas, captura real do painel, landing sem marca).
- `src/base.tsx`: Palavra que entra no tempo da fala, grade de pontos, HUD de câmera.

## O que aprendemos (não repita estes erros)

- **Leitura ótica**: confira todo render pela folha de contato (1 quadro/s) antes de mostrar. Foi assim que
  apareceram a cena preta (caixa sem altura cortando o vídeo) e a parede de vídeos empilhada.
- **Porta própria por render** (a 3000 é do site Next.js do Eduardo) e `--public-dir` próprio com hardlinks.
- **Concorrência 6**: a máquina divide CPU com o AutomaWeb Studio, que produz ao mesmo tempo.
- **Saída** sempre `yuv420p` bt709, faststart; áudio em −14 LUFS (loudnorm em 2 passadas).
- **Velocidade da MiniMax não é linear** (duração ∝ 1/vel^2,4). Whisper **sem** a copy no prompt; difflib `autojunk=False`.
- Vozes "Standard Portuguese" da MiniMax podem soar de Portugal: escolha **pelo ouvido**.
- "Veo" pode ser lido como "véu": ouça a narração.
- **Gravar outra ferramenta**: só filmar (gdigrab), nunca clicar nela; esconder marca/nome com máscara na edição.
- Capturar site: esconda marca por CSS **só na captura** (Playwright), o site não muda.

## Regras que não se quebram

- ⛔ **A copy é sagrada.** Não "melhore" copy aprovada; se achar erro, pergunte. (Exceção: abreviação como
  "vc" vira "você" para a voz ler certo; avise.)
- ⛔ **Música e efeitos só livres para uso comercial** (`musica/livre/`, `sfx/livre/`, Mixkit, com a licença no
  catálogo). A Meta Sound Collection **não** entra: só vale dentro da Meta. Precisa de outra fonte? Pergunte.
- ⛔ **Nunca** comite `.env` (chave MiniMax), mídia (mp4, wav, mp3, m4a), `projetos/`, `node_modules`, `.cache`.
  Antes de cada commit: `git grep -nE "sk-[A-Za-z0-9_-]{20,}"` não pode achar nada.
- ⛔ Ação para fora (push em repo de outra pessoa, publicar, subir arquivo): pergunte antes. No **seu** repo
  `edividgeneral`, commit e push estão liberados.
- Antes de lote grande: **1 amostra** para o Eduardo aprovar.
