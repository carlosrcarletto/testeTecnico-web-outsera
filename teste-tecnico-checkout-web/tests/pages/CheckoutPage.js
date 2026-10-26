const { test, expect } = require("@playwright/test");
const { formatarMoeda } = require("../support/moeda");

// Rótulo visível de cada campo do formulário (chave = nome usado nos dados de teste)
const ROTULOS = {
  nome: "Nome completo",
  cep: "CEP",
  endereco: "Endereço",
  numero: "Número",
  complemento: "Complemento (opcional)",
  cidade: "Cidade",
  estado: "Estado",
  nomeCartao: "Nome impresso no cartão",
  numeroCartao: "Número do cartão",
  validade: "Validade (MM/AA)",
  cvv: "CVV",
};

class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.titulo = page.getByRole("heading", { level: 1, name: "Finalizar compra" });
    this.resumoErros = page.getByTestId("resumo-erros");
    this.erroPagamento = page.getByTestId("erro-pagamento");
    this.botaoConfirmar = page.locator("#confirmar-pagamento");
    this.totalResumo = page.getByTestId("resumo-total");
    this.freteResumo = page.getByTestId("resumo-frete");
  }

  campo(chave) {
    return this.page.getByLabel(ROTULOS[chave], { exact: true });
  }

  mensagemErro(chave) {
    return this.page.getByTestId(`erro-${chave}`);
  }

  async visitar() {
    await test.step("Abrir o checkout diretamente pela URL", async () => {
      await this.page.goto("/checkout.html");
    });
  }

  async deveEstarNoCheckout() {
    await expect(this.page, "deveria continuar no checkout").toHaveURL(/checkout\.html$/);
    await expect(this.titulo).toBeVisible();
  }

  async deveExibirTotal(total, frete) {
    await test.step(`Verificar resumo do pedido: total ${formatarMoeda(total)}`, async () => {
      await expect(this.totalResumo).toHaveText(formatarMoeda(total));
      await expect(this.freteResumo).toHaveText(frete === 0 ? "Grátis" : formatarMoeda(frete));
    });
  }

  async preencherEntrega(cliente) {
    await test.step("Preencher endereço de entrega", async () => {
      for (const chave of ["nome", "cep", "endereco", "numero", "complemento", "cidade"]) {
        await this.campo(chave).fill(cliente[chave] ?? "");
      }
      await this.campo("estado").selectOption(cliente.estado ?? "");
    });
  }

  async preencherPagamento(cartao) {
    await test.step(`Preencher cartão (final ${cartao.numero.replace(/\D/g, "").slice(-4) || "vazio"})`, async () => {
      await this.campo("nomeCartao").fill(cartao.nome);
      await this.campo("numeroCartao").fill(cartao.numero);
      await this.campo("validade").fill(cartao.validade);
      await this.campo("cvv").fill(cartao.cvv);
    });
  }

  async confirmarPagamento() {
    await test.step("Clicar em Confirmar pagamento", async () => {
      await this.botaoConfirmar.click();
    });
  }

  async preencherEConfirmar(cliente, cartao) {
    await this.preencherEntrega(cliente);
    await this.preencherPagamento(cartao);
    await this.confirmarPagamento();
  }

  // Falha esperada de validação: mensagem no campo, campo marcado como inválido,
  // resumo de erros no topo e o cliente continua no checkout.
  async deveRecusarCampo(chave, mensagem) {
    await test.step(`Verificar erro em "${ROTULOS[chave]}": ${mensagem}`, async () => {
      await expect(this.mensagemErro(chave)).toHaveText(mensagem);
      await expect(this.campo(chave)).toHaveAttribute("aria-invalid", "true");
      await expect(this.resumoErros).toBeVisible();
      await this.deveEstarNoCheckout();
    });
  }

  async deveExibirErroApenasEm(chaves) {
    await test.step(`Verificar que só há erro em: ${chaves.join(", ")}`, async () => {
      const comErro = this.page.locator("[aria-invalid='true']");
      await expect(comErro).toHaveCount(chaves.length);
      for (const chave of chaves) {
        await expect(this.campo(chave)).toHaveAttribute("aria-invalid", "true");
      }
    });
  }

  async deveExibirPagamentoRecusado(mensagem) {
    await test.step("Verificar recusa da operadora", async () => {
      await expect(this.erroPagamento).toContainText(mensagem);
      await expect(this.resumoErros).toBeHidden();
      await expect(this.botaoConfirmar).toBeEnabled();
      await expect(this.botaoConfirmar).toHaveText("Confirmar pagamento");
      await this.deveEstarNoCheckout();
    });
  }
}

module.exports = { CheckoutPage, ROTULOS };
