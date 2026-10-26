// Página do carrinho: quantidades, remoção, totais e botão de finalizar.
document.addEventListener("DOMContentLoaded", () => {
  const corpo = document.getElementById("itens-carrinho");
  const vazio = document.getElementById("carrinho-vazio");
  const conteudo = document.getElementById("conteudo-carrinho");
  const finalizar = document.getElementById("finalizar-compra");

  function renderizar() {
    const itens = Loja.itensDetalhados();
    corpo.innerHTML = "";

    for (const item of itens) {
      const linha = document.createElement("tr");
      linha.dataset.testid = "item-carrinho";
      linha.innerHTML = `
        <td data-testid="nome-item">${item.nome}</td>
        <td>${Loja.moeda(item.preco)}</td>
        <td><input type="number" min="1" max="10" value="${item.qtd}"
             aria-label="Quantidade de ${item.nome}" class="quantidade"></td>
        <td data-testid="total-item">${Loja.moeda(item.totalLinha)}</td>
        <td><button type="button" class="botao-link">Remover</button></td>`;

      linha.querySelector("input").addEventListener("change", (e) => {
        const qtd = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
        Loja.alterarQuantidade(item.id, qtd);
        renderizar();
      });
      linha.querySelector("button").addEventListener("click", () => {
        Loja.remover(item.id);
        renderizar();
      });
      corpo.appendChild(linha);
    }

    const { subtotal, frete, total } = Loja.totais();
    document.querySelector("[data-testid='subtotal']").textContent = Loja.moeda(subtotal);
    document.querySelector("[data-testid='frete']").textContent =
      frete === 0 && subtotal > 0 ? "Grátis" : Loja.moeda(frete);
    document.querySelector("[data-testid='total']").textContent = Loja.moeda(total);

    const estaVazio = itens.length === 0;
    vazio.hidden = !estaVazio;
    conteudo.hidden = estaVazio;
    finalizar.disabled = estaVazio;
  }

  finalizar.addEventListener("click", () => {
    window.location.href = "checkout.html";
  });
  renderizar();
});
