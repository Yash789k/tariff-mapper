export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 20 20" fill="currentColor" style={{width:18,height:18}}>
              <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="text-sm font-bold text-gray-900 tracking-tight">TariffMapper</span>
            <span className="hidden sm:block text-[10px] text-gray-400 leading-none mt-0.5">China ↔ Indonesia Classification</span>
          </div>
        </div>

        {/* Center pills */}
        <div className="hidden md:flex items-center gap-1.5">
          {["WCO HS 2022", "China CCC 2024", "Indonesia BTKI 2022", "ASEAN AHTN"].map((label) => (
            <span key={label} className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium border border-gray-200/60">
              {label}
            </span>
          ))}
        </div>

        {/* Right badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-blue-700">GPT-4o</span>
          </div>
        </div>
      </div>
    </header>
  );
}
