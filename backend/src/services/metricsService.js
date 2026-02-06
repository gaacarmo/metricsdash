function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : NaN;
  }
  
  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }
  
  function round(n, decimals = 2) {
    const p = 10 ** decimals;
    return Math.round((n + Number.EPSILON) * p) / p;
  }
  
  /**
   * Input esperado:
   * {
   *   cash: number,
   *   monthlyRevenue: number,
   *   monthlyCosts: number,
   *   customers: number,
   *   churn: number // pode vir como 0.05 (5%) ou 5 (5%)
   * }
   */
  function calculateMetrics(input) {
    const cash = toNumber(input.cash);
    const monthlyRevenue = toNumber(input.monthlyRevenue);
    const monthlyCosts = toNumber(input.monthlyCosts);
    const customers = toNumber(input.customers);
    let churn = toNumber(input.churn);
  
    // validações básicas
    const errors = {};
    if (!(cash >= 0)) errors.cash = "cash deve ser >= 0";
    if (!(monthlyRevenue >= 0)) errors.monthlyRevenue = "monthlyRevenue deve ser >= 0";
    if (!(monthlyCosts >= 0)) errors.monthlyCosts = "monthlyCosts deve ser >= 0";
    if (!(customers > 0)) errors.customers = "customers deve ser > 0";
    if (!(churn > 0)) errors.churn = "churn deve ser > 0";
  
    if (Object.keys(errors).length) {
      const err = new Error("Dados inválidos");
      err.statusCode = 400;
      err.details = errors;
      throw err;
    }
  
    // normaliza churn: se vier 5 (5%), vira 0.05
    if (churn > 1) churn = churn / 100;
    churn = clamp(churn, 0.000001, 0.999999); // evita divisão por 0
  
    // métricas
    const burnRate = monthlyCosts - monthlyRevenue; // >0 queima caixa, <0 gera caixa
    const ticketMedioMensal = monthlyRevenue / customers;
  
    // runway: só faz sentido se burnRate > 0
    const runwayMonths =
      burnRate > 0 ? cash / burnRate : Infinity;
  
    // LTV didático: ticket / churn
    const ltv = ticketMedioMensal / churn;
  
    // status simples pelo runway
    let status;
    if (burnRate <= 0) status = "healthy"; // gerando caixa
    else if (runwayMonths >= 12) status = "healthy";
    else if (runwayMonths >= 6) status = "attention";
    else status = "risk";
  
    // mensagens curtas (opcional, mas ajuda no frontend)
    const messages = {
      burnRate:
        burnRate <= 0
          ? "Você está gerando caixa (burn rate negativo)."
          : "Você está queimando caixa mensalmente.",
      runway:
        burnRate <= 0
          ? "Runway infinito (receita cobre custos)."
          : `Com o caixa atual, você tem cerca de ${round(runwayMonths, 1)} meses de runway.`,
      ltv:
        "LTV estimado com modelo simplificado (ticket médio / churn).",
    };
  
    return {
      inputs: {
        cash,
        monthlyRevenue,
        monthlyCosts,
        customers,
        churn, // já normalizado (0-1)
      },
      metrics: {
        burnRate: round(burnRate, 2),
        runwayMonths: runwayMonths === Infinity ? null : round(runwayMonths, 2),
        runwayIsInfinite: runwayMonths === Infinity,
        ticketMedioMensal: round(ticketMedioMensal, 2),
        ltv: round(ltv, 2),
        status, // healthy | attention | risk
      },
      messages,
    };
  }
  
  module.exports = {
    calculateMetrics,
  };