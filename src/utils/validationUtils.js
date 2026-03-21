/**
 * Utility per la validazione dei dati.
 */

/**
 * Valida una Partita IVA italiana.
 * @param {string} vat - La stringa della Partita IVA.
 * @returns {boolean} True se valida, false altrimenti.
 */
export const isValidItalianVAT = (vat) => {
    if (!/^[0-9]{11}$/.test(vat)) return false;
    let s = 0;
    for (let i = 0; i <= 9; i += 2) s += parseInt(vat.charAt(i), 10);
    for (let i = 1; i <= 9; i += 2) {
        let n = parseInt(vat.charAt(i), 10) * 2;
        if (n > 9) n -= 9;
        s += n;
    }
    const expectedControlDigit = (10 - (s % 10)) % 10;
    return expectedControlDigit === parseInt(vat.charAt(10), 10);
};

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

/**
 * Restituisce i requisiti della password e il loro stato di completamento.
 * @param {string} password 
 * @returns {Array} Array di oggetti { label, met }
 */
export const getPasswordRequirements = (password) => [
    { key: 'length', label: '8+ Caratteri', met: password.length >= 8 },
    { key: 'uppercase', label: 'Maiuscola', met: /[A-Z]/.test(password) },
    { key: 'lowercase', label: 'Minuscola', met: /[a-z]/.test(password) },
    { key: 'number', label: 'Numero', met: /\d/.test(password) },
    { key: 'symbol', label: 'Simbolo (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
];
