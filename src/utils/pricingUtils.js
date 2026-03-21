export const calculateLuggageTotal = (dateFrom, timeFrom, dateTo, timeTo, bags, sizePrices) => {
    // 1. Validation
    if (!dateFrom || !timeFrom || !dateTo || !timeTo || !sizePrices || !Array.isArray(sizePrices)) {
        return { total: 0, pricePerDay: 0, duration: { days: 0, hours: 0, totalHours: 0 } };
    }

    // 2. Parse dates
    const start = new Date(`${dateFrom}T${timeFrom}:00`);
    const end = new Date(`${dateTo}T${timeTo}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        return { total: 0, pricePerDay: 0, duration: { days: 0, hours: 0, totalHours: 0 } };
    }

    // 3. Calculate duration
    const diffMs = end - start;
    // Arrotonda per eccesso all'ora successiva
    const totalHours = Math.ceil(diffMs / (1000 * 60 * 60)); 
    
    const fullDays = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;

    let totalCost = 0;
    let totalPricePerDay = 0; // Prezzo giornaliero teorico per i bagagli selezionati

    // 4. Helper to find price for size
    const getPrice = (size) => {
        // Cerca price object ignorando case
        const p = sizePrices.find(sp => sp.size?.toUpperCase() === size);
        return {
            daily: p?.pricePerDay || 0,
            hourly: p?.pricePerHour || 0
        };
    };

    // 5. Calculate for each bag type
    const bagTypes = [
        { key: 'small', size: 'SMALL', count: bags.small || 0 },
        { key: 'medium', size: 'MEDIUM', count: bags.medium || 0 },
        { key: 'large', size: 'LARGE', count: bags.large || 0 }
    ];

    bagTypes.forEach(bag => {
        if (bag.count > 0) {
            const { daily, hourly } = getPrice(bag.size);
            
            // Calcolo costo:
            // Giorni interi * tariffa giornaliera
            const costFullDays = fullDays * daily;
            
            // Ore rimanenti * tariffa oraria (con CAP giornaliero)
            // Se (ore * tariffa oraria) > tariffa giornaliera, usa tariffa giornaliera
            const costRemaining = Math.min(remainingHours * hourly, daily);
            
            const costPerBag = costFullDays + costRemaining;
            
            totalCost += costPerBag * bag.count;
            totalPricePerDay += daily * bag.count;
        }
    });

    return {
        total: parseFloat(totalCost.toFixed(2)),
        pricePerDay: parseFloat(totalPricePerDay.toFixed(2)),
        duration: { days: fullDays, hours: remainingHours, totalHours }
    };
};
