# Testes automatizados — Checkout da Loja Exemplo

Testes de interface (E2E) que abrem uma loja virtual num navegador de verdade e verificam o **fluxo de checkout**: adicionar produtos ao carrinho, preencher entrega e pagamento e finalizar a compra, incluindo os casos em que a compra **deve ser barrada**.

A loja testada (**Loja Exemplo**) fica dentro do próprio repositório, na pasta `app/`. O Playwright a sobe sozinho antes dos testes, então não depende de site externo: os testes são estáveis, rápidos e rodam iguais na sua máquina e no CI.

Ferramentas usadas:

- [**Playwright**](https://playwright.dev/): controla o navegador (clica, digita, confere textos).
- [**Allure Report**](https://allurereport.org/): relatório visual com cada passo, prints e vídeos.
- **GitHub Actions**: roda os testes a cada push ou pull request e publica o relatório Allure no GitHub Pages.

**Resumo dos cenários** (detalhes na [seção 5.1](#51-detalhe-de-cada-arquivo)):

| Tipo | Quantidade | Resultado atual |
|---|---|---|
| ✅ Positivos: o cliente faz o esperado e a compra é concluída | 7 | Passam |
| 🚫 Negativos: dados inválidos ou incompletos, a loja deve barrar a compra | 19 | Passam (a recusa é a falha **esperada** e é verificada) |
| 🐞 Bug conhecido: nome no cartão aceita números | 1 | **Falha esperada** (`test.fail`), contada como sucesso |

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação](#2-instalação)
3. [Rodando os testes](#3-rodando-os-testes)
4. [Vendo os relatórios](#4-vendo-os-relatórios)
5. [Estrutura do projeto](#5-estrutura-do-projeto)
6. [Como os testes são organizados (Page Objects)](#6-como-os-testes-são-organizados-page-objects)
7. [Boas práticas aplicadas](#7-boas-práticas-aplicadas)
8. [Guia de manutenção](#8-guia-de-manutenção)
9. [CI/CD (GitHub Actions)](#9-cicd-github-actions)
10. [Problemas comuns](#10-problemas-comuns)

---

## 1. Pré-requisitos

| Programa | Para que serve | Como verificar |
|---|---|---|
| **Node.js** 18 ou superior ([download](https://nodejs.org/)) | Executa a loja e os testes | `node -v` |
| **Git** ([download](https://git-scm.com/)) | Baixar e versionar o projeto | `git --version` |
| **Java** 8 ou superior ([download](https://adoptium.net/)) | **Apenas** para gerar o relatório Allure | `java -version` |
| **VS Code** (opcional) | Editor recomendado, com a extensão *Playwright Test for VSCode* | — |

## 2. Instalação

```bash
git clone https://github.com/SEU-USUARIO/teste-tecnico-checkout-web.git
cd teste-tecnico-checkout-web
npm install
npx playwright install --with-deps chromium
```

O último comando instala o navegador do Playwright. Só precisa ser feito uma vez.

## 3. Rodando os testes

| Comando | O que faz |
|---|---|
| `npm test` | Sobe a loja e roda todos os testes sem abrir o navegador |
| `npx playwright test --headed` | Roda mostrando o navegador |
| `npx playwright test --ui` | Interface visual: escolher testes, ver passo a passo, repetir |
| `npx playwright test tests/e2e/checkout.spec.js` | Roda só um arquivo |
| `npx playwright test -g "cartão vencido"` | Roda só os testes cujo nome contém o texto |
| `npx playwright test --grep @positivo` | Só positivos (`@negativo` e `@bug` para os outros grupos) |
| `npx playwright test --debug` | Modo depuração, pausando a cada passo |
| `npm run loja` | Sobe **só a loja** em http://localhost:3000 para navegar manualmente |

Resultado esperado no terminal (resumido):

```
Running 27 tests using 4 workers
  ✓  … › Carrinho de compras › Cenários positivos › adiciona produtos e atualiza contador, itens e totais com frete @positivo
  ✓  … › Checkout › Cenários positivos › finaliza a compra com dados válidos (Visa) @positivo
  ✓  … › Checkout › Cenários negativos: dados de pagamento › recusa número de cartão com dígito verificador errado (Luhn) @negativo
  ✓  … › Checkout › Cenários negativos: endereço de entrega › bloqueia a compra com endereço incompleto: sem CEP @negativo
  ✘  … › Bug conhecido: nome no cartão aceita números › nome impresso no cartão com números deveria ser recusado @bug
  27 passed
```

> O **✘ do teste `@bug` é normal**: ele falha de propósito e o Playwright o conta como sucesso. Veja [bug-nome-cartao.spec.js](#testse2ebug-nome-cartaospecjs-bug-conhecido).

## 4. Vendo os relatórios

Não abra o `index.html` com duplo clique (a página fica em branco). Use os comandos:

```bash
npm run allure:serve        # relatório Allure da última execução (principal)
npx playwright show-report  # relatório HTML do Playwright (útil para traces)
```

| Comando | O que faz |
|---|---|
| `npm run test:allure` | Roda os testes **e** gera o relatório em `allure-report/` |
| `npm run allure:generate` | Gera o relatório a partir de `allure-results/` |
| `npm run allure:open` | Abre um relatório já gerado |

O que olhar no Allure:

- **Overview**: totais de testes e informações do ambiente.
- **Suites**: cada teste com seus passos (`Preencher endereço de entrega`, `Verificar erro em "CVV": CVV inválido.`…) e os anexos:
  - **Evidência: …**: prints tirados nos momentos importantes (formulário preenchido, mensagem de erro, pedido confirmado);
  - **screenshot**: print ao final do teste;
  - **video**: gravação do teste inteiro (use Chrome, Edge ou Firefox para reproduzir `.webm`).
- **Behaviors / Tags**: filtre por `positivo`, `negativo` e `bug`.

Nos **cenários negativos** o relatório mostra a falha esperada: o print traz o campo destacado em vermelho com a mensagem de erro, e os passos registram que o cliente continuou no checkout e que nenhum pedido foi criado.

## 5. Estrutura do projeto

```
teste-tecnico-checkout-web/
├── .github/workflows/
│   └── playwright.yml          → pipeline CI/CD: roda os testes e publica o relatório
├── app/                        → A LOJA TESTADA (e-commerce de exemplo)
│   ├── server.js               → servidor local (npm run loja)
│   └── public/
│       ├── index.html          → vitrine de produtos
│       ├── carrinho.html       → carrinho com quantidades e totais
│       ├── checkout.html       → formulário de entrega e pagamento
│       ├── confirmacao.html    → pedido confirmado
│       ├── styles.css
│       └── js/                 → regras da loja (carrinho, validações, operadora simulada)
├── tests/
│   ├── e2e/
│   │   ├── carrinho.spec.js        → cenários do carrinho
│   │   ├── checkout.spec.js        → cenários de pagamento, entrega e finalização
│   │   └── bug-nome-cartao.spec.js → bug conhecido (falha esperada, test.fail)
│   ├── pages/
│   │   ├── HomePage.js         → vitrine: adicionar produtos, contador do carrinho
│   │   ├── CartPage.js         → carrinho: itens, quantidades, totais, finalizar
│   │   ├── CheckoutPage.js     → formulário, erros de validação, recusa da operadora
│   │   └── ConfirmationPage.js → verificações do pedido confirmado
│   ├── data/
│   │   ├── produtos.json       → produtos e preços esperados
│   │   └── checkout.json       → cliente, cartões válidos/inválidos, endereços incompletos
│   └── support/
│       ├── evidencia.js        → print de evidência anexado ao relatório
│       └── moeda.js            → formatação em R$ e soma sem erro de arredondamento
├── playwright.config.js
├── package.json
└── README.md
```

Pastas geradas automaticamente (não versionadas): `node_modules/`, `test-results/`, `playwright-report/`, `allure-results/`, `allure-report/`.

### 5.1 Detalhe de cada arquivo

#### A Loja Exemplo (`app/`)

Uma loja simples, mas com regras reais de checkout para que os testes tenham o que validar:

| Regra | Comportamento |
|---|---|
| Frete | R$ 19,90; **grátis** com subtotal a partir de R$ 300,00 |
| Carrinho vazio | Botão *Finalizar compra* desabilitado; acessar `/checkout.html` direto volta para o carrinho |
| Campos obrigatórios | Nome, CEP, endereço, número, cidade, estado, nome no cartão, número, validade e CVV (complemento é opcional) |
| CEP | 8 dígitos, com ou sem hífen |
| Número do cartão | Só dígitos e espaços, 13 a 19 dígitos e **dígito verificador válido (algoritmo de Luhn)** |
| Validade | Formato `MM/AA`, mês de 01 a 12 e não vencida |
| CVV | 3 ou 4 dígitos |
| Operadora simulada | Após menos de 1 s de processamento aprova o pagamento; o cartão `4000 0000 0000 0002` é sempre **recusado** |

Quando há erro, o campo recebe `aria-invalid="true"`, a mensagem aparece logo abaixo e um aviso no topo pede a correção. O foco vai para o primeiro campo com erro.

#### `tests/e2e/carrinho.spec.js`

**Positivos (`@positivo`)**

| Cenário | O que verifica |
|---|---|
| adiciona produtos e atualiza contador, itens e totais com frete | 1 fone + 2 mouses: contador = 3, linhas, totais por item e frete grátis (subtotal ≥ R$ 300) |
| cobra frete quando o subtotal é menor que R$ 300 | 1 fone: frete R$ 19,90 somado ao total |
| altera a quantidade e recalcula os totais | Mouse de 1 para 4 unidades: total da linha, subtotal e contador |
| remove um item e mantém os demais | Remove o teclado e confere que só o fone ficou, com totais recalculados |

**Negativos (`@negativo`)**

| Cenário | Comportamento esperado |
|---|---|
| carrinho vazio não permite finalizar a compra | Mensagem “Seu carrinho está vazio.” e botão desabilitado |
| remover o último item esvazia o carrinho e bloqueia a compra | Carrinho vazio, contador 0, botão desabilitado |
| acesso direto ao checkout com carrinho vazio volta para o carrinho | Redireciona de `/checkout.html` para `/carrinho.html` |

#### `tests/e2e/checkout.spec.js`

Todos os cenários começam igual (`beforeEach`): adiciona 1 fone + 1 mouse (R$ 289,80 + frete R$ 19,90 = **R$ 309,70**), vai ao carrinho, clica em *Finalizar compra* e confere o total no resumo do pedido.

**Positivos (`@positivo`)**

| Cenário | O que verifica |
|---|---|
| finaliza a compra com dados válidos (Visa) | Página “Pedido confirmado!”, número no formato `LE-000000`, itens, total, “final 1111”, endereço completo e carrinho zerado após a compra |
| finaliza a compra com Mastercard e sem complemento | Campo opcional vazio não bloqueia; endereço exibido sem complemento |
| permite corrigir um cartão inválido e concluir a compra | Recusa o cartão, o cliente corrige e conclui (recuperação após erro) |

**Negativos: pagamento (`@negativo`)**

| Cenário | Entrada | Comportamento esperado |
|---|---|---|
| recusa número de cartão com dígito verificador errado (Luhn) | `4111 1111 1111 1112` | “Número do cartão inválido.” |
| recusa número de cartão com letras | `4111 abcd 1111 1111` | “Número do cartão inválido.” |
| recusa número de cartão curto demais | `4111 1111` | “Número do cartão inválido.” |
| recusa número de cartão vazio | *(vazio)* | “Informe o número do cartão.” |
| recusa cartão vencido | `01/20` | “Cartão vencido.” |
| recusa validade com mês inexistente | `13/30` | “Validade inválida. Use MM/AA.” |
| recusa CVV incompleto | `12` | “CVV inválido.” |
| operadora recusa o pagamento e o cliente continua no checkout | `4000 0000 0000 0002` | Aviso de recusa, botão reabilitado, nenhum pedido criado e carrinho mantido |

**Negativos: endereço de entrega (`@negativo`)**

| Cenário | Comportamento esperado |
|---|---|
| bloqueia a compra com endereço incompleto: sem nome / sem CEP / sem rua / sem número / sem cidade / sem estado | Mensagem específica no campo vazio e **só nele** (6 testes, gerados a partir de `checkout.json`) |
| recusa CEP em formato inválido | “CEP inválido. Use 8 dígitos.” |
| formulário vazio aponta todos os campos obrigatórios | Os 10 obrigatórios marcados, o complemento não, e foco no primeiro campo |

Em todo cenário negativo os testes conferem quatro coisas: a **mensagem exata**, o campo marcado como inválido, o aviso no topo e que o cliente **continua no checkout** (a compra não foi concluída).

#### `tests/e2e/bug-nome-cartao.spec.js`: bug conhecido

A loja aceita números no **Nome impresso no cartão** (ex.: `MARIA 1234`) e conclui a compra. O comportamento correto seria recusar com “Nome inválido. Use apenas letras.”.

> Este defeito foi deixado **de propósito** na loja de exemplo (regra `nomeCartao` em `app/public/js/checkout.js`) para demonstrar como documentar um bug com `test.fail()`, no mesmo padrão usado em projetos reais.

| O que aparece | O que significa |
|---|---|
| ✘ no terminal, mas contado em `passed` (no Allure: **passed** com a tag **bug**) | O bug continua na loja. Resultado esperado, com prints e anotação no relatório |
| ❌ Falha com `Expected to fail, but passed` | **A loja foi corrigida.** Remova o `test.fail()` do teste |

Para conferir a correção: em `checkout.js`, troque a regra `nomeCartao` por uma que recuse números (mensagem “Nome inválido. Use apenas letras.”) e rode `npx playwright test --grep @bug`.

#### `tests/data/*.json`: massa de dados

Toda entrada usada nos testes fica aqui. Para testar outro cartão, endereço ou mensagem, **altere só o JSON**. Novos itens em `cartoesInvalidos` ou `enderecosIncompletos` viram novos testes automaticamente.

#### `playwright.config.js`

Igual ao padrão do Playwright, com duas adições:

| Opção | Valor | Significado |
|---|---|---|
| `baseURL` | `http://localhost:3000` (ou `BASE_URL`) | Endereço da loja |
| `webServer` | `npm run loja` | Sobe a loja antes dos testes e derruba no final |
| `screenshot` / `video` | `"on"` | Print e vídeo de todos os testes, para evidência |
| `retries` | 2 no CI, 0 local | Repetição apenas no CI |

## 6. Como os testes são organizados (Page Objects)

Cada página da loja vira uma classe em `tests/pages/`:

```
checkout.spec.js ──usa──▶ CheckoutPage.preencherEConfirmar(cliente, cartao)
       │                        └─ sabe que o campo é getByLabel("Número do cartão")
       └──usa──▶ CheckoutPage.deveRecusarCampo("numeroCartao", "Número do cartão inválido.")
                                └─ confere mensagem, aria-invalid, aviso e URL
```

- **Seletores e ações** → classes de `pages/`.
- **Cenários (o que testar)** → arquivos `.spec.js`.
- **Dados** → `data/`.

## 7. Boas práticas aplicadas

- **Seletores estáveis e acessíveis**: `getByRole`, `getByLabel` e `data-testid`, nunca classes de CSS ou XPath.
- **Sem esperas fixas** (`waitForTimeout`): só asserções que esperam sozinhas (`expect(...).toHaveText`), inclusive no processamento do pagamento.
- **Ação confirmada antes do próximo passo**: ao adicionar um produto, o teste espera o contador mudar.
- **Testes independentes**: cada teste começa do zero (navegador limpo) e pode rodar sozinho ou em paralelo.
- **Data-driven**: os casos de cartão inválido e endereço incompleto são gerados a partir do JSON.
- **Validações claras**: mensagens de erro exatas, nomes de asserção (“deveria continuar no checkout”) e passos com descrição legível no relatório.
- **Falhas esperadas tratadas**: recusas de validação e da operadora são verificadas como comportamento correto; o bug conhecido usa `test.fail()` com anotação.
- **Estabilidade comprovada**: a suíte foi executada 81 vezes seguidas (`--repeat-each=3`, 4 workers) sem nenhuma falha intermitente.

## 8. Guia de manutenção

### 8.1 Um teste começou a falhar

1. Rode vendo o navegador: `npx playwright test --headed -g "nome do teste"`.
2. Abra o relatório (`npm run allure:serve`) e veja em qual passo falhou, o print e o vídeo.
3. Causas comuns:
   - **Rótulo ou texto mudou na loja** → atualize o `ROTULOS` em `CheckoutPage.js` ou o seletor na classe da página.
   - **Mensagem de erro mudou** → atualize em `data/checkout.json`.
   - **Preço ou frete mudou** → atualize `data/produtos.json`.

### 8.2 Criar um novo cenário

Exemplo: recusar cartão com CVV de letras.

1. Adicione o dado em `checkout.json`: `"cvvComLetras": { "valor": "1a3", "mensagem": "CVV inválido." }`.
2. Crie o teste em `checkout.spec.js`, dentro de *Cenários negativos: dados de pagamento*:

```js
test("recusa CVV com letras", async ({ page }) => {
  const { valor, mensagem } = dados.cvvComLetras;
  await checkout.preencherEConfirmar(clienteValido, { ...cartaoVisa, cvv: valor });

  await checkout.deveRecusarCampo("cvv", mensagem);
  await evidencia(page, "CVV com letras");
});
```

3. Rode: `npx playwright test -g "CVV com letras"`.

### 8.3 Testar outro e-commerce

A arquitetura não depende da loja: troque o `baseURL` (ou a variável `BASE_URL`), remova o `webServer` do `playwright.config.js` e ajuste os seletores nas classes de `pages/`. Os cenários continuam os mesmos.

### 8.4 Rodar em outros navegadores

Descomente `firefox` e `webkit` em `projects` no `playwright.config.js` e rode `npx playwright install --with-deps`.

## 9. CI/CD (GitHub Actions)

O arquivo `.github/workflows/playwright.yml` roda em todo push e pull request para a `main` (ou manualmente na aba **Actions**):

1. **Job `test`**: instala dependências e o Chromium, roda os testes (a loja sobe sozinha pelo `webServer`), gera o Allure e guarda `playwright-report` e `allure-report` como artifacts por 30 dias. Os relatórios são gerados **mesmo se algum teste falhar**.
2. **Job `deploy-report`** (só na `main`): publica o relatório Allure no GitHub Pages.

**Configuração única do GitHub Pages:** no repositório, **Settings → Pages → Source: GitHub Actions**. Sem isso o job `deploy-report` falha com `status: 404`. Depois, na aba Actions, use **Re-run failed jobs**.

Onde ver o resultado:

| Onde | Como |
|---|---|
| Status | Aba **Actions**: verde = tudo certo (inclusive a falha esperada do `@bug`) |
| Relatório online | `https://SEU-USUARIO.github.io/teste-tecnico-checkout-web/` |
| Qualquer branch | Aba **Actions** → execução → **Artifacts** → baixe `allure-report` e rode `npx allure open caminho/da/pasta` |

## 10. Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Executable doesn't exist ... chromium` | Navegador não instalado | `npx playwright install --with-deps chromium` |
| `Error: http://localhost:3000 is already used` | Porta ocupada por outro programa | Feche o programa ou rode com `PORT=3001 npm test` |
| `strict mode violation` | Seletor encontrou mais de um elemento | Use `{ exact: true }` no `getByLabel`/`getByText` |
| Relatório abre em branco | Abriu o `index.html` direto | `npm run allure:serve` ou `npx playwright show-report` |
| `allure: JAVA_HOME is not set` | Java não instalado | Instale o Java (seção 1) |
| Teste `@bug` falha com `Expected to fail, but passed` | O bug do nome no cartão foi corrigido | Remova o `test.fail()` de `bug-nome-cartao.spec.js` |
| Job `deploy-report` falha com `status: 404` | GitHub Pages não ativado | Settings → Pages → Source: **GitHub Actions** |
