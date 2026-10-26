const { test, expect } = require("@playwright/test");
const { HomePage } = require("../pages/HomePage");
const { CartPage } = require("../pages/CartPage");
const { CheckoutPage } = require("../pages/CheckoutPage");
const produtos = require("../data/produtos.json");
const dados = require("../data/checkout.json");
const { evidencia } = require("../support/evidencia");

test.describe("Bug conhecido: nome no cartão aceita números", () => {
  // Falha esperada (test.fail): enquanto o bug existir o teste falha e o
  // Playwright conta como sucesso. Se a loja for corrigida, o teste passa e o
  // Playwright acusa "Expected to fail, but passed": aí é só remover o test.fail().
  test(
    "nome impresso no cartão com números deveria ser recusado",
    { tag: "@bug" },
    async ({ page }) => {
      test.fail(true, "Bug conhecido na loja: o nome do cartão não valida números");
      test.info().annotations.push({
        type: "bug",
        description:
          "A regra nomeCartao em app/public/js/checkout.js só verifica se o campo está preenchido; deveria aceitar apenas letras e espaços.",
      });

      const home = new HomePage(page);
      const carrinho = new CartPage(page);
      const checkout = new CheckoutPage(page);

      await home.visitar();
      await home.adicionarAoCarrinho(produtos.fone.nome);
      await home.irParaCarrinho();
      await carrinho.finalizarCompra();

      await checkout.preencherEntrega(dados.clienteValido);
      await checkout.preencherPagamento({ ...dados.cartaoVisa, nome: dados.nomeCartaoComNumeros });
      await evidencia(page, `Nome no cartão: ${dados.nomeCartaoComNumeros}`);
      await checkout.confirmarPagamento();

      // Comportamento correto: a loja deveria barrar e mostrar a mensagem abaixo.
      // Com o bug, a compra segue para a confirmação e a verificação falha.
      await expect(
        checkout.mensagemErro("nomeCartao"),
        "o nome com números deveria ser recusado",
      ).toHaveText("Nome inválido. Use apenas letras.", { timeout: 3000 });
    },
  );

  test.afterEach(async ({ page }) => {
    await evidencia(page, "Tela após confirmar o pagamento");
  });
});
