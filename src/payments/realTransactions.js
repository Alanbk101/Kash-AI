const { supabase } = require('../database/supabaseClient');

// Obtener transacciones reales de Supabase
async function getRealTransactions(userId, days = 7) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    const { data, error } = await supabase
        .from('kash_transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', dateFrom.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error obteniendo transacciones:', error);
        return null;
    }

    return data || [];
}

// Formatear transacciones reales para WhatsApp
function formatRealTransactions(transactions, days) {
    if (!transactions || transactions.length === 0) {
        return `📋 *Transacciones — Últimos ${days} días*\n\nNo tienes transacciones en este período.\n\n💡 _Empieza enviando un pago o solicitando un cobro._`;
    }

    let totalIngresos = 0;
    let totalEgresos = 0;

    let msg = `📋 *Transacciones — Últimos ${days} días*\n\n`;

    transactions.forEach(tx => {
        const date = new Date(tx.created_at).toLocaleDateString('es-MX');
        const amount = parseFloat(tx.amount);

        if (tx.type === 'payment') {
            totalEgresos += amount;
            msg += `📤 ${date} | -$${amount.toLocaleString('es-MX')} | ${tx.recipient_name || 'Sin nombre'}`;
        } else {
            totalIngresos += amount;
            msg += `📥 ${date} | +$${amount.toLocaleString('es-MX')} | ${tx.recipient_name || 'Depósito'}`;
        }

        if (tx.status === 'completed') {
            msg += ` ✅`;
        } else if (tx.status === 'failed') {
            msg += ` ❌`;
        } else {
            msg += ` ⏳`;
        }

        msg += `\n`;
    });

    const neto = totalIngresos - totalEgresos;

    msg += `\n💚 Ingresos: +$${totalIngresos.toLocaleString('es-MX')}`;
    msg += `\n❤️ Egresos: -$${totalEgresos.toLocaleString('es-MX')}`;
    msg += `\n📊 Neto: ${neto >= 0 ? '+' : ''}$${neto.toLocaleString('es-MX')}`;
    msg += `\n\n📋 Total: ${transactions.length} transacciones`;

    return msg;
}

module.exports = { getRealTransactions, formatRealTransactions };
