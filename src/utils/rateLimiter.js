// Rate limiter simple — máximo 20 mensajes por minuto por usuario
const userMessages = {};

function isRateLimited(userId) {
    const now = Date.now();
    
    if (!userMessages[userId]) {
        userMessages[userId] = [];
    }

    // Limpiar mensajes de hace más de 1 minuto
    userMessages[userId] = userMessages[userId].filter(time => now - time < 60000);

    // Verificar límite
    if (userMessages[userId].length >= 20) {
        return true;
    }

    // Registrar este mensaje
    userMessages[userId].push(now);
    return false;
}

module.exports = { isRateLimited };
