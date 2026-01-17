import React, { useState } from 'react';
import { BillConfig, TariffConfig } from '../types';
import { Settings, CreditCard, Banknote, Calendar, Clock, CheckCircle2, Circle, Lock, Save, Zap, Activity } from 'lucide-react';
import { useLanguage } from '../i18n';

interface BillConfigurationProps {
  config: BillConfig;
  onChange: (key: keyof BillConfig, value: string | number | boolean) => void;
  tariffConfig: TariffConfig;
  onSaveHistory: () => void;
  readOnly?: boolean;
  totalUnits?: number;
}

const BillConfiguration: React.FC<BillConfigurationProps> = ({ config, onChange, tariffConfig, onSaveHistory, readOnly = false }) => {
  const { t, translateMonth, formatNumber } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className={`glass-card rounded-[3rem] p-8 shadow-2xl transition-all duration-500 border border-white/20 relative overflow-hidden ${readOnly ? 'ring-1 ring-amber-500/20' : ''}`}>
      {/* Decorative Aura */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`${readOnly ? 'bg-amber-500/10' : 'bg-emerald-500/10'} p-3 rounded-2xl border border-white/10 shadow-inner`}>
            <Settings className={`w-6 h-6 ${readOnly ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{t('costs_configuration')}</h2>
            <div className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.25em]">PRIMARY BILL DATA</div>
          </div>
        </div>
        {!readOnly && (
           <button 
             onClick={() => { onSaveHistory(); setIsSaved(true); setTimeout(() => setIsSaved(false), 3000); }}
             className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all active:scale-95 shadow-xl border border-emerald-500/20 ${
               isSaved ? 'bg-emerald-500/20 text-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'
             }`}
           >
              {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isSaved ? 'SAVED' : t('save_history')}</span>
           </button>
        )}
      </div>

      <div className="space-y-8 relative z-10">
        {/* Date & Month Row */}
        <div className="grid grid-cols-2 gap-4 p-2 rounded-[2.5rem] bg-black/5 dark:bg-white/5 border border-white/5">
           <div className="relative group">
            <label className="absolute left-4 top-2.5 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('bill_month')}</label>
            <select
              disabled={readOnly} value={config.month} onChange={(e) => onChange('month', e.target.value)}
              className="w-full h-16 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black pt-6 pb-2 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all appearance-none border border-transparent shadow-sm"
            >
              {months.map(m => <option key={m} value={m}>{translateMonth(m)}</option>)}
            </select>
          </div>
          <div className="relative group">
            <label className="absolute left-4 top-2.5 text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('date_generated')}</label>
            <input
              readOnly={readOnly} type="date" value={config.dateGenerated} onChange={(e) => onChange('dateGenerated', e.target.value)}
              className="w-full h-16 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-black pt-6 pb-2 px-4 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all border border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Total Bill Input */}
        <div className="relative group">
          <label className="absolute left-6 top-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] z-10">{t('total_bill_payable')}</label>
          <div className="relative flex items-center">
            <input
              readOnly={readOnly} type="number" value={config.totalBillPayable}
              onChange={(e) => onChange('totalBillPayable', parseFloat(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="w-full h-24 rounded-[2.5rem] bg-black/5 dark:bg-white/5 text-5xl font-black text-slate-900 dark:text-white pt-10 pb-4 px-8 outline-none transition-all border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-emerald-500/30 shadow-inner"
            />
            <span className="absolute right-8 top-12 text-3xl font-black text-emerald-500 drop-shadow-sm">৳</span>
          </div>
        </div>

        {/* Option Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <button 
             disabled={readOnly} onClick={() => onChange('includeBkashFee', !config.includeBkashFee)}
             className={`h-20 rounded-[2rem] px-6 flex items-center gap-4 transition-all active:scale-95 border ${
               config.includeBkashFee 
                 ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 border-emerald-500/30' 
                 : 'bg-black/5 dark:bg-white/5 text-slate-400 border-white/5'
             }`}
          >
            <div className={`p-2.5 rounded-xl ${config.includeBkashFee ? 'bg-white/20' : 'bg-black/10 dark:bg-white/5'}`}>
               <CreditCard className={`w-6 h-6 ${config.includeBkashFee ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className="text-left">
               <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">{t('bkash_fee')}</div>
               <div className="text-xs font-black leading-none">{config.includeBkashFee ? t('included') : t('not_included')}</div>
            </div>
          </button>

          <button 
             disabled={readOnly} onClick={() => onChange('includeLateFee', !config.includeLateFee)}
             className={`h-20 rounded-[2rem] px-6 flex items-center gap-4 transition-all active:scale-95 border ${
               config.includeLateFee 
                 ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20 border-emerald-500/30' 
                 : 'bg-black/5 dark:bg-white/5 text-slate-400 border-white/5'
             }`}
          >
            <div className={`p-2.5 rounded-xl ${config.includeLateFee ? 'bg-white/20' : 'bg-black/10 dark:bg-white/5'}`}>
               <Clock className={`w-6 h-6 ${config.includeLateFee ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <div className="text-left">
               <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">{t('late_fee')}</div>
               <div className="text-xs font-black leading-none">{config.includeLateFee ? t('included') : t('not_included')}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillConfiguration;