const LoadingScreen = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-all duration-500">
      {/* contenuto interno INVARIATO */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#68B49B]/10 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[#68B49B] border-r-transparent border-b-[#68B49B]/30 border-l-transparent animate-spin" />
          <div className="animate-[spin_3s_linear_infinite]">
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <path
                d="M20 15V85M80 15V85M20 50H80"
                stroke="#68B49B"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="mt-6">
          <span className="text-[#68B49B] font-bold text-lg tracking-[0.2em] animate-pulse">
            CARICAMENTO
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;