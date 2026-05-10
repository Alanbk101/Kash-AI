const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// System prompt — la personalidad de Kash.ai
const SYSTEM_PROMPT = `Eres Kash, el asistente financiero inteligente para PyMEs mexicanas.

REGLAS DE COMPORTAMIENTO:
- Hablas en español mexicano, profesional pero accesible
- Tus respuestas son CORTAS (máximo 300 caracteres por mensaje de WhatsApp)
- Usas emojis con moderación para ser amigable
- Siempre confirmas antes de ejecutar un pago
- Si no entiendes algo, pides aclaración
- Nunca inventas datos — si no tienes info, lo dices

TU TRABAJO:
Ayudas a dueños de PyMEs mexicanas a gestionar su tesorería desde WhatsApp:
1. Consultar balances (MXNB onchain + MXN en Bitso)
2. Enviar pagos a proveedores vía SPEI
3. Ver historial de transacciones
4. Generar reportes financieros con análisis

CONTEXTO TÉCNICO:
- MXNB es una stablecoin del peso mexicano (1 MXNB = 1 MXN)
- Los pagos se procesan vía Bitso Business API y SPEI
- Los balances onchain están en Arbitrum (Layer 2 de Ethereum)`;

// Tools — las acciones que Claude puede ejecutar
const TOOLS = [
    {
        name: "check_balance",
        description: "Consulta el balance actual del usuario en MXNB (onchain) y MXN (Bitso). Usar cuando el usuario pregunta cuánto tiene, su saldo, o su balance.",
        input_schema: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "send_payment",
        description: "Envía un pago a un proveedor o persona vía SPEI. Usar cuando el usuario quiere pagar, transferir o enviar dinero.",
        input_schema: {
            type: "object",
            properties: {
                recipient_name: { 
                    type: "string", 
                    description: "Nombre del destinatario" 
                },
                clabe: { 
                    type: "string", 
                    description: "CLABE interbancaria de 18 dígitos" 
                },
                amount: { 
                    type: "number", 
                    description: "Monto en MXN a enviar" 
                },
                concept: { 
                    type: "string", 
                    description: "Concepto o razón del pago" 
                }
            },
            required: ["clabe", "amount"]
        }
    },
    {
        name: "get_transactions",
        description: "Obtiene el historial de transacciones recientes. Usar cuando el usuario pide ver sus movimientos, transacciones o historial.",
        input_schema: {
            type: "object",
            properties: {
                days: { 
                    type: "number", 
                    description: "Últimos N días a consultar (default 7)" 
                }
            },
            required: []
        }
    },
    {
        name: "generate_report",
        description: "Genera un reporte financiero resumido con análisis de IA. Usar cuando el usuario pide reporte, resumen o análisis de sus finanzas.",
        input_schema: {
            type: "object",
            properties: {
                period: { 
                    type: "string", 
                    enum: ["today", "week", "month"],
                    description: "Período del reporte" 
                }
            },
            required: []
        }
    },
    {
        name: "request_payment",
        description: "Genera instrucciones de cobro para enviar a un cliente. Usar cuando el usuario quiere cobrar, solicitar pago o generar referencia de cobro.",
        input_schema: {
            type: "object",
            properties: {
                client_name: { 
                    type: "string", 
                    description: "Nombre del cliente a cobrar" 
                },
                amount: { 
                    type: "number", 
                    description: "Monto a cobrar en MXN" 
                },
                concept: { 
                    type: "string", 
                    description: "Concepto del cobro" 
                }
            },
            required: ["amount"]
        }
    }
];

// Función principal — enviar mensaje a Claude y obtener respuesta
async function chat(userMessage, conversationHistory = []) {
    const messages = [
        ...conversationHistory,
        { role: "user", content: userMessage }
    ];

    const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: messages
    });

    return response;
}

module.exports = { chat, TOOLS };
