const { test, expect } = require("@playwright/test");
const { formatarMoeda } = require("../support/moeda");

class CartPage {
  constructor(page) {
    this.page = page;
    this.titulo = page.getByRole("heading", { level: 1, name: "Carrinho" });
    this.itens = page.getByTestId("item-carrinho");
    this.mensagemVazio = page.getByTestId("carrinho-vazio");
    this.subtotal = page.getByTestId("subtotal");
    this.frete = page.getByTestId("frete");
    this.total = page.getByTestId("total");
    this.botaoFinalizar = page.getByRole("button", { name: "Finalizar compra" });
  }

  async visitar() {
    await test.step("Abrir o carrinho", async () => {
      await this.page.goto("/carrinho.html");
      await expect(this.titulo).toBeVisible();
    });
  }

  item(nome) {
    return this.itens.filter({ has: this.page.getByTestId("nome-item").getByText(nome, { exact: true }) });
  }

  async deveConterItem(nome, quantidade, preco) {
    await test.step(`Verificar item "${nome}": ${quantidade}x ${formatarMoeda(preco)}`, async () => {
      const linha = this.item(nome);
      await expect(linha).toHaveCount(1);
      await expect(linha.getByRole("spinbutton", { name: `Quantidade de ${nome}` })).toHaveValue(String(quantidade));
      await expect(linha.getByTestId("total-item")).toHaveText(formatarMoeda(preco * quantidade));
    });
  }

  async deveTerQuantidadeDeItens(quantidade) {
    await expect(this.itens, "linhas no carrinho").toHaveCount(quantidade);
  }

  async alterarQuantidade(nome, quantidade) {
    await test.step(`Alterar quantidade de "${nome}" para ${quantidade}`, async () => {
      const campo = this.item(nome).getByRole("spinbutton", { name: `Quantidade de ${nome}` });
      await campo.fill(String(quantidade));
      await campo.press("Tab"); // dispara o "change" que recalcula os totais
    });
  }

  async remover(nome) {
    await test.step(`Remover "${nome}" do carrinho`, async () => {
      await this.item(nome).getByRole("button", { name: "Remover" }).click();
      await expect(this.item(nome)).toHaveCount(0);
    });
  }

  // frete = 0 significa frete grátis
  async deveExibirTotais({ subtotal, frete, total }) {
    await test.step("Verificar subtotal, frete e total", async () => {
      await expect(this.subtotal, "subtotal").toHaveText(formatarMoeda(subtotal));
      await expect(this.frete, "frete").toHaveText(frete === 0 ? "Grátis" : formatarMoeda(frete));
      await expect(this.total, "total").toHaveText(formatarMoeda(total));
    });
  }

  async deveEstarVazio() {
    await test.step("Verificar carrinho vazio e compra bloqueada", async () => {
      await expect(this.mensagemVazio).toHaveText("Seu carrinho está vazio.");
      await expect(this.itens).toHaveCount(0);
      await expect(this.botaoFinalizar).toBeDisabled();
    });
  }

  async finalizarCompra() {
    await test.step("Clicar em Finalizar compra", async () => {
      await this.botaoFinalizar.click();
      await expect(this.page).toHaveURL(/checkout\.html$/);
    });
  }
}

module.exports = { CartPage };
