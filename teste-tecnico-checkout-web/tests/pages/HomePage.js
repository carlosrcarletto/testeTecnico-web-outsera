const { test, expect } = require("@playwright/test");

class HomePage {
  constructor(page) {
    this.page = page;
    this.titulo = page.getByRole("heading", { level: 1, name: "Produtos" });
    this.produtos = page.getByTestId("produto");
    this.contadorCarrinho = page.getByTestId("contador-carrinho");
    this.avisoCarrinho = page.getByTestId("aviso-carrinho");
    this.linkCarrinho = page.getByRole("link", { name: /Carrinho/ });
  }

  async visitar() {
    await test.step("Abrir a vitrine de produtos", async () => {
      await this.page.goto("/");
      await expect(this.titulo).toBeVisible();
      await expect(this.produtos.first()).toBeVisible();
    });
  }

  cardDoProduto(nome) {
    return this.produtos.filter({
      has: this.page.getByRole("heading", { name: nome, exact: true }),
    });
  }

  // Clica em "Adicionar ao carrinho" e só segue quando o contador mudou,
  // garantindo que o item foi realmente gravado antes do próximo passo.
  async adicionarAoCarrinho(nome, quantidade = 1) {
    await test.step(`Adicionar "${nome}" ao carrinho (${quantidade}x)`, async () => {
      for (let i = 0; i < quantidade; i++) {
        const antes = Number(await this.contadorCarrinho.textContent());
        await this.cardDoProduto(nome).getByRole("button", { name: "Adicionar ao carrinho" }).click();
        await expect(this.contadorCarrinho).toHaveText(String(antes + 1));
        await expect(this.avisoCarrinho).toHaveText(`${nome} adicionado ao carrinho`);
      }
    });
  }

  async deveExibirContador(quantidade) {
    await expect(this.contadorCarrinho, "contador do carrinho").toHaveText(String(quantidade));
  }

  async irParaCarrinho() {
    await test.step("Ir para o carrinho", async () => {
      await this.linkCarrinho.click();
      await expect(this.page).toHaveURL(/carrinho\.html$/);
    });
  }
}

module.exports = { HomePage };
