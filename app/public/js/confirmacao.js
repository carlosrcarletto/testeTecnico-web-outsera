// Página de confirmação: mostra o último pedido finalizado.
document.addEventListener("DOMContentLoaded", () => {
  const pedido = Loja.lerPedido();
  if (!pedido) {
    window.location.replace("index.html");
    return;
  }

  const texto = (testid, valor) => {
    document.querySelector(`[data-testid='${testid}']`).textContent = valor;
  };

  texto("numero-pedido", pedido.numero);
  texto("total-pedido", Loja.moeda(pedido.total));
  texto("pagamento-pedido", `Cartão de crédito final ${pedido.finalCartao}`);
  texto("entrega-nome", pedido.entrega.nome);
  texto("entrega-endereco", pedido.entrega.endereco);
  texto("entrega-cidade", `${pedido.entrega.cidade} — CEP ${pedido.entrega.cep}`);

  const lista = document.getElementById("itens-pedido");
  for (const item of pedido.itens) {
    const li = document.createElement("li");
    li.dataset.testid = "item-pedido";
    li.textContent = `${item.qtd}x ${item.nome} — ${Loja.moeda(item.totalLinha)}`;
    lista.appendChild(li);
  }
});
