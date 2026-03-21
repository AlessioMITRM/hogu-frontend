/**
 * Utility per la validazione dei file nel frontend.
 */

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per singolo file (come da backend config)
export const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB totale (limite richiesto dall'utente)

/**
 * Valida un array di file verificando se la dimensione totale supera il limite.
 * 
 * @param {File[]} newFiles - I nuovi file da aggiungere.
 * @param {File[]} existingFiles - I file già presenti nella lista.
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateTotalFileSize = (newFiles, existingFiles = []) => {
    const totalExistingSize = existingFiles.reduce((acc, file) => acc + file.size, 0);
    const totalNewSize = Array.from(newFiles).reduce((acc, file) => acc + file.size, 0);
    const totalSize = totalExistingSize + totalNewSize;

    if (totalSize > MAX_TOTAL_SIZE) {
        return {
            isValid: false,
            error: `La dimensione totale dei file (${(totalSize / 1024 / 1024).toFixed(2)} MB) supera il limite massimo di ${(MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB.`
        };
    }

    return { isValid: true, error: null };
};

/**
 * Valida un singolo file (es. estensione o dimensione singola).
 * 
 * @param {File} file 
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateSingleFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `Il file ${file.name} supera il limite di ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB.`
        };
    }
    return { isValid: true, error: null };
};
