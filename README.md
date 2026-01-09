# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

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