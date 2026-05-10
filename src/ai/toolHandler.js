const { chat } = require('./claudeClient');
const { checkBalance, sendPayment, getTransactions, generateReport, requestPayment } = require('../payments/mockPayments');

// Historial de conversación por usuario (en memoria)
const conversations = {};

// Ejecutar la tool que Claude pidió
function executeTool(toolName, toolInput) {
    switch (toolName) {
        case 'check_balance':
            return checkBalance();
        case 'send_payment':
            return sendPayment(toolInput);
        case 'get_transactions':
            return getTransactions(toolInput);
        case 'generate_report':
            return generateReport(toolInput);
        case 'request_payment':
            return requestPayment(toolInput);
        default:
            return { error: `Tool ${toolName} no encontrada` };
    }
}

// Formatear resultado de tool para WhatsApp
function formatToolResult(toolName, result) {
    switch (toolName) {
        case 'check_balance':
            return `💰 *Tu balance actual:*\n\n🔗 MXNB (Arbitrum): $${result.mxnb_onchain.toLocaleString('es-MX')} MXN\n🏦 Bitso: $${result.bitso_mxn.toLocaleString('es-MX')} MXN\n─────────────\n📊 *Total: $${result.total.toLocaleString('es-MX')} MXN*\n\n🕐 ${result.last_updated}`;

        case 'send_payment':
            if (result.success) {
                return `✅ *Pago enviado exitosamente*\n\n👤 Para: ${result.recipient_name}\n🏦 CLABE: ${result.clabe}\n💰 Monto: $${result.amount.toLocaleString('es-MX')} MXN\n📝 Concepto: ${result.concept}\n📋 Referencia: ${result.reference}\n🕐 ${result.timestamp}`;
            }
            return `❌ Error al enviar el pago. Intenta de nuevo.`;

        case 'get_transactions':
            let txMsg = `📋 *Transacciones — ${result.period}*\n\n`;
            result.transactions.forEach(tx => {
                const icon = tx.amount > 0 ? '📥' : '📤';
                const sign = tx.amount > 0 ? '+' : '';
                txMsg += `${icon} ${tx.date} | ${sign}$${Math.abs(tx.amount).toLocaleString('es-MX')} | ${tx.to || tx.from}\n`;
            });
            txMsg += `\n💚 Ingresos: +$${result.total_ingresos.toLocaleString('es-MX')}\n❤️ Egresos: -$${result.total_egresos.toLocaleString('es-MX')}\n📊 Neto: $${result.balance_neto.toLocaleString('es-MX')}`;
            return txMsg;

        case 'generate_report':
            return `📊 *Reporte financiero — ${result.period}*\n\n💚 Ingresos: $${result.ingresos.toLocaleString('es-MX')}\n❤️ Egresos: $${result.egresos.toLocaleString('es-MX')}\n📈 Balance neto: +$${result.balance_neto.toLocaleString('es-MX')}\n\n🏦 *Saldos:*\n🔗 MXNB: $${result.saldo_mxnb.toLocaleString('es-MX')}\n🏦 Bitso: $${result.saldo_bitso.toLocaleString('es-MX')}\n📊 Total: $${result.saldo_total.toLocaleString('es-MX')}\n\n📝 *Top gastos:*\n${result.top_gastos.map((g, i) => `${i + 1}. ${g.nombre} — $${g.monto.toLocaleString('es-MX')}`).join('\n')}\n\n🤖 *Análisis IA:* ${result.analisis}`;

        case 'request_payment':
            return `🧾 *Instrucciones de cobro*\n\nEnvía esto a *${result.client_name}*:\n\n─────────────\n🏦 Banco: ${result.bank}\n📋 CLABE: ${result.clabe_deposit}\n💰 Monto: $${result.amount.toLocaleString('es-MX')} MXN\n📝 Referencia: ${result.reference}\n📝 Concepto: ${result.concept}\n─────────────\n\n🔔 Te avisaré cuando llegue el depósito.`;

        default:
            return JSON.stringify(result);
    }
}

// Procesar mensaje del usuario con Claude AI
async function processMessage(userId, userMessage) {
    // Obtener o crear historial de conversación
    if (!conversations[userId]) {
        conversations[userId] = [];
    }

    // Limitar historial a últimos 10 mensajes
    if (conversations[userId].length > 20) {
        conversations[userId] = conversations[userId].slice(-10);
    }

    try {
        // Enviar a Claude
        const response = await chat(userMessage, conversations[userId]);

        // Guardar mensaje del usuario en historial
        conversations[userId].push({ role: "user", content: userMessage });

        // Procesar la respuesta de Claude
        let finalResponse = '';

        if (response.stop_reason === 'tool_use') {
            // Claude quiere usar una herramienta
            const toolUseBlock = response.content.find(block => block.type === 'tool_use');
            const textBlock = response.content.find(block => block.type === 'text');

            if (toolUseBlock) {
                console.log(`🔧 Tool call: ${toolUseBlock.name}`, toolUseBlock.input);

                // Ejecutar la tool
                const toolResult = executeTool(toolUseBlock.name, toolUseBlock.input);

                // Formatear resultado bonito para WhatsApp
                finalResponse = formatToolResult(toolUseBlock.name, toolResult);

                // Si Claude también mandó texto antes del tool call, agregarlo
                if (textBlock && textBlock.text) {
                    finalResponse = textBlock.text + '\n\n' + finalResponse;
                }

                // Guardar en historial
                conversations[userId].push({ role: "assistant", content: response.content });
                conversations[userId].push({ 
                    role: "user", 
                    content: [{
                        type: "tool_result",
                        tool_use_id: toolUseBlock.id,
                        content: JSON.stringify(toolResult)
                    }]
                });
            }
        } else {
            // Claude respondió solo con texto (sin tool)
            const textBlock = response.content.find(block => block.type === 'text');
            finalResponse = textBlock ? textBlock.text : 'No pude procesar tu mensaje.';

            // Guardar en historial
            conversations[userId].push({ role: "assistant", content: response.content });
        }

        return finalResponse;

    } catch (error) {
console.error('Error con Claude AI:', error);
        return '⚠️ Hubo un error con el asistente. Intenta de nuevo en unos segundos.';
    }
}

module.exports = { processMessage };
