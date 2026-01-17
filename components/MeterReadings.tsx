
import React, { useState, useRef } from 'react';
import { MeterReading, Tenant, TariffConfig } from '../types';
import { Users, Trash2, Plus, Zap, Lock, ChevronDown, ChevronUp, Activity, ShieldAlert, X } from 'lucide-react';
import { useLanguage } from '../i18n';

interface MeterReadingsProps {
  mainMeter: MeterReading;
  onMainMeterUpdate: (reading: MeterReading) => void;
  readings: MeterReading[];
  onUpdate: (readings: MeterReading[]) => void;
  tenants: Tenant[];
  onManageTenants?: () => void;
  maxUnits?: number; 
  calculatedRate?: number;
  tariffConfig?: TariffConfig;
  readOnly?: boolean;
}

const MeterReadings: React.FC<MeterReadingsProps> = ({ 
  mainMeter, onMainMeterUpdate, readings, onUpdate, tenants, onManageTenants, 
  maxUnits = 1, calculatedRate = 0, tariffConfig, readOnly = false
}) => {
  const { t, formatNumber } = useLanguage();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [meterToDelete, setMeterToDelete] = useState<MeterReading | null>(null);
  const [confirmText, setConfirmText] = useState('');
  
  const longPressTimerRef = useRef<number | null>(null);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedCards);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedCards(newSet);
  };
  
  const handleChange = (id: string, key: keyof MeterReading, value: string | number) => {
    if (readOnly) return;
    onUpdate(readings.map(r => r.id === id ? { ...r, [key]: value } : r));
  };

  const handleMainMeterChange = (key: keyof MeterReading, value: string | number) => {
    if (readOnly) return;
    onMainMeterUpdate({ ...mainMeter, [key]: value });
  };

  const startLongPress = (reading: MeterReading) => {
    if (readOnly) return;
    longPressTimerRef.current = window.setTimeout(() => {
      setMeterToDelete(reading);
      setConfirmText('');
      if ('vibrate' in navigator) navigator.vibrate(50);
    }, 800);
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
  };

  const handleConfirmDelete = () => {
    if (meterToDelete && confirmText.toUpperCase() === 'DELETE') {
      onUpdate(readings.filter(r => r.id !== meterToDelete.id));
      setMeterToDelete(null);
    }
  };

  const totalUserUnits = readings.reduce((acc, r) => acc + Math.max(0, r.current - r.previous), 0);
  const mainMeterUnits = Math.max(0, mainMeter.current - mainMeter.previous);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex items-center justify-between px-2 pt-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1.5">{t('meter_readings')}</h2>
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.25em]">{readings.length} ACTIVE SLOTS</span>
        </div>
        {!readOnly && (
            <button 
                onClick={() => {
                  const newId = Date.now().toString();
                  onUpdate([...readings, { id: newId, name: 'New User', meterNo: (readings.length + 1).toString(), previous: 0, current: 0 }]);
                  setExpandedCards(prev => new Set(prev).add(newId));
                }}
                className="bg-emerald-600 text-white p-3.5 rounded-2xl shadow-xl active:scale-90 transition-all border border-emerald-500/20"
            >
                <Plus className="w-6 h-6" />
            </button>
        )}
      </div>

      {/* Main Meter Section */}
      <div className="glass-card rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
           <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20 shadow-inner">
                    <Lock className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-none mb-1.5 uppercase tracking-wide">{t('main_meter')}</h3>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">METER ID: {formatNumber(mainMeter.meterNo)}</div>
                 </div>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">AGGREGATE CONSUMPTION</span>
                <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatNumber(mainMeterUnits)}</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="relative group">
                 <span className="absolute left-4 top-2.5 text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">{t('previous')}</span>
                 <input
                    readOnly={readOnly} type="number" value={mainMeter.previous}
                    onChange={(e) => handleMainMeterChange('previous', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-4 pt-7 pb-2.5 text-right text-base font-black text-slate-600 dark:text-slate-400 outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                 />
              </div>
              <div className="relative group">
                 <span className="absolute left-4 top-2.5 text-[8px] font-black uppercase tracking-[0.15em] text-emerald-500">{t('current')}</span>
                 <input
                    readOnly={readOnly} type="number" value={mainMeter.current}
                    onChange={(e) => handleMainMeterChange('current', parseFloat(e.target.value) || 0)}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-4 pt-7 pb-2.5 text-right text-base font-black text-slate-900 dark:text-white outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                 />
              </div>
           </div>
      </div>

      {/* Individual Meter List */}
      <div className="space-y-6">
        {readings.map((reading) => {
             const units = Math.max(0, reading.current - reading.previous);
             const isExpanded = expandedCards.has(reading.id);
             const estimatedCost = units * calculatedRate;
             const consumptionPercent = maxUnits > 0 ? (units / maxUnits) * 100 : 0;
             
             return (
               <div 
                 key={reading.id} 
                 onMouseDown={() => startLongPress(reading)}
                 onMouseUp={endLongPress}
                 onMouseLeave={endLongPress}
                 onTouchStart={() => startLongPress(reading)}
                 onTouchEnd={endLongPress}
                 className="relative overflow-hidden rounded-[2.5rem]"
               >
                 <div className="glass-card bg-white/95 dark:bg-slate-900/95 shadow-xl rounded-[2.5rem] transition-all duration-300 relative z-10 active:scale-[0.99] select-none">
                   <div className="p-7">
                      <div className="flex justify-between items-start mb-6 cursor-pointer" onClick={() => toggleExpand(reading.id)}>
                         <div className="flex items-center gap-5 min-w-0">
                             <div className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/10 shadow-inner text-emerald-600 font-black">
                                {reading.name.substring(0, 2).toUpperCase() || 'U'}
                             </div>
                             <div className="min-w-0">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate mb-1">{t(reading.name)}</h3>
                                <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">MTR: {formatNumber(reading.meterNo)}</div>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none mb-1">৳{formatNumber(Math.round(estimatedCost))}</div>
                             <div className="flex items-center justify-end gap-1.5">
                                <Zap className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{formatNumber(units)} UNIT</span>
                             </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[7px] font-black uppercase tracking-[0.2em] text-slate-500">{t('previous')}</span>
                            <input
                               readOnly={readOnly} type="number" value={reading.previous}
                               onChange={(e) => handleChange(reading.id, 'previous', parseFloat(e.target.value) || 0)}
                               onFocus={(e) => e.target.select()}
                               className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 pt-6 pb-2 text-right text-sm font-black text-slate-500 outline-none transition-all focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-emerald-500/10"
                            />
                         </div>
                         <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[7px] font-black uppercase tracking-[0.2em] text-emerald-500">{t('current')}</span>
                            <input
                                readOnly={readOnly} type="number" value={reading.current}
                                onChange={(e) => handleChange(reading.id, 'current', parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                                className="w-full bg-black/5 dark:bg-white/5 rounded-xl px-4 pt-6 pb-2 text-right text-sm font-black text-slate-900 dark:text-white outline-none border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                            />
                         </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/10 space-y-5 animate-in slide-in-from-top-2 duration-300">
                           <div className="flex items-center gap-3">
                              <div className="relative flex-1 group">
                                 <select
                                    disabled={readOnly} value={tenants.some(t => t.name === reading.name) ? reading.name : ''}
                                    onChange={(e) => handleChange(reading.id, 'name', e.target.value)}
                                    className="w-full h-14 rounded-2xl border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-900 dark:text-white text-sm font-semibold pl-5 pr-12 appearance-none focus:ring-2 focus:ring-emerald-500/30 transition-all outline-none"
                                 >
                                    <option value="" disabled>{t('select_tenant')}</option>
                                    {tenants.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                 </select>
                                 <ChevronDown className="absolute right-5 top-5 w-4 h-4 text-slate-500 pointer-events-none" />
                              </div>
                           </div>
                           <div className="flex justify-end items-center">
                              <button onClick={() => toggleExpand(reading.id)} className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 transition-all">
                                 <ChevronUp className="w-5 h-5 text-slate-500" />
                              </button>
                           </div>
                        </div>
                      )}
                      
                      {!isExpanded && (
                        <div className="mt-6 h-1 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                           <div 
                              className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                              style={{ width: `${consumptionPercent}%` }}
                           ></div>
                        </div>
                      )}
                   </div>
                 </div>
               </div>
             );
        })}
      </div>

      {/* Secure Delete Confirmation Modal */}
      {meterToDelete && (
        <div 
          onClick={() => setMeterToDelete(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-rose-500/20 animate-in slide-in-from-bottom-4 relative overflow-hidden text-center"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-inner">
                     <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Hold Triggered</h3>
                </div>
                <button onClick={() => setMeterToDelete(null)} className="p-3 bg-black/5 dark:bg-white/5 rounded-2xl active:scale-90 transition-all">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    Removing <span className="font-black underline">{meterToDelete.name}</span>. Type <span className="text-rose-500 font-black">DELETE</span> to confirm.
                  </p>
                  
                  <div className="relative">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="DELETE"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="w-full h-16 rounded-xl bg-white dark:bg-slate-950 border border-rose-500/20 px-4 text-center text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-200 dark:placeholder:text-slate-800 uppercase"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    disabled={confirmText.toUpperCase() !== 'DELETE'}
                    onClick={handleConfirmDelete}
                    className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                      confirmText.toUpperCase() === 'DELETE'
                        ? 'bg-rose-600 text-white shadow-xl shadow-rose-500/30 active:scale-95'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" /> Confirm Removal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Aggregated Total Units */}
      <div className="mt-12 pt-12 border-t-2 border-slate-900 dark:border-white border-dashed px-2 flex flex-col sm:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center gap-4">
              <div className="bg-slate-900 dark:bg-white p-3 rounded-2xl shadow-xl">
                  <Activity className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-1">{t('total_user_units')}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">AGGREGATE FOR ALL SLOTS</span>
              </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                {formatNumber(totalUserUnits)} <span className="text-lg tracking-normal font-medium text-slate-400 uppercase">kWh</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default MeterReadings;
