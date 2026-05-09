const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp(messageHandler) {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        browser: ['Kash.ai', 'Chrome', '1.0.0']
    });

    // Guardar credenciales cuando se actualicen
    sock.ev.on('creds.update', saveCreds);

    // Manejar conexión y QR
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 Escanea este QR con tu WhatsApp:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) 
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut 
                : true;

            console.log('❌ Conexión cerrada. Reconectando:', shouldReconnect);

            if (shouldReconnect) {
                connectToWhatsApp(messageHandler);
            }
        } else if (connection === 'open') {
            console.log('✅ Kash.ai conectado a WhatsApp');
        }
    });

    // Escuchar mensajes
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation 
            || msg.message.extendedTextMessage?.text 
            || '';

        if (!text || from === 'status@broadcast') return;

        console.log(`📩 Mensaje de ${from}: ${text}`);

        try {
            await messageHandler(sock, from, text, msg);
        } catch (error) {
            console.error('Error procesando mensaje:', error);
            await sock.sendMessage(from, { text: '⚠️ Hubo un error procesando tu mensaje. Intenta de nuevo.' });
        }
    });

    return sock;
}

module.exports = { connectToWhatsApp };
