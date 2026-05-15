const { getBalance, getLedger } = require('./bitsoClient');

// Obtener balance real de Bitso + datos mock de MXNB onchain
async function checkRealBalance() {
    const bitsoBalance = await getBalance();

    let bitsoMXN = 0;
    let bitsoMXNB = 0;

    if (bitsoBalance) {
        bitsoMXN = bitsoBalance.mxn ? bitsoBalance.mxn.available : 0;
        bitsoMXNB = bitsoBalance.mxnb ? bitsoBalance.mxnb.available : 0;
    }

    // MXNB onchain se conectará en Día 14 (Arbitrum)
    const mxnbOnchain = 0;

    const total = bitsoMXN + bitsoMXNB + mxnbOnchain;

    return {
        mxnb_onchain: mxnbOnchain,
        bitso_mxn: bitsoMXN,
        bitso_mxnb: bitsoMXNB,
        total: total,
        wallet: "Pendiente de conectar",
        last_updated: new Date().toLocaleString('es-MX'),
        source: 'real'
    };
}

// Formatear balance para WhatsApp
function formatBalance(balance) {
    let msg = `💰 *Tu balance actual:*\n\n`;
    msg += `🏦 Bitso MXN: $${balance.bitso_mxn.toLocaleString('es-MX')} MXN\n`;

    if (balance.bitso_mxnb > 0) {
        msg += `🪙 Bitso MXNB: $${balance.bitso_mxnb.toLocaleString('es-MX')} MXN\n`;
    }

    if (balance.mxnb_onchain > 0) {
        msg += `🔗 MXNB (Arbitrum): $${balance.mxnb_onchain.toLocaleString('es-MX')} MXN\n`;
    }

    msg += `─────────────\n`;
    msg += `📊 *Total: $${balance.total.toLocaleString('es-MX')} MXN*\n\n`;
    msg += `🕐 ${balance.last_updated}`;

    if (balance.total === 0) {
        msg += `\n\n💡 _Tu cuenta sandbox está vacía. Los fondos de prueba se solicitan al soporte de Bitso._`;
    }

    return msg;
}

module.exports = { checkRealBalance, formatBalance };
