const { test, expect } = require("@playwright/test");
const { HomePage } = require("../pages/HomePage");
const { CartPage } = require("../pages/CartPage");
const { CheckoutPage } = require("../pages/CheckoutPage");
const produtos = require("../data/produtos.json");
const { somar } = require("../support/moeda");
const { evidencia } = require("../support/evidencia");

const { fone, mouse, teclado, frete } = produtos;

test.describe("Carrinho de compras", () => {
  let home;
  let carrinho;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    carrinho = new CartPage(page);
    await home.visitar();
  });

  test.describe("Cenários positivos", { tag: "@positivo" }, () => {
    test("adiciona produtos e atualiza contador, itens e totais com frete", async ({ page }) => {
      await home.adicionarAoCarrinho(fone.nome);
      await home.adicionarAoCarrinho(mouse.nome, 2);
      await home.deveExibirContador(3);
      await evidencia(page, "Vitrine com 3 itens no carrinho");

      await home.irParaCarrinho();
      await carrinho.deveTerQuantidadeDeItens(2);
      await carrinho.deveConterItem(fone.nome, 1, fone.preco);
      await carrinho.deveConterItem(mouse.nome, 2, mouse.preco);

      const subtotal = somar(fone.preco, mouse.preco, mouse.preco); // 379,70 → frete grátis
      await carrinho.deveExibirTotais({ subtotal, frete: 0, total: subtotal });
      await evidencia(page, "Carrinho com totais");
    });

    test("cobra frete quando o subtotal é menor que R$ 300", async ({ page }) => {
      await home.adicionarAoCarrinho(fone.nome);
      await home.irParaCarrinho();

      await carrinho.deveExibirTotais({
        subtotal: fone.preco,
        frete,
        total: somar(fone.preco, frete),
      });
      await evidencia(page, "Carrinho com frete cobrado");
    });

    test("altera a quantidade e recalcula os totais", async ({ page }) => {
      await home.adicionarAoCarrinho(mouse.nome);
      await home.irParaCarrinho();
      await carrinho.alterarQuantidade(mouse.nome, 4);

      await carrinho.deveConterItem(mouse.nome, 4, mouse.preco);
      const subtotal = somar(mouse.preco * 4); // 359,60 → frete grátis
      await carrinho.deveExibirTotais({ subtotal, frete: 0, total: subtotal });
      await home.deveExibirContador(4);
      await evidencia(page, "Quantidade alterada");
    });

    test("remove um item e mantém os demais", async ({ page }) => {
      await home.adicionarAoCarrinho(fone.nome);
      await home.adicionarAoCarrinho(teclado.nome);
      await home.irParaCarrinho();

      await carrinho.remover(teclado.nome);

      await carrinho.deveTerQuantidadeDeItens(1);
      await carrinho.deveConterItem(fone.nome, 1, fone.preco);
      await carrinho.deveExibirTotais({ subtotal: fone.preco, frete, total: somar(fone.preco, frete) });
      await evidencia(page, "Item removido");
    });
  });

  test.describe("Cenários negativos", { tag: "@negativo" }, () => {
    test("carrinho vazio não permite finalizar a compra", async ({ page }) => {
      await home.irParaCarrinho();

      await carrinho.deveEstarVazio();
      await evidencia(page, "Carrinho vazio com botão desabilitado");
    });

    test("remover o último item esvazia o carrinho e bloqueia a compra", async ({ page }) => {
      await home.adicionarAoCarrinho(mouse.nome);
      await home.irParaCarrinho();
      await carrinho.remover(mouse.nome);

      await carrinho.deveEstarVazio();
      await home.deveExibirContador(0);
      await evidencia(page, "Último item removido");
    });

    test("acesso direto ao checkout com carrinho vazio volta para o carrinho", async ({ page }) => {
      const checkout = new CheckoutPage(page);
      await checkout.visitar();

      await expect(page).toHaveURL(/carrinho\.html$/);
      await carrinho.deveEstarVazio();
      await evidencia(page, "Redirecionado para o carrinho");
    });
  });
});
