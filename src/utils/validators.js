// Validar CLABE interbancaria mexicana (18 dígitos)
function validateCLABE(clabe) {
    if (!clabe) return { valid: false, error: 'CLABE no proporcionada' };
    
    // Limpiar espacios
    const clean = clabe.replace(/\s/g, '');
    
    // Verificar que sean 18 dígitos
    if (!/^\d{18}$/.test(clean)) {
        return { valid: false, error: 'La CLABE debe tener exactamente 18 dígitos numéricos' };
    }

    // Catálogo de bancos mexicanos por código (primeros 3 dígitos)
    const bancos = {
        '002': 'BBVA', '012': 'BBVA Bancomer', '014': 'Santander',
        '021': 'HSBC', '030': 'Bajío', '032': 'IXE',
        '036': 'Inbursa', '037': 'Interacciones', '042': 'Mifel',
        '044': 'Scotiabank', '058': 'Banregio', '059': 'Invex',
        '060': 'Bansi', '062': 'Afirme', '072': 'Banorte',
        '102': 'ABN AMRO', '103': 'American Express', '106': 'BAMSA',
        '108': 'Tokyo', '110': 'JP Morgan', '112': 'Bmonex',
        '113': 'Ve por Más', '116': 'ING', '124': 'Deutsche',
        '126': 'Credit Suisse', '127': 'Azteca', '128': 'Autofin',
        '129': 'Barclays', '130': 'Compartamos', '131': 'Banco Famsa',
        '132': 'Multiva', '133': 'Actinver', '134': 'Walmart',
        '135': 'Nafin', '136': 'Interbanco', '137': 'Bancoppel',
        '138': 'ABC Capital', '139': 'UBS', '140': 'Consubanco',
        '141': 'Volkswagen', '143': 'CIBanco', '145': 'Bbase',
        '147': 'Bankaool', '148': 'Pagatodo', '150': 'Inmobiliario',
        '155': 'ICBC', '156': 'Sabadell', '166': 'Bansefi',
        '168': 'Hipotecaria Federal', '600': 'Monexcb', '601': 'GBM',
        '602': 'Masari', '605': 'Valué', '606': 'Fondos',
        '607': 'Praxis', '608': 'Vecto', '610': 'Vector',
        '611': 'B&B', '613': 'Multiva Cbolsa', '616': 'Finamex',
        '617': 'Valmex', '618': 'Unica', '619': 'Mapfre',
        '620': 'Profuturo', '621': 'CB Actinver', '622': 'Oactin',
        '623': 'Cbolsa', '626': 'CBDEUTSCHE', '627': 'Zurich',
        '628': 'Zurichvi', '629': 'SU Casita', '630': 'CB Intercam',
        '631': 'CI Bolsa', '632': 'Bulltick CB', '633': 'Sterling',
        '634': 'Fincomun', '636': 'HDI Seguros', '637': 'Order',
        '638': 'Akala', '640': 'CB JP Morgan', '642': 'Reforma',
        '646': 'STP', '648': 'Evercore', '649': 'Skandia',
        '651': 'Segmty', '652': 'Asea', '653': 'Kuspit',
        '655': 'Sofiexpress', '656': 'Unagra', '659': 'ASP Integra',
        '670': 'Libertad', '674': 'AXA', '677': 'Caja Pop',
        '678': 'Sura', '679': 'FND', '684': 'Transfer',
        '685': 'Fondo (FIRA)', '686': 'INVERCAP', '689': 'FOMPED',
        '699': 'Fondeadora', '703': 'Chubb Seguros', '706': 'Arcus',
        '710': 'Nu México', '722': 'Mercado Pago', '723': 'Cuenca',
        '901': 'CoDi Valida', '902': 'Indeval'
    };

    const bankCode = clean.substring(0, 3);
    const bankName = bancos[bankCode] || 'Banco no identificado';

    return {
        valid: true,
        clabe: clean,
        bank_code: bankCode,
        bank_name: bankName
    };
}

// Validar monto
function validateAmount(amount) {
    const num = parseFloat(amount);
    
    if (isNaN(num)) {
        return { valid: false, error: 'El monto no es un número válido' };
    }
    
    if (num <= 0) {
        return { valid: false, error: 'El monto debe ser mayor a $0' };
    }
    
    if (num > 500000) {
        return { valid: false, error: 'El monto máximo por transferencia es $500,000 MXN' };
    }

    return { valid: true, amount: Math.round(num * 100) / 100 };
}

module.exports = { validateCLABE, validateAmount };
