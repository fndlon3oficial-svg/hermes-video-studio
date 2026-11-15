# FNL_Edição — Interface do editor de vídeo por IA

Interface em português seguindo os layouts enviados (tema claro creme + laranja `#ff5e1e`, revisão em tema escuro "Kinetic Obsidian"). O motor (Hermes) e os vídeos ficam no Google Cloud; aqui guardamos só projetos, templates, LUTs e comentários.

## Sobre a renderização
Como o Hermes já devolve o vídeo pronto no Google Cloud, **não vamos usar o GitHub Actions para renderizar**. O fluxo fica:
- Hermes gera uma **prévia** (rápida) → você revisa.
- Botão **"Finalizar"** pede ao Hermes a versão final (com LUT/resolução máxima). Enquanto isso o card mostra "Finalizando (64%)".
- Quando pronto, aparece **"Baixar"**. Se o Hermes já entregar a versão final direto, o botão vira só "Baixar".

## Telas
1. **Meus Projetos (/)** — saudação, botão "Criar Novo Vídeo com IA", busca, cards com status: Gerando, Em Revisão, Finalizando, Pronto para Baixar, Baixado. Clicar abre a revisão.
2. **Novo Vídeo IA (/novo)** — assistente em etapas:
   - Etapa 1: upload dos vídeos + música (opcional)
   - Etapa 2: estilo de edição ou template pronto (template preenche estilo, LUT e duração)
   - Etapa 3: vídeo de referência (opcional), duração, idioma da legenda, LUT
   - Etapa 4: resumo e "Gerar Vídeo" → envia ao Hermes
3. **Revisão (/projeto/$id)** — player, linha do tempo para selecionar trechos, cada trecho com sua própria lista de comentários, botões "Enviar Correções" (manda os comentários ao Hermes, gera nova versão v2, v3…) e "Finalizar & Baixar".
4. **Download (/projeto/$id/download)** — tela de exportação concluída; marca o projeto como "Baixado" e volta ao início.
5. **Biblioteca de Templates (/templates)** — criar/editar templates e LUTs (arquivos .cube pequenos guardados aqui).

## O que fica salvo aqui (Lovable Cloud)
Projetos, versões, trechos, comentários, templates e LUTs. Uploads de vídeo/música vão **direto para o Google Cloud** via link assinado fornecido pelo Hermes, sem passar por aqui.

## Integração com o Hermes
Não tenho os endereços nem o formato da API do Hermes, então crio uma camada de conexão com um **modo simulado** (para tudo funcionar já na prévia). Quando você me passar a URL e a chave do Hermes, troco para o real. Contrato proposto:
- `POST /uploads/sign` → link de upload no Google Cloud
- `POST /jobs` (vídeos, música, estilo, referência, duração, idioma, LUT) → id do trabalho
- `GET /jobs/:id` → status, progresso, link da prévia, trechos
- `POST /jobs/:id/corrections` (trechos + comentários) → nova versão
- `POST /jobs/:id/finalize` → link final de download
- Opcional: Hermes chama um endereço nosso (webhook) ao terminar, em vez de consultarmos.

## Detalhes técnicos
- TanStack Start; chamadas ao Hermes só no servidor (`createServerFn`), chave em segredo `HERMES_API_KEY` + `HERMES_BASE_URL`; webhook em `/api/public/hermes-webhook` com verificação de assinatura.
- Tabelas: projects, project_versions, segments, segment_comments, templates, luts. Sem login por enquanto (uso pessoal) — posso adicionar depois.
- Fontes: Space Grotesk/Geist (UI) conforme DESIGN.md; tokens de cor em styles.css.
- Status polling a cada poucos segundos com React Query enquanto gera/finaliza.

## Pontos a confirmar depois
- URL/formato real da API do Hermes.
- Se precisa de login (equipe com vários usuários, como "Jack/Julia" no layout).
