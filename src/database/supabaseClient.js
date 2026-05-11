const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
        realtime: {
            transport: WebSocket
        }
    }
);

// Buscar usuario por teléfono
async function findUser(phone) {
    const { data, error } = await supabase
        .from('kash_users')
        .select('*')
        .eq('phone', phone)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error buscando usuario:', error);
    }
    return data;
}

// Crear usuario nuevo
async function createUser(phone, businessName) {
    const { data, error } = await supabase
        .from('kash_users')
        .insert([{ phone, business_name: businessName }])
        .select()
        .single();

    if (error) {
        console.error('Error creando usuario:', error);
        return null;
    }
    return data;
}

// Actualizar nombre del negocio
async function updateBusinessName(phone, businessName) {
    const { data, error } = await supabase
        .from('kash_users')
        .update({ business_name: businessName, updated_at: new Date() })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error('Error actualizando usuario:', error);
        return null;
    }
    return data;
}

// Guardar transacción
async function saveTransaction(userId, transaction) {
    const { data, error } = await supabase
        .from('kash_transactions')
        .insert([{
            user_id: userId,
            type: transaction.type,
            amount: transaction.amount,
            currency: transaction.currency || 'MXN',
            recipient_name: transaction.recipient_name,
            recipient_clabe: transaction.recipient_clabe,
            status: transaction.status || 'completed',
            tx_hash: transaction.tx_hash,
            bitso_reference: transaction.bitso_reference,
            ai_summary: transaction.ai_summary
        }])
        .select()
        .single();

    if (error) {
        console.error('Error guardando transacción:', error);
        return null;
    }
    return data;
}

module.exports = { supabase, findUser, createUser, updateBusinessName, saveTransaction };
