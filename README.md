# AVVIO REACT + VITE
    Per avviare l'applicativo lato front
    1. Aprire il terminale
    2. Navigare fino alla directory del progetto
    3. Esegui il comando `npm install` per installare le dipendenze
    4. Esegui il comando `npm run dev` per avviare l'applicativo

# AVVIARE DOCKER 
    Per l'utilizzo di ngix

## LIBRERIRE UTILIZZATE
    react-currency-input-field ** Per importi decimali pensati per i valori monetari

## COMPONENTI UTILI PER SVILUPPI FUTURI
    SEZIONE SERVIZI:
        {/* SEZIONE 3: SERVIZI (AMENITIES) */}
        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {/* Star resta gialla/oro, è standard */}
                <Star size={24} className="text-yellow-500 fill-yellow-500" />
                Caratteristiche
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AmenityToggle icon={Wifi} label="Wi-Fi Gratuito" active={formData.features.includes('wifi')} onClick={() => toggleFeature('wifi')} />
                <AmenityToggle icon={Wine} label="Carta dei Vini" active={formData.features.includes('wine')} onClick={() => toggleFeature('wine')} />
                <AmenityToggle icon={Vegan} label="Opzioni Vegane" active={formData.features.includes('vegan')} onClick={() => toggleFeature('vegan')} />
                <AmenityToggle icon={Accessibility} label="Accessibile Disabili" active={formData.features.includes('accessible')} onClick={() => toggleFeature('accessible')} />
                <AmenityToggle icon={Utensils} label="Dehor Esterno" active={formData.features.includes('outdoor')} onClick={() => toggleFeature('outdoor')} />
                <AmenityToggle icon={Car} label="Valet Parking" active={formData.features.includes('valet')} onClick={() => toggleFeature('valet')} />
            </div>
        </section>

## TRASPORTO DOCKER PRODUZIONE:
    docker run -d --name my-nginx \
    -p 80:80 \
    -v C:/storage/build:/usr/share/nginx/html/build:ro \
    -v C:/storage:/usr/share/nginx/html:ro \
    -v C:/storage/nginx-conf/nginx.conf:/etc/nginx/nginx.conf:ro \
    nginx:latest
