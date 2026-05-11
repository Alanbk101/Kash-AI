const { processMessage } = require('../ai/toolHandler');
const { findUser, createUser } = require('../database/supabaseClient');

// Usuarios en proceso de registro
const pendingRegistration = {};

// Handler principal de mensajes
async function handleMessage(sock, from, text, msg) {
    const cleanText = text.trim();

    // Indicador de "escribiendo..."
    await sock.sendPresenceUpdate('composing', from);

    // Verificar si el usuario está en proceso de registro
    if (pendingRegistration[from]) {
        const businessName = cleanText;
        const user = await createUser(from, businessName);

        if (user) {
            delete pendingRegistration[from];
            await sock.sendMessage(from, { 
                text: `✅ *¡Listo, ${businessName}!*\n\nTu cuenta en Kash.ai está activa.\n\nAhora puedes:\n💰 Consultar tu balance\n💸 Enviar pagos SPEI\n📊 Generar reportes\n📋 Ver transacciones\n\n¿En qué te ayudo?` 
            });
        } else {
            await sock.sendMessage(from, { 
                text: '⚠️ Hubo un error registrando tu cuenta. Intenta de nuevo escribiendo el nombre de tu negocio.' 
            });
        }
        return;
    }

    // Verificar si el usuario existe en la base de datos
    const user = await findUser(from);

    if (!user) {
        // Usuario nuevo — iniciar registro
        pendingRegistration[from] = true;
        await sock.sendMessage(from, { 
            text: `¡Hola! 👋 Soy *Kash.ai* 🏦\n\nTu asistente financiero inteligente por WhatsApp.\n\nPara empezar, necesito registrarte.\n\n📝 *¿Cuál es el nombre de tu negocio?*` 
        });
        return;
    }

    // Usuario existente — procesar con IA
    const response = await processMessage(from, cleanText);
    await sock.sendMessage(from, { text: response });
}

module.exports = { handleMessage };
