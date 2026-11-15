# Hermes Video Studio

Te mandei uma estrutura base a ser seguida para a criação de um editor de videos por IA, em que a interface vai ficar no github, e o motor no hermes que está hospedado dentro do google cloud
O que vamos fazer aqui é a interface que vai se interligar com o hermes, o armazenamento temporario e de videos vai ficar dentro do google cloud, por aqui só vamos armazenar informações de templates, alguns Luts e tal
Essa é a logica e estrutura que eu quero seguir:
Github

Faço o upload dos vídeos no Github

Faço o upload da música no Github (Etapa opcional)

Escolho o estilo de edição - Ou posso escolher algum template pré-produzido - Nesse template tem o estilo de edição, luts, duração

Adiciono um vídeo de referência (Etapa opcional)

Escolho a duração do vídeo

Escolho o idioma da legenda

Escolho o Lut para o color grading e melhora da resolução

Clico em gerar vídeo - As informações são mandadas para o Hermes AI que está hospedado no meu google cloud 

Após a geração de vídeos me é retornado o video completo e sou direcionado para a página de escolher renderizar ou fazer alterações

Nessas alterações posso escolher e selecionar trechos e enviar as recomendações por texto com cada segmento tendo uma seção de comentários individual

Se tiverem correções eu clico em um botão 'enviar correções' se não tiver eu clico no botão ‘baixar’ ou 'renderizar', se eu clicar em renderizar o video vai para uma fila de renderização em que o github actions renderiza os vídeos de forma automática e deixa pronto para baixar ou fazer alterações

Depois de baixar volto para a página inicial onde eu vejo os vídeos que já baixei e aparecem como baixados e posso clicar no vídeo e vai para aquela tela de correção ou baixar ou renderizar

Nota: como os videos prontos vão ser armazenados no google cloud, não sei se vai precisar renderizar antes, se precisar faça essas partes de renderização, se não precisa descarte a renderização

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/532c5ab8-8dee-4be8-a1a6-d9ac1121d587).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
