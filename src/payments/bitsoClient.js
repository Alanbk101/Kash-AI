const crypto = require('crypto');
require('dotenv').config();

const BITSO_API_KEY = process.env.BITSO_API_KEY;
const BITSO_API_SECRET = process.env.BITSO_API_SECRET;
const BITSO_API_URL = process.env.BITSO_API_URL;

// Generar header de autenticación HMAC-SHA256
function getAuthHeader(method, path, payload = '') {
    const nonce = Date.now().toString();
    const message = nonce + method.toUpperCase() + path + payload;
    const signature = crypto
        .createHmac('sha256', BITSO_API_SECRET)
        .update(message)
        .digest('hex');

    return `Bitso ${BITSO_API_KEY}:${nonce}:${signature}`;
}

// Request GET autenticado
async function bitsoGet(endpoint) {
    const path = `/api/v3/${endpoint}`;
    const url = `${BITSO_API_URL}/${endpoint}`;
    const authHeader = getAuthHeader('GET', path);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.success) {
            console.error('Bitso API error:', data.error);
            return null;
        }

        return data.payload;
    } catch (error) {
        console.error('Error llamando Bitso API:', error.message);
        return null;
    }
}

// Request POST autenticado
async function bitsoPost(endpoint, body = {}) {
    const path = `/api/v3/${endpoint}`;
    const url = `${BITSO_API_URL}/${endpoint}`;
    const payload = JSON.stringify(body);
    const authHeader = getAuthHeader('POST', path, payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: payload
        });

        const data = await response.json();

        if (!data.success) {
            console.error('Bitso API error:', data.error);
            return null;
        }

        return data.payload;
    } catch (error) {
        console.error('Error llamando Bitso API:', error.message);
        return null;
    }
}

// Obtener balances de la cuenta
async function getBalance() {
    const payload = await bitsoGet('balance/');
    if (!payload || !payload.balances) return null;

    const balances = {};
    payload.balances.forEach(b => {
        balances[b.currency] = {
            available: parseFloat(b.available),
            locked: parseFloat(b.locked),
            total: parseFloat(b.total)
        };
    });

    return balances;
}

// Obtener historial de movimientos
async function getLedger(currency = 'mxn') {
    const payload = await bitsoGet(`ledger/?currency=${currency}`);
    return payload || [];
}

// Obtener ticker (precio actual)
async function getTicker(book = 'btc_mxn') {
    try {
        const response = await fetch(`${BITSO_API_URL}/ticker/?book=${book}`);
        const data = await response.json();

        if (!data.success) return null;
        return data.payload;
    } catch (error) {
        console.error('Error obteniendo ticker:', error.message);
        return null;
    }
}

module.exports = { bitsoGet, bitsoPost, getBalance, getLedger, getTicker };
