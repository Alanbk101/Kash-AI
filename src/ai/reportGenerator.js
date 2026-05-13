const { supabase } = require('../database/supabaseClient');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Obtener transacciones reales de Supabase para un usuario
async function getUserTransactions(userId, days = 7) {
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
        return [];
    }
    return data || [];
}

// Generar análisis inteligente con Claude
async function generateAIAnalysis(transactions, period) {
    if (transactions.length === 0) {
        return "No tienes transacciones en este período. ¡Empieza a usar Kash.ai para llevar el control de tu negocio!";
    }

    const totalEgresos = transactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIngresos = transactions
        .filter(t => t.type === 'deposit' || t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const txSummary = transactions.map(t => 
        `${t.type}: $${t.amount} MXN a ${t.recipient_name || 'N/A'} - ${t.ai_summary || ''}`
    ).join('\n');

    try {
        const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 300,
            system: "Eres un analista financiero para PyMEs mexicanas. Da análisis CORTOS (máx 2 oraciones) en español mexicano. Sé directo y útil. No uses tecnicismos.",
            messages: [{
                role: "user",
                content: `Analiza estas transacciones de una PyME mexicana (${period}):\n\nIngresos: $${totalIngresos.toLocaleString('es-MX')} MXN\nEgresos: $${totalEgresos.toLocaleString('es-MX')} MXN\nNeto: $${(totalIngresos - totalEgresos).toLocaleString('es-MX')} MXN\n\nDetalle:\n${txSummary}\n\nDa un análisis breve y un consejo práctico.`
            }]
        });

        const textBlock = response.content.find(b => b.type === 'text');
        return textBlock ? textBlock.text : 'Análisis no disponible.';
    } catch (error) {
        console.error('Error generando análisis IA:', error.message);
        return `Egresos totales: $${totalEgresos.toLocaleString('es-MX')} MXN en ${transactions.length} transacciones.`;
    }
}

// Generar reporte completo formateado para WhatsApp
async function generateSmartReport(userId, period = 'week') {
    const daysMap = { today: 1, week: 7, month: 30 };
    const periodNames = { today: 'Hoy', week: 'Esta semana', month: 'Este mes' };
    const days = daysMap[period] || 7;

    const transactions = await getUserTransactions(userId, days);

    const totalEgresos = transactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalIngresos = transactions
        .filter(t => t.type === 'deposit' || t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balanceNeto = totalIngresos - totalEgresos;

    // Agrupar gastos por destinatario
    const gastosPorDestinatario = {};
    transactions
        .filter(t => t.type === 'payment')
        .forEach(t => {
            const nombre = t.recipient_name || 'Sin nombre';
            gastosPorDestinatario[nombre] = (gastosPorDestinatario[nombre] || 0) + parseFloat(t.amount);
        });

    // Ordenar top gastos
    const topGastos = Object.entries(gastosPorDestinatario)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Generar análisis con IA
    const analisisIA = await generateAIAnalysis(transactions, periodNames[period]);

    // Formatear reporte para WhatsApp
    let report = `📊 *Reporte financiero — ${periodNames[period]}*\n`;
    report += `📅 ${new Date().toLocaleDateString('es-MX')}\n\n`;
    report += `💚 Ingresos: $${totalIngresos.toLocaleString('es-MX')} MXN\n`;
    report += `❤️ Egresos: $${totalEgresos.toLocaleString('es-MX')} MXN\n`;
    report += `📈 Balance neto: ${balanceNeto >= 0 ? '+' : ''}$${balanceNeto.toLocaleString('es-MX')} MXN\n`;
    report += `📋 Transacciones: ${transactions.length}\n\n`;

    if (topGastos.length > 0) {
        report += `📝 *Top gastos:*\n`;
        topGastos.forEach(([nombre, monto], i) => {
            report += `${i + 1}. ${nombre} — $${monto.toLocaleString('es-MX')}\n`;
        });
        report += `\n`;
    }

    report += `🤖 *Análisis IA:* ${analisisIA}`;
    report += `\n\n_Generado por Kash.ai_`;

    return report;
}

module.exports = { generateSmartReport, getUserTransactions };
