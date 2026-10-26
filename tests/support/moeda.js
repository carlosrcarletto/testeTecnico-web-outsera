// Formata valores como a loja exibe (ex.: 199.9 → "R$ 199,90")
const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

// Soma em centavos para evitar erros de ponto flutuante (0.1 + 0.2)
const somar = (...valores) => Math.round(valores.reduce((s, v) => s + v * 100, 0)) / 100;

module.exports = { formatarMoeda, somar };
