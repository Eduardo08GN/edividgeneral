# AutoTube

Editor de vídeo genérico: você escreve (ou escolhe) a **copy falada**, ouve e escolhe a **voz**, e o AutoTube
monta o vídeo com tipografia em movimento ou motion graphics próprios, trilha e efeitos livres para uso
comercial, em **16:9, 9:16 ou 1:1**, com o áudio em −14 LUFS.

Nasceu em 2026-10-06 como cópia do [editingtool](https://github.com/Eduardo08GN/editingtool) (o motor de
criativos low ticket, que continua separado). Quem opera é o Claude Code: leia o [`CLAUDE.md`](CLAUDE.md).

## Instalação

```bash
pip install -r requirements.txt
```

1. Copie `.env.example` para `.env` e preencha `MINIMAX_API_KEY`.
2. Tenha o ffmpeg no PATH (ou indique `FFMPEG` / `FFPROBE` no `.env`) e o Node.js (motor de vídeo).
3. Baixe as trilhas livres: `python edt.py musica sync` (vão para `musica/livre/`, fora do git).

## Uso

Dois cliques em **`AutoTube.cmd`** (ou `python edt.py painel`). Cada projeto passa por 6 etapas:
**Briefing → Copy → Voz → Material → Roteiro → Produção**. No modo **Guiado** você aprova cada escolha;
no **Automático**, um botão produz tudo.

Os projetos ficam em `projetos/<id>/` (fora do git): `projeto.json`, a narração, o material e as versões
(`versoes/vN.mp4` + folha de contato).

## Créditos de terceiros

- **Trilhas e efeitos**: [Mixkit](https://mixkit.co/license/) (licença gratuita, uso comercial, sem crédito). A origem de cada arquivo está em `musica/livre/catalogo.json` e `sfx/livre/catalogo.json`.
- **Voz**: MiniMax T2A v2.
- **Alinhamento fino da fala**: modelo MMS_FA da Meta via `torchaudio` (a técnica do WhisperX).
- **Fontes** (OFL): Bricolage Grotesque, JetBrains Mono e Public Sans.
- **Câmera lenta por IA** (herdada, opcional): [rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan) (MIT).
