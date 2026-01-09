
export const ServiceHeaderDetail = ({ title, urgencyCount, tags }) => (
    <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-[#1A202C]">{title}</h1>
            
            {/* TAGS ALLINEATI AL TITOLO */}
            {tags && (
                <div className="flex flex-wrap gap-2">
                    {tags}
                </div>
            )}
        </div>
        
        <div className="flex items-center gap-2 text-red-500 font-medium text-sm animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            {urgencyCount} persone lo stanno visualizzando ora
        </div>
    </div>
);
 