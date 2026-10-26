// Página inicial: lista os produtos e adiciona ao carrinho.
document.addEventListener("DOMContentLoaded", () => {
  const lista = document.getElementById("lista-produtos");
  const aviso = document.getElementById("aviso");
  let temporizador;

  for (const p of Loja.produtos) {
    const card = document.createElement("article");
    card.className = "produto";
    card.dataset.testid = "produto";
    card.innerHTML = `
      <div class="produto-imagem" aria-hidden="true">${p.emoji}</div>
      <h2>${p.nome}</h2>
      <p class="preco" data-testid="preco-produto">${Loja.moeda(p.preco)}</p>
      <button type="button" class="botao">Adicionar ao carrinho</button>`;

    card.querySelector("button").addEventListener("click", () => {
      Loja.adicionar(p.id);
      aviso.textContent = `${p.nome} adicionado ao carrinho`;
      aviso.hidden = false;
      clearTimeout(temporizador);
      temporizador = setTimeout(() => (aviso.hidden = true), 2500);
    });
    lista.appendChild(card);
  }
});
