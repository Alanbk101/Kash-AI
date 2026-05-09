// Mensajes de bienvenida para usuarios nuevos
const WELCOME_MESSAGE = `¡Hola! 👋 Soy *Kash.ai* 🏦

Tu asistente financiero inteligente por WhatsApp.

Puedo ayudarte con:

💰 *"¿Cuánto tengo?"* — Consultar tu balance
💸 *"Paga $5,000 a CLABE 012..."* — Enviar pagos SPEI
📊 *"Dame mi reporte semanal"* — Reportes financieros
📋 *"Mis transacciones"* — Ver historial

O simplemente cuéntame qué necesitas y te ayudo.

_Powered by MXNB en Arbitrum + Bitso Business API_`;

// Handler principal de mensajes
async function handleMessage(sock, from, text, msg) {
    const cleanText = text.trim().toLowerCase();

    // Comandos básicos
    if (cleanText === 'hola' || cleanText === 'hi' || cleanText === 'hey') {
        await sock.sendMessage(from, { text: WELCOME_MESSAGE });
        return;
    }

    if (cleanText === 'menu' || cleanText === 'ayuda' || cleanText === 'help') {
        await sock.sendMessage(from, { text: WELCOME_MESSAGE });
        return;
    }

    // Por ahora, respuesta temporal para cualquier otro mensaje
    // Esto se reemplazará con Claude AI en el Día 4
    await sock.sendMessage(from, { 
        text: `📝 Recibí tu mensaje: "${text}"\n\n🤖 El agente de IA se activará pronto. Por ahora puedo responder a:\n\n• *hola* — Mensaje de bienvenida\n• *menu* — Ver opciones\n• *ayuda* — Ver opciones\n\n_Kash.ai — tu tesorería inteligente_` 
    });
}

module.exports = { handleMessage };
