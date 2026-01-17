import React from 'react';
import { ChevronUp, Zap } from 'lucide-react';
import { useLanguage } from '../i18n';

interface StickySummaryProps {
  totalAmount: number;
  totalUnits: number;
  onExpand: () => void;
}

const StickySummary: React.FC<StickySummaryProps> = ({ totalAmount, totalUnits, onExpand }) => {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-[70px] left-4 right-4 z-40 lg:hidden print:hidden">
      <div 
        onClick={onExpand}
        className="bg-slate-900/90 dark:bg-white/10 backdrop-blur-md text-white border border-white/10 shadow-xl rounded-2xl p-4 flex items-center justify-between cursor-pointer ring-1 ring-black/5"
      >
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-300 tracking-wider mb-0.5">{t('est_total_payable')}</span>
          <div className="text-xl font-bold font-mono">৳{Math.round(totalAmount)}</div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-300 tracking-wider mb-0.5 block">{t('total_units')}</span>
                <div className="text-sm font-bold flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {totalUnits}
                </div>
            </div>
            <div className="bg-white/10 rounded-full p-1.5">
                <ChevronUp className="w-5 h-5 text-white" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StickySummary;