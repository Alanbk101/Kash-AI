// Funciones mock — simulan datos reales hasta que conectemos Bitso API (Día 9)

function checkBalance() {
    return {
        mxnb_onchain: 32500.00,
        bitso_mxn: 12730.00,
        total: 45230.00,
        wallet: "0x459c882a051522c9cACAf...92af",
        last_updated: new Date().toLocaleString('es-MX')
    };
}

function sendPayment({ recipient_name, clabe, amount, concept }) {
    const reference = `KSH-${Date.now().toString().slice(-8)}`;
    return {
        success: true,
        reference: reference,
        recipient_name: recipient_name || "Sin nombre",
        clabe: clabe,
        amount: amount,
        concept: concept || "Pago Kash.ai",
        status: "completed",
        timestamp: new Date().toLocaleString('es-MX')
    };
}

function getTransactions({ days = 7 } = {}) {
    return {
        period: `Últimos ${days} días`,
        transactions: [
            { date: "09/05/2026", type: "Pago SPEI", to: "Proveedor Juan", amount: -12000, ref: "KSH-00001" },
            { date: "08/05/2026", type: "Depósito MXNB", from: "Cliente Pedro", amount: 25000, ref: "KSH-00002" },
            { date: "07/05/2026", type: "Pago SPEI", to: "Renta Local", amount: -8000, ref: "KSH-00003" },
            { date: "06/05/2026", type: "Depósito MXNB", from: "Cliente María", amount: 15000, ref: "KSH-00004" },
            { date: "05/05/2026", type: "Pago SPEI", to: "Servicios Luz", amount: -3150, ref: "KSH-00005" }
        ],
        total_ingresos: 40000,
        total_egresos: 23150,
        balance_neto: 16850
    };
}

function generateReport({ period = "week" } = {}) {
    const periods = {
        today: "Hoy",
        week: "Esta semana",
        month: "Este mes"
    };

    return {
        period: periods[period] || "Esta semana",
        ingresos: 45230,
        egresos: 23150,
        balance_neto: 22080,
        saldo_mxnb: 32500,
        saldo_bitso: 12730,
        saldo_total: 45230,
        top_gastos: [
            { nombre: "Proveedor Juan", monto: 12000 },
            { nombre: "Renta Local", monto: 8000 },
            { nombre: "Servicios Luz", monto: 3150 }
        ],
        analisis: "Tus ingresos superan tus egresos por $22,080. Tu principal gasto es el proveedor Juan (52% del total)."
    };
}

function requestPayment({ client_name, amount, concept }) {
    const reference = `COB-${Date.now().toString().slice(-8)}`;
    return {
        reference: reference,
        client_name: client_name || "Cliente",
        amount: amount,
        concept: concept || "Cobro Kash.ai",
        clabe_deposit: "012180001234567890",
        bank: "Bitso",
        timestamp: new Date().toLocaleString('es-MX')
    };
}

module.exports = { checkBalance, sendPayment, getTransactions, generateReport, requestPayment };
