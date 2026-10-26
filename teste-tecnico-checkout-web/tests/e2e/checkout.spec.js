const { test, expect } = require("@playwright/test");
const { HomePage } = require("../pages/HomePage");
const { CartPage } = require("../pages/CartPage");
const { CheckoutPage } = require("../pages/CheckoutPage");
const { ConfirmationPage } = require("../pages/ConfirmationPage");
const produtos = require("../data/produtos.json");
const dados = require("../data/checkout.json");
const { somar } = require("../support/moeda");
const { evidencia } = require("../support/evidencia");

const { fone, mouse, frete } = produtos;
const { clienteValido, cartaoVisa, cartaoMastercard } = dados;

// Pedido usado em todos os cenários: 1 fone + 1 mouse = R$ 289,80 + frete R$ 19,90
const ITENS = [
  { ...fone, quantidade: 1 },
  { ...mouse, quantidade: 1 },
];
const SUBTOTAL = somar(fone.preco, mouse.preco);
const TOTAL = somar(SUBTOTAL, frete);

test.describe("Checkout: pagamento e finalização da compra", () => {
  let carrinho;
  let checkout;
  let confirmacao;

  // Pré-condição: produtos no carrinho e cliente na tela de checkout
  test.beforeEach(async ({ page }) => {
    const home = new HomePage(page);
    carrinho = new CartPage(page);
    checkout = new CheckoutPage(page);
    confirmacao = new ConfirmationPage(page);

    await home.visitar();
    for (const item of ITENS) await home.adicionarAoCarrinho(item.nome, item.quantidade);
    await home.irParaCarrinho();
    await carrinho.finalizarCompra();
    await checkout.deveExibirTotal(TOTAL, frete);
  });

  test.describe("Cenários positivos", { tag: "@positivo" }, () => {
    test("finaliza a compra com dados válidos (Visa)", async ({ page }) => {
      await checkout.preencherEntrega(clienteValido);
      await checkout.preencherPagamento(cartaoVisa);
      await evidencia(page, "Formulário preenchido");
      await checkout.confirmarPagamento();

      await confirmacao.deveExibirPedidoConfirmado({
        itens: ITENS,
        total: TOTAL,
        finalCartao: "1111",
        cliente: clienteValido,
      });
      await evidencia(page, "Pedido confirmado");

      await test.step("Carrinho deve ser esvaziado após a compra", async () => {
        await carrinho.visitar();
        await carrinho.deveEstarVazio();
      });
    });

    test("finaliza a compra com Mastercard e sem complemento (campo opcional)", async ({ page }) => {
      const clienteSemComplemento = { ...clienteValido, complemento: "" };

      await checkout.preencherEConfirmar(clienteSemComplemento, cartaoMastercard);

      await confirmacao.deveExibirPedidoConfirmado({
        itens: ITENS,
        total: TOTAL,
        finalCartao: "4444",
        cliente: clienteSemComplemento,
      });
      await evidencia(page, "Pedido confirmado sem complemento");
    });

    test("permite corrigir um cartão inválido e concluir a compra", async ({ page }) => {
      await checkout.preencherEConfirmar(clienteValido, {
        ...cartaoVisa,
        numero: dados.cartoesInvalidos[0].numero,
      });
      await checkout.deveRecusarCampo("numeroCartao", dados.mensagemCartaoInvalido);
      await evidencia(page, "Cartão recusado na validação");

      await checkout.preencherPagamento(cartaoVisa);
      await checkout.confirmarPagamento();

      await confirmacao.deveExibirPedidoConfirmado({
        itens: ITENS,
        total: TOTAL,
        finalCartao: "1111",
        cliente: clienteValido,
      });
      await evidencia(page, "Pedido confirmado após correção");
    });
  });

  test.describe("Cenários negativos: dados de pagamento", { tag: "@negativo" }, () => {
    for (const { descricao, numero, mensagem } of dados.cartoesInvalidos) {
      test(`recusa número de cartão ${descricao}`, async ({ page }) => {
        await checkout.preencherEConfirmar(clienteValido, { ...cartaoVisa, numero });

        await checkout.deveRecusarCampo("numeroCartao", mensagem ?? dados.mensagemCartaoInvalido);
        await checkout.deveExibirErroApenasEm(["numeroCartao"]);
        await evidencia(page, `Cartão ${descricao}`);
      });
    }

    test("recusa cartão vencido", async ({ page }) => {
      const { valor, mensagem } = dados.validadeVencida;
      await checkout.preencherEConfirmar(clienteValido, { ...cartaoVisa, validade: valor });

      await checkout.deveRecusarCampo("validade", mensagem);
      await checkout.deveExibirErroApenasEm(["validade"]);
      await evidencia(page, "Cartão vencido");
    });

    test("recusa validade com mês inexistente", async ({ page }) => {
      const { valor, mensagem } = dados.validadeFormatoInvalido;
      await checkout.preencherEConfirmar(clienteValido, { ...cartaoVisa, validade: valor });

      await checkout.deveRecusarCampo("validade", mensagem);
      await evidencia(page, "Validade inválida");
    });

    test("recusa CVV incompleto", async ({ page }) => {
      const { valor, mensagem } = dados.cvvIncompleto;
      await checkout.preencherEConfirmar(clienteValido, { ...cartaoVisa, cvv: valor });

      await checkout.deveRecusarCampo("cvv", mensagem);
      await checkout.deveExibirErroApenasEm(["cvv"]);
      await evidencia(page, "CVV incompleto");
    });

    test("operadora recusa o pagamento e o cliente continua no checkout", async ({ page }) => {
      await checkout.preencherEConfirmar(clienteValido, dados.cartaoRecusadoPelaOperadora);

      await checkout.deveExibirPagamentoRecusado(dados.mensagemPagamentoRecusado);
      await evidencia(page, "Pagamento recusado pela operadora");

      await test.step("Pedido não foi criado e o carrinho foi mantido", async () => {
        await carrinho.visitar();
        await carrinho.deveTerQuantidadeDeItens(ITENS.length);
        await carrinho.deveExibirTotais({ subtotal: SUBTOTAL, frete, total: TOTAL });
      });
    });
  });

  test.describe("Cenários negativos: endereço de entrega", { tag: "@negativo" }, () => {
    for (const { campo, descricao, mensagem } of dados.enderecosIncompletos) {
      test(`bloqueia a compra com endereço incompleto: ${descricao}`, async ({ page }) => {
        await checkout.preencherEConfirmar({ ...clienteValido, [campo]: "" }, cartaoVisa);

        await checkout.deveRecusarCampo(campo, mensagem);
        await checkout.deveExibirErroApenasEm([campo]);
        await evidencia(page, `Endereço ${descricao}`);
      });
    }

    test("recusa CEP em formato inválido", async ({ page }) => {
      const { valor, mensagem } = dados.cepInvalido;
      await checkout.preencherEConfirmar({ ...clienteValido, cep: valor }, cartaoVisa);

      await checkout.deveRecusarCampo("cep", mensagem);
      await evidencia(page, "CEP inválido");
    });

    test("formulário vazio aponta todos os campos obrigatórios", async ({ page }) => {
      await checkout.confirmarPagamento();

      const obrigatorios = [
        "nome", "cep", "endereco", "numero", "cidade", "estado",
        "nomeCartao", "numeroCartao", "validade", "cvv",
      ];
      await checkout.deveExibirErroApenasEm(obrigatorios);
      await expect(checkout.resumoErros).toHaveText("Corrija os campos destacados para continuar.");
      await expect(checkout.campo("nome"), "foco vai para o primeiro campo com erro").toBeFocused();
      await checkout.deveEstarNoCheckout();
      await evidencia(page, "Formulário vazio");
    });
  });
});
