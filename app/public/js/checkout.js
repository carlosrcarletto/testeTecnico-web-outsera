// Página de checkout: valida entrega e pagamento e simula a operadora do cartão.

// Cartão que a "operadora" sempre recusa (passa no Luhn, mas é negado no pagamento).
const CARTAO_RECUSADO = "4000000000000002";
const TEMPO_PROCESSAMENTO_MS = 800;

const somenteDigitos = (v) => v.replace(/\D/g, "");

// Algoritmo de Luhn: dígito verificador usado por todas as bandeiras.
function luhnValido(numero) {
  let soma = 0;
  let dobrar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = Number(numero[i]);
    if (dobrar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
    dobrar = !dobrar;
  }
  return soma % 10 === 0;
}

const regras = {
  nome: (v) => (v.trim() ? "" : "Informe o nome completo."),
  cep: (v) => {
    if (!v.trim()) return "Informe o CEP.";
    return /^\d{5}-?\d{3}$/.test(v.trim()) ? "" : "CEP inválido. Use 8 dígitos.";
  },
  endereco: (v) => (v.trim() ? "" : "Informe o endereço."),
  numero: (v) => (v.trim() ? "" : "Informe o número."),
  cidade: (v) => (v.trim() ? "" : "Informe a cidade."),
  estado: (v) => (v ? "" : "Selecione o estado."),

  // BUG PROPOSITAL (documentado no README e em tests/e2e/bug-nome-cartao.spec.js):
  // a regra deveria recusar nomes com números, mas só verifica se está preenchido.
  nomeCartao: (v) => (v.trim() ? "" : "Informe o nome impresso no cartão."),

  numeroCartao: (v) => {
    if (!v.trim()) return "Informe o número do cartão.";
    if (/[^\d\s]/.test(v)) return "Número do cartão inválido.";
    const digitos = somenteDigitos(v);
    if (digitos.length < 13 || digitos.length > 19 || !luhnValido(digitos)) {
      return "Número do cartão inválido.";
    }
    return "";
  },
  validade: (v) => {
    if (!v.trim()) return "Informe a validade.";
    const m = /^(\d{2})\/(\d{2})$/.exec(v.trim());
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) return "Validade inválida. Use MM/AA.";
    const agora = new Date();
    const anoAtual = agora.getFullYear() % 100;
    const mes = Number(m[1]);
    const ano = Number(m[2]);
    if (ano < anoAtual || (ano === anoAtual && mes < agora.getMonth() + 1)) return "Cartão vencido.";
    return "";
  },
  cvv: (v) => {
    if (!v.trim()) return "Informe o CVV.";
    return /^\d{3,4}$/.test(v.trim()) ? "" : "CVV inválido.";
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // Sem itens não há o que pagar: volta para o carrinho.
  if (Loja.lerCarrinho().length === 0) {
    window.location.replace("carrinho.html");
    return;
  }

  const form = document.getElementById("form-checkout");
  const resumoErros = document.getElementById("resumo-erros");
  const erroPagamento = document.getElementById("erro-pagamento");
  const botao = document.getElementById("confirmar-pagamento");

  // Resumo do pedido
  const lista = document.getElementById("resumo-itens");
  for (const item of Loja.itensDetalhados()) {
    const li = document.createElement("li");
    li.textContent = `${item.qtd}x ${item.nome} — ${Loja.moeda(item.totalLinha)}`;
    lista.appendChild(li);
  }
  const { subtotal, frete, total } = Loja.totais();
  document.querySelector("[data-testid='resumo-subtotal']").textContent = Loja.moeda(subtotal);
  document.querySelector("[data-testid='resumo-frete']").textContent = frete === 0 ? "Grátis" : Loja.moeda(frete);
  document.querySelector("[data-testid='resumo-total']").textContent = Loja.moeda(total);

  function mostrarErro(campo, mensagem) {
    const input = form.elements[campo];
    const erro = document.getElementById(`erro-${campo}`);
    erro.textContent = mensagem;
    erro.hidden = !mensagem;
    input.setAttribute("aria-invalid", mensagem ? "true" : "false");
  }

  function validar() {
    let primeiroInvalido = null;
    for (const [campo, regra] of Object.entries(regras)) {
      const mensagem = regra(form.elements[campo].value);
      mostrarErro(campo, mensagem);
      if (mensagem && !primeiroInvalido) primeiroInvalido = form.elements[campo];
    }
    resumoErros.hidden = !primeiroInvalido;
    if (primeiroInvalido) primeiroInvalido.focus();
    return !primeiroInvalido;
  }

  // Revalida o campo ao sair dele, para o erro sumir assim que for corrigido.
  for (const campo of Object.keys(regras)) {
    form.elements[campo].addEventListener("blur", () => {
      if (form.elements[campo].getAttribute("aria-invalid") === "true") {
        mostrarErro(campo, regras[campo](form.elements[campo].value));
      }
    });
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    erroPagamento.hidden = true;
    if (!validar()) return;

    botao.disabled = true;
    botao.textContent = "Processando pagamento…";

    setTimeout(() => {
      const numeroCartao = somenteDigitos(form.elements.numeroCartao.value);

      if (numeroCartao === CARTAO_RECUSADO) {
        erroPagamento.textContent = "Pagamento recusado pela operadora. Verifique os dados ou use outro cartão.";
        erroPagamento.hidden = false;
        botao.disabled = false;
        botao.textContent = "Confirmar pagamento";
        return;
      }

      const v = (c) => form.elements[c].value.trim();
      Loja.salvarPedido({
        numero: `LE-${String(Math.floor(100000 + Math.random() * 900000))}`,
        itens: Loja.itensDetalhados(),
        ...Loja.totais(),
        finalCartao: numeroCartao.slice(-4),
        entrega: {
          nome: v("nome"),
          endereco: `${v("endereco")}, ${v("numero")}${v("complemento") ? ` - ${v("complemento")}` : ""}`,
          cidade: `${v("cidade")}/${v("estado")}`,
          cep: v("cep"),
        },
      });
      Loja.esvaziar();
      window.location.href = "confirmacao.html";
    }, TEMPO_PROCESSAMENTO_MS);
  });
});
