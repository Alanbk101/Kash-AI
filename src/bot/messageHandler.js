const { processMessage } = require('../ai/toolHandler');

// Handler principal de mensajes — ahora con Claude AI
async function handleMessage(sock, from, text, msg) {
    const cleanText = text.trim();

    // Indicador de "escribiendo..."
    await sock.sendPresenceUpdate('composing', from);

    // Procesar con Claude AI
    const response = await processMessage(from, cleanText);

    // Enviar respuesta
    await sock.sendMessage(from, { text: response });
}

module.exports = { handleMessage };
