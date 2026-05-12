const { chat } = require('./claudeClient');
const { checkBalance, sendPayment, getTransactions, generateReport, requestPayment } = require('../payments/mockPayments');
const { findUser, saveTransaction } = require('../database/supabaseClient');

// Historial de conversación por usuario (en memoria)
const conversations = {};

// Pagos pendientes de confirmación por usuario
const pendingPayments = {};

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

// Guardar transacción en Supabase
async function savePaymentToDb(userId, paymentData, result) {
    try {
        await saveTransaction(userId, {
            type: 'payment',
            amount: paymentData.amount,
            currency: 'MXN',
            recipient_name: paymentData.recipient_name || 'Sin nombre',
            recipient_clabe: paymentData.clabe,
            status: result.success ? 'completed' : 'failed',
            bitso_reference: result.reference,
            ai_summary: `Pago de $${paymentData.amount} a ${paymentData.recipient_name || 'Sin nombre'} — ${paymentData.concept || 'Sin concepto'}`
        });
        console.log('💾 Transacción guardada en Supabase');
    } catch (error) {
        console.error('Error guardando transacción:', error);
    }
}

// Procesar mensaje del usuario con Claude AI
async function processMessage(userId, userMessage, dbUser) {
    const cleanText = userMessage.trim().toLowerCase();

    // Verificar si hay un pago pendiente de confirmación
    if (pendingPayments[userId]) {
        const payment = pendingPayments[userId];

        if (cleanText === 'sí' || cleanText === 'si' || cleanText === 'yes' || cleanText === 'confirmar' || cleanText === 'confirmo') {
            delete pendingPayments[userId];
            const result = executeTool('send_payment', payment);

            // Guardar en Supabase si tenemos el usuario de DB
            if (dbUser && dbUser.id) {
                await savePaymentToDb(dbUser.id, payment, result);
            }

            return formatToolResult('send_payment', result);
        } else if (cleanText === 'no' || cleanText === 'cancelar' || cleanText === 'cancel') {
            delete pendingPayments[userId];
            return '❌ Pago cancelado. ¿En qué más te puedo ayudar?';
        } else {
            return '⚠️ Tienes un pago pendiente de confirmar.\n\nResponde *sí* para confirmar o *no* para cancelar.';
        }
    }

    // Obtener o crear historial de conversación
    if (!conversations[userId]) {
        conversations[userId] = [];
    }

    if (conversations[userId].length > 20) {
        conversations[userId] = conversations[userId].slice(-10);
    }

    try {
        const response = await chat(userMessage, conversations[userId]);
        conversations[userId].push({ role: "user", content: userMessage });

        let finalResponse = '';

        if (response.stop_reason === 'tool_use') {
            const toolUseBlock = response.content.find(block => block.type === 'tool_use');
            const textBlock = response.content.find(block => block.type === 'text');

            if (toolUseBlock) {
                console.log(`🔧 Tool call: ${toolUseBlock.name}`, toolUseBlock.input);

                if (toolUseBlock.name === 'send_payment') {
                    const p = toolUseBlock.input;
                    pendingPayments[userId] = p;

                    finalResponse = `⚠️ *Confirma tu pago:*\n\n👤 Para: ${p.recipient_name || 'Sin nombre'}\n🏦 CLABE: ${p.clabe}\n💰 Monto: $${p.amount?.toLocaleString('es-MX')} MXN\n📝 Concepto: ${p.concept || 'Pago Kash.ai'}\n\n¿Confirmas? Responde *sí* o *no*`;

                    conversations[userId].push({ role: "assistant", content: response.content });

                } else {
                    const toolResult = executeTool(toolUseBlock.name, toolUseBlock.input);
                    finalResponse = formatToolResult(toolUseBlock.name, toolResult);

                    if (textBlock && textBlock.text) {
                        finalResponse = textBlock.text + '\n\n' + finalResponse;
                    }

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
            }
        } else {
            const textBlock = response.content.find(block => block.type === 'text');
            finalResponse = textBlock ? textBlock.text : 'No pude procesar tu mensaje.';
            conversations[userId].push({ role: "assistant", content: response.content });
        }

        return finalResponse;

    } catch (error) {
        console.error('Error con Claude AI:', error);
        return '⚠️ Hubo un error con el asistente. Intenta de nuevo en unos segundos.';
    }
}

module.exports = { processMessage };
