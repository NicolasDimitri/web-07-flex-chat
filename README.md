# Projeto 07 – Chat Flex (HTML + CSS) · Nível ⭐⭐⭐ Difícil

Uma tela de conversa estilo WhatsApp. Parece simples, mas esconde os truques mais úteis (e mais traiçoeiros) do Flexbox: bolhas alinhadas com `align-self`, uma área que rola sozinha, nome longo cortado com reticências, linhas laterais feitas com `::before`/`::after` e três pontinhos animados.

Crie `index.html` e `style.css` aqui na raiz.

> 🧗 **Desafio de pesquisa:** você vai precisar de coisas que talvez ainda não viu (`::before`, `@keyframes`, `text-overflow`). Pesquisar faz parte! A [MDN](https://developer.mozilla.org/pt-BR/) é sua melhor amiga. Vá requisito por requisito: `commit` + `push` a cada conquista e acompanhe os ✅ subindo na tabela do PR.

**Estrutura HTML obrigatória**

```html
<body>
  <div class="chat">
    <header class="chat-topo">
      <span class="avatar">M</span>
      <div class="info">
        <strong class="nome">Maria Souza</strong>
        <small class="status">online</small>
      </div>
      <button class="mais" type="button">⋮</button>
    </header>

    <main class="mensagens">
      <div class="divisor"><span>Hoje</span></div>

      <article class="msg recebida"><p>Oi! Tudo bem?</p><span class="hora">10:00</span></article>
      <article class="msg enviada"><p>Tudo ótimo!</p><span class="hora">10:01</span></article>
      <!-- 3 ou mais recebidas e 3 ou mais enviadas.
           Pelo menos UMA mensagem com texto longo (120+ caracteres). -->

      <div class="digitando"><span></span><span></span><span></span></div>
    </main>

    <form class="entrada">
      <input type="text" placeholder="Digite uma mensagem">
      <button class="enviar" type="submit">Enviar</button>
    </form>
  </div>
</body>
```

**Requisitos**

1. **R1** – Base do HTML: doctype, `lang="pt-BR"`, charset UTF-8, `<title>` e `<meta name="viewport" ...>`.
2. **R2** – CSS em `style.css`, ligado por `<link>`; sem `style=""` e sem `<style>`.
3. **R3** – A estrutura acima existe (3+ recebidas, 3+ enviadas, toda `.msg` com `<p>` e `.hora`, uma mensagem longa, `.digitando` com 3 `<span>`).
4. **R4** – `body` com `margin: 0`; `box-sizing: border-box` em `.chat`, `.msg` e `.entrada`.
5. **R5** – `.chat` é um flex em coluna com a **altura da tela**, de 320 a 480px de largura, centralizado na horizontal.
6. **R6** – Topo em Flexbox (`align-items: center` e `gap`): avatar redondo (40 a 56px) com a inicial centralizada, `.info` ocupando o espaço do meio e o botão "⋮" encostado na direita.
7. **R7** – Um nome **muito** longo não quebra o topo: ele é cortado com reticências (`...`), o botão "⋮" continua dentro do chat e o avatar não é espremido. *(O teste troca o nome por um texto gigante e confere.)*
8. **R8** – `.mensagens` é um flex em coluna com `gap` de 8px ou mais, **cresce** e **rola sozinha**; o campo de digitar nunca sai do fim da tela, nem com 30 mensagens a mais. *(O teste adiciona 30 mensagens e confere.)*
9. **R9** – Bolhas (`.msg`): flex em coluna, `border-radius` de 12px ou mais, `padding` de 8px ou mais e **no máximo 80%** da largura da conversa. A mensagem longa deve quebrar linha, e as curtas **não** esticam até as bordas.
10. **R10** – Mensagens recebidas coladas à **esquerda** e enviadas coladas à **direita**.
11. **R11** – Recebidas e enviadas com cores de fundo diferentes.
12. **R12** – O horário (`.hora`) tem fonte menor que o texto, fica no **canto inferior direito** da bolha e tem só o tamanho do próprio texto (não fica esticado).
13. **R13** – O `.divisor` mostra "Hoje" no meio com **uma linha fina de cada lado**, feitas com `::before` e `::after` esticando com `flex-grow`; é um flex com `align-items: center` e `gap`.
14. **R14** – `.digitando` é uma bolha compacta (até 120px) à esquerda, com `padding`, `border-radius` e 3 bolinhas redondas (6 a 14px), na mesma linha, centralizadas e com `gap`.
15. **R15** – As bolinhas animam com `@keyframes`, repetindo para sempre, e cada uma tem um `animation-delay` diferente (efeito de onda).
16. **R16** – `.entrada` é um flex com `gap`: o campo **cresce** (36px ou mais de altura), o botão fica ao lado, alinhados, e a barra fica colada no fim do chat.
17. **R17** – Celular (375px): o chat ocupa a largura toda e mantém a altura da tela, campo e botão continuam na mesma linha dentro da tela e não há rolagem horizontal.

<details>
<summary>💡 Dicas (abra só se travar)</summary>

**Nível 1 – Ideias**
- Alinhar um item **individualmente** (sem mexer nos outros) é trabalho de uma propriedade que começa com `align-`. Ela serve para as bolhas e também para o horário.
- Uma área que "rola sozinha" precisa de duas coisas: um limite de altura (vindo do pai, que tem a altura da tela) e permissão para rolar por dentro.
- Para cortar texto com reticências existe um trio de propriedades. Lembre que reticências só funcionam em elementos de **bloco** e em texto que **não quebra de linha**.
- As linhas do divisor são "enfeites" que nascem do CSS, sem existir no HTML: pesquise por **pseudo-elementos**.
- A animação precisa de dois pedaços: a definição dos quadros (`@keyframes`) e a aplicação em cada bolinha.

**Nível 2 – Nomes das ferramentas**
- Bolhas: `align-self: flex-start` / `flex-end` e `max-width` em porcentagem.
- Scroll interno: o `.chat` com `height: 100vh` e a `.mensagens` com `flex: 1` e `overflow-y: auto`.
- Reticências: `white-space: nowrap`, `overflow: hidden` e `text-overflow: ellipsis`.
- Divisor: `.divisor::before` e `.divisor::after` com `content: ""`, `flex: 1` e uma altura de 1px com cor de fundo.
- Onda das bolinhas: `animation-delay` diferente com `:nth-child(2)` e `:nth-child(3)`.
- 🪤 **Pegadinha clássica (R7):** itens flex têm um `min-width` automático que impede que eles encolham abaixo do conteúdo. Se o nome longo empurra o botão para fora, o item do meio precisa ter permissão para encolher: `min-width: 0`.
</details>

---

## Como entregar

1. Clone o repositório: `git clone https://github.com/NicolasDimitri/web-07-flex-chat.git` e entre na pasta.
2. Crie uma branch: `git switch -c meu-projeto`
3. Crie os arquivos pedidos aqui na raiz, ao lado deste README.
4. `git add .` → `git commit -m "mensagem"` → `git push -u origin meu-projeto`
5. No GitHub, clique em **Compare & pull request** → **Create pull request**.
6. A cada commit, o robô adiciona **um novo comentário** no PR com uma **tabela de requisitos** (✅ passou / ❌ não passou, com a dica do que falta) e a **porcentagem concluída**.
   Os comentários anteriores ficam como histórico do seu progresso. Corrija, faça novo commit + `git push` e uma nova tabela aparece.
7. Com tudo ✅, sua entrega está concluída. **O PR não será mesclado na `main`**: ele fica aberto só para a avaliação e para o instrutor revisar.

## Testar no seu computador (opcional)

```bash
npm install
npx playwright install --with-deps chromium   # só na primeira vez
npm test
```

> Não altere as pastas `tests/`, `scripts/` e `.github/`.
