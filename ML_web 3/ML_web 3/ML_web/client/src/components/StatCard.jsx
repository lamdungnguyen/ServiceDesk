export default function StatCard({ label, value, helper, icon }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-pink-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
      <div className="flex justify-between items-start mb-2">
         <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</h4>
         {icon && <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{icon}</span>}
      </div>
      <div>
         <p className="text-3xl font-extrabold text-slate-900 tracking-tight my-2 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
             {value}
         </p>
         <p className="text-sm text-slate-500 font-medium">
             {helper}
         </p>
      </div>
    </div>
  );
}
