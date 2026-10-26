// Catálogo, carrinho e utilitários compartilhados por todas as páginas da loja.
const PRODUTOS = [
  { id: "fone", nome: "Fone de Ouvido Bluetooth", preco: 199.9, emoji: "🎧" },
  { id: "mouse", nome: "Mouse sem Fio", preco: 89.9, emoji: "🖱️" },
  { id: "teclado", nome: "Teclado Mecânico", preco: 349.9, emoji: "⌨️" },
  { id: "monitor", nome: "Monitor 24 polegadas", preco: 899.0, emoji: "🖥️" },
  { id: "webcam", nome: "Webcam Full HD", preco: 249.9, emoji: "📷" },
  { id: "suporte", nome: "Suporte para Notebook", preco: 129.9, emoji: "💻" },
];
const FRETE = 19.9;
const FRETE_GRATIS_A_PARTIR = 300;
const CHAVE_CARRINHO = "loja:carrinho";
const CHAVE_PEDIDO = "loja:ultimoPedido";

const centavos = (v) => Math.round(v * 100) / 100;

const Loja = {
  produtos: PRODUTOS,

  moeda(valor) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  },

  produto(id) {
    return PRODUTOS.find((p) => p.id === id);
  },

  lerCarrinho() {
    try {
      return JSON.parse(sessionStorage.getItem(CHAVE_CARRINHO)) || [];
    } catch {
      return [];
    }
  },

  salvarCarrinho(itens) {
    sessionStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    Loja.atualizarContador();
  },

  adicionar(id) {
    const itens = Loja.lerCarrinho();
    const item = itens.find((i) => i.id === id);
    if (item) item.qtd += 1;
    else itens.push({ id, qtd: 1 });
    Loja.salvarCarrinho(itens);
  },

  alterarQuantidade(id, qtd) {
    Loja.salvarCarrinho(Loja.lerCarrinho().map((i) => (i.id === id ? { ...i, qtd } : i)));
  },

  remover(id) {
    Loja.salvarCarrinho(Loja.lerCarrinho().filter((i) => i.id !== id));
  },

  esvaziar() {
    sessionStorage.removeItem(CHAVE_CARRINHO);
    Loja.atualizarContador();
  },

  itensDetalhados() {
    return Loja.lerCarrinho().map((i) => {
      const p = Loja.produto(i.id);
      return { ...p, qtd: i.qtd, totalLinha: centavos(p.preco * i.qtd) };
    });
  },

  totais() {
    const subtotal = centavos(Loja.itensDetalhados().reduce((s, i) => s + i.totalLinha, 0));
    const frete = subtotal === 0 || subtotal >= FRETE_GRATIS_A_PARTIR ? 0 : FRETE;
    return { subtotal, frete, total: centavos(subtotal + frete) };
  },

  quantidadeTotal() {
    return Loja.lerCarrinho().reduce((s, i) => s + i.qtd, 0);
  },

  atualizarContador() {
    const contador = document.querySelector("[data-testid='contador-carrinho']");
    if (contador) contador.textContent = String(Loja.quantidadeTotal());
  },

  salvarPedido(pedido) {
    sessionStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido));
  },

  lerPedido() {
    try {
      return JSON.parse(sessionStorage.getItem(CHAVE_PEDIDO));
    } catch {
      return null;
    }
  },
};

document.addEventListener("DOMContentLoaded", Loja.atualizarContador);
