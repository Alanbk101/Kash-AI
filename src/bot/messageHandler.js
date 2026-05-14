const { processMessage } = require('../ai/toolHandler');
const { findUser, createUser } = require('../database/supabaseClient');
const { isRateLimited } = require('../utils/rateLimiter');

// Usuarios en proceso de registro
const pendingRegistration = {};

// Cache de usuarios
const userCache = {};

// Handler principal de mensajes
async function handleMessage(sock, from, text, msg) {
    const cleanText = text.trim();

    // Ignorar mensajes vacíos o muy largos
    if (!cleanText || cleanText.length > 500) {
        return;
    }

    // Rate limiting
    if (isRateLimited(from)) {
        await sock.sendMessage(from, { 
            text: '⏳ Estás enviando mensajes muy rápido. Espera un momento e intenta de nuevo.' 
        });
        return;
    }

    // Indicador de "escribiendo..."
    try {
        await sock.sendPresenceUpdate('composing', from);
    } catch (e) {
        // Ignorar error de presencia
    }

    // Registro de usuarios nuevos
    if (pendingRegistration[from]) {
        try {
            const businessName = cleanText;
            const user = await createUser(from, businessName);

            if (user) {
                delete pendingRegistration[from];
                userCache[from] = user;
                await sock.sendMessage(from, { 
                    text: `✅ *¡Listo, ${businessName}!*\n\nTu cuenta en Kash.ai está activa.\n\nPuedes pedirme cosas como:\n\n💰 "¿Cuánto tengo?"\n💸 "Paga $5,000 a CLABE 012..."\n📊 "Dame mi reporte semanal"\n📋 "Mis transacciones"\n🧾 "Cobrarle $3,000 a Pedro"\n\nO simplemente dime qué necesitas 💪` 
                });
            } else {
                await sock.sendMessage(from, { 
                    text: '⚠️ Hubo un error. Intenta escribir el nombre de tu negocio de nuevo.' 
                });
            }
        } catch (error) {
            console.error('Error en registro:', error);
            await sock.sendMessage(from, { text: '⚠️ Error en el registro. Intenta de nuevo.' });
        }
        return;
    }

    // Buscar usuario
    let user = userCache[from];
    if (!user) {
        try {
            user = await findUser(from);
            if (user) {
                userCache[from] = user;
            }
        } catch (error) {
            console.error('Error buscando usuario:', error);
        }
    }

    if (!user) {
        pendingRegistration[from] = true;
        await sock.sendMessage(from, { 
            text: `¡Hola! 👋 Soy *Kash.ai* 🏦\n\nTu asistente financiero inteligente por WhatsApp.\n\nPowered by IA + MXNB en Arbitrum + Bitso Business API\n\nPara empezar, necesito registrarte.\n\n📝 *¿Cuál es el nombre de tu negocio?*` 
        });
        return;
    }

    // Procesar con IA
    try {
        const response = await processMessage(from, cleanText, user);
        await sock.sendMessage(from, { text: response });
    } catch (error) {
        console.error('Error procesando mensaje:', error);
        await sock.sendMessage(from, { 
            text: '⚠️ Hubo un error procesando tu mensaje. Intenta de nuevo en unos segundos.' 
        });
    }
}

module.exports = { handleMessage };
