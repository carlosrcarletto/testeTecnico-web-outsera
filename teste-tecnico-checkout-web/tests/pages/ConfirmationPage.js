const { test, expect } = require("@playwright/test");
const { formatarMoeda } = require("../support/moeda");

class ConfirmationPage {
  constructor(page) {
    this.page = page;
    this.titulo = page.getByRole("heading", { level: 1, name: "Pedido confirmado!" });
    this.numeroPedido = page.getByTestId("numero-pedido");
    this.itens = page.getByTestId("item-pedido");
    this.total = page.getByTestId("total-pedido");
    this.pagamento = page.getByTestId("pagamento-pedido");
    this.entregaNome = page.getByTestId("entrega-nome");
    this.entregaEndereco = page.getByTestId("entrega-endereco");
    this.entregaCidade = page.getByTestId("entrega-cidade");
  }

  // O checkout simula ~1s de processamento; a espera pela URL absorve esse tempo
  // sem sleeps fixos.
  async deveExibirPedidoConfirmado({ itens, total, finalCartao, cliente }) {
    await test.step("Verificar página de pedido confirmado", async () => {
      await expect(this.page).toHaveURL(/confirmacao\.html$/, { timeout: 10_000 });
      await expect(this.titulo).toBeVisible();
      await expect(this.numeroPedido, "número do pedido no formato LE-000000").toHaveText(/^LE-\d{6}$/);
    });

    await test.step("Verificar itens, total e pagamento do pedido", async () => {
      await expect(this.itens).toHaveCount(itens.length);
      for (const { nome, quantidade, preco } of itens) {
        await expect(this.itens.filter({ hasText: nome })).toHaveText(
          `${quantidade}x ${nome} — ${formatarMoeda(preco * quantidade)}`,
        );
      }
      await expect(this.total).toHaveText(formatarMoeda(total));
      await expect(this.pagamento).toHaveText(`Cartão de crédito final ${finalCartao}`);
    });

    await test.step("Verificar dados de entrega", async () => {
      const complemento = cliente.complemento ? ` - ${cliente.complemento}` : "";
      await expect(this.entregaNome).toHaveText(cliente.nome);
      await expect(this.entregaEndereco).toHaveText(`${cliente.endereco}, ${cliente.numero}${complemento}`);
      await expect(this.entregaCidade).toHaveText(`${cliente.cidade}/${cliente.estado} — CEP ${cliente.cep}`);
    });
  }
}

module.exports = { ConfirmationPage };
