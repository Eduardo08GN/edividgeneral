# Arquitetura do AutoTube

## Peças

```
painel/ (React)  ──HTTP 127.0.0.1:8801──►  editor/servidor.py (FastAPI, senha por sessão)
                                               │
                         editor/projeto.py ◄───┤  estado de cada projeto (projetos/<id>/projeto.json)
                         editor/producao.py ◄──┘  um trabalho por vez, em segundo plano
                               │
   copy ──► tts.py (MiniMax) ──► alinhar.py (faster-whisper + alinhamento forçado MMS_FA) ──► palavras.json
                               │
                               ├─ roteiro "legenda": props (frases, trilha cortada na batida, efeitos) ─┐
                               └─ roteiro "proprio": projetos/<id>/cenas → remotion/src/_projetos/<id> ─┤
                                                                                                         ▼
                               remotion/ (Node) ── render com porta e public-dir próprios ──► bruto.mp4
                                                                                                         │
                               loudnorm em 2 passadas (−14 LUFS, pico −1,5) ──► versoes/vN.mp4 + folha 1 quadro/s
```

## Módulos

| arquivo | papel |
|---|---|
| `editor/projeto.py` | criar, carregar, salvar (com trava), etapas derivadas, chave da narração (copy+voz+velocidade) |
| `editor/producao.py` | amostra de voz, narração, frases da legenda, render Remotion com progresso, loudnorm, folha de contato, `Produtor` (fila de 1) |
| `editor/servidor.py` | rotas do painel; mídia só de dentro de `projetos/`, `musica/`, `sfx/` e das amostras |
| `editor/musica.py` | catálogo livre, batidas e tom (librosa), melhor janela da faixa começando numa batida |
| `editor/tts.py`, `alinhar.py` | herdados do editingtool (velocidade não linear, cache por texto+voz, alinhamento forçado) |
| `editor/sfx.py`, `transicoes.py`, `camera_lenta.py`, `emojis.py`, `mixagem.py`, `formato.py`, `qa_entrega.py`, `limpar.py` | herdados, genéricos; ainda não usados pelo AutoTube (motor de cenas, fase 4) |
| `remotion/src/modelos/Legenda.tsx` | modelo genérico "Legenda cinética" |
| `remotion/src/base.tsx` | peças comuns (Palavra no tempo da fala, grade de pontos, HUD) |

## Fases

1. **Interface + projeto** (2026-10-06): as 6 etapas, voz pelo ouvido, narração, Legenda cinética, cenas próprias, versões.
2. **Captura**: gravar uma janela (só filmando), capturar um site escondendo marcas, baixar vídeos de uma página, importar do HD.
3. **Claude no fluxo** (`claude -p`): 10 copys com ângulos diferentes, roteiro de cenas, pedidos de ajuste ("troque a música").
4. **Motor de cenas**: as 11 cenas do explicativo viram modelos reutilizáveis que o Claude escolhe e preenche.
