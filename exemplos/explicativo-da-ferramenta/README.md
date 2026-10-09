# Exemplo: explicativo da ferramenta (mini VSL, 40 s, 16:9)

O código das cenas do primeiro vídeo feito com o AutoTube (2026-10-06): a mini VSL da ferramenta de vídeos com IA,
publicada na landing (`https://midia.automaweb.pro/landing-ferramenta/vsl-ferramenta.mp4`). É o exemplo vivo do
roteiro **"cenas próprias"** e o ponto de partida dos modelos de cena da fase 4.

| arquivo | o que tem |
|---|---|
| `cenas/Cenas.tsx` | as 11 cenas (ver o mapa abaixo) |
| `cenas/Explicativo.tsx` | a composição: cenas em sequência, HUD de câmera, narração, trilha e os 40 efeitos sonoros no quadro do pico |
| `cenas/Studio.tsx` | recorte da gravação real do painel, com a lateral, o título e os idiomas cobertos, e o feed "Agora há pouco" redesenhado |
| `cenas/base.tsx` | paleta, `Palavra` (entra quando é dita), grade de pontos, parede de vídeos, cursor, cartão |
| `cenas/palavras.ts` | as 104 palavras da narração com o tempo de cada uma (whisper + alinhamento forçado) |
| `cenas/Root.tsx`, `index.ts` | registro da composição `Explicativo` (1920x1080, 30 fps, 1215 quadros) e das fontes |
| `projeto.json` | briefing, as 10 opções de copy, a copy usada, a voz e o roteiro (tempo de cada cena) |
| `midia.json` | os 61 arquivos de mídia que as cenas usam (103 MB, **fora do git**) e de onde veio cada um |

## As 11 cenas

| # | cena | tempo | o que acontece |
|---|---|---|---|
| 1 | Plataformas | 0:00–0:05 | chips TikTok Shop / Instagram / Facebook sobre a parede de vídeos; "quem posta mais vende mais" |
| 2 | Volume | 0:05–0:07 | fundo teal, VOLUME repetido em contorno |
| 3 | Custo | 0:07–0:11 | fundo âmbar, REC com o relógio correndo até 8 h; cartões câmera / editor / ator |
| 4 | Virada | 0:11–0:13 | tudo vira um ponto; "Essa ferramenta mudou a conta." |
| 5 | Entrada | 0:13–0:17 | janela "Este computador › Vídeos", seleção, "Nova leva" e o clique em Automático |
| 6 | Veo | 0:17–0:20 | gravação real do painel em perspectiva + feed legível |
| 7 | Montagem | 0:20–0:24 | celular com um vídeo do portfólio; narração ✓ legenda ✓ finalizado ✓; carimbo PRONTO |
| 8 | Piloto | 0:24–0:27 | painel real em tela cheia; "Sozinha. sem você mexer em nada." com o cursor riscado |
| 9 | Madrugada | 0:27–0:33 | relógio 23:00 → 07:00, contador e grade de vídeos enchendo; o céu vira manhã |
| 10 | Resultado | 0:33–0:36 | "+100 vídeos" e a landing-portfólio rolando no navegador |
| 11 | Fecho | 0:36–0:40 | "Volume de agência, sem agência." |

Os tempos saem da narração: cada palavra entra no quadro em que é dita (`pw(i)` = quadro da palavra `i` de `palavras.ts`).

## Como renderizar de novo

O jeito normal é pelo AutoTube, onde este projeto já existe (`projetos/explicativo-da-ferramenta/`, roteiro "cenas próprias"):

```bash
python edt.py render explicativo-da-ferramenta --final
```

Numa máquina sem o projeto: crie `projetos/explicativo-da-ferramenta/`, copie `cenas/` para dentro, monte `public/`
seguindo o `midia.json` e crie o `projeto.json` a partir do deste exemplo (com `"roteiro": {"modelo": "proprio", "composicao": "Explicativo"}`).
O AutoTube copia as cenas para `remotion/src/_projetos/<id>/` e renderiza com `--public-dir` apontando para `public/`.

## O que aprendemos fazendo este vídeo

- **Leitura ótica antes de entregar** (folha de contato, 1 quadro por segundo). Foi assim que apareceram:
  - a cena 8 preta: a caixa do vídeo não tinha altura e cortava tudo (`PainelReal` é `position: absolute`; a caixa pai precisa de `height`);
  - a parede de vídeos empilhada: `AbsoluteFill` é `flex-direction: column`; a parede precisa de `flexDirection: "row"`.
- **Gravar outra ferramenta** = só filmar a janela (gdigrab), nunca clicar nela. O nome dela e os idiomas foram cobertos na edição
  (coordenadas em `Studio.tsx`).
- **O feed real tinha parado** durante a gravação e mostrava um aviso. Ele foi coberto por um feed redesenhado no mesmo visual,
  com eventos no formato real do painel. Esses eventos específicos não aconteceram naquele momento.
- **Efeitos no pico**: `pico` de cada efeito medido com librosa; o som começa em `alvo - pico`.
- **"Veo"** pode ser lido como "véu" pela MiniMax; ouça a narração.

## Licenças

Trilha ("Deep Urban") e efeitos: Mixkit, licença gratuita com uso comercial e sem crédito. Fontes: OFL.
Os 12 vídeos do portfólio e a gravação do painel são do Eduardo.
