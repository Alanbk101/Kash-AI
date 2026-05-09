require('dotenv').config();
const { connectToWhatsApp } = require('./connection');
const { handleMessage } = require('./messageHandler');

console.log('🚀 Iniciando Kash.ai...');
console.log('📱 Esperando conexión a WhatsApp...\n');

connectToWhatsApp(handleMessage);
