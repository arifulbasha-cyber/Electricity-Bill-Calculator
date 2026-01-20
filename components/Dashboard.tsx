
import React, { useState, useRef, useMemo } from 'react';
import { BillCalculationResult, BillConfig, MeterReading, Tenant, TariffConfig } from '../types';
import { useLanguage } from '../i18n';
import { ChevronUp, Share2, Loader2, Download, Activity, CreditCard, Clock, Calculator as CalcIcon, Calendar } from 'lucide-react';
import html2canvas from 'html2canvas';

interface DashboardProps {
  config: BillConfig;
  result: BillCalculationResult;
  mainMeter: MeterReading;
  meters: MeterReading[];
  onUpdateMeters: (meters: MeterReading[]) => void;
  onMainMeterUpdate: (reading: MeterReading) => void;
  onConfigUpdate: (config: BillConfig) => void;
  tenants: Tenant[];
  tariffConfig: TariffConfig;
  onSaveHistory?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ config, result, mainMeter, meters, onUpdateMeters, onMainMeterUpdate, onConfigUpdate, tenants, tariffConfig, onSaveHistory }) => {
  const { t, formatNumber, formatDateLocalized, translateMonth } = useLanguage();
  const [showResult, setShowResult] = useState(false);
  const [meterToDelete, setMeterToDelete] = useState<MeterReading | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const mainUnits = Math.max(0, mainMeter.current - mainMeter.previous);
  
  const bkashFee = config.includeBkashFee ? tariffConfig.bkashCharge : 0;
  const baseBill = result.totalCollection - result.lateFee - bkashFee;
  const totalSharedFixedCosts = tariffConfig.demandCharge + tariffConfig.meterRent + result.vatFixed + result.lateFee + bkashFee;
  const fixedCostPerUser = meters.length > 0 ? totalSharedFixedCosts / meters.length : 0;

  const userSubtotal = useMemo(() => 
    result.userCalculations.reduce((acc, u) => acc + u.totalPayable, 0), 
  [result.userCalculations]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleMainMeterChange = (key: keyof MeterReading, value: any) => {
    onMainMeterUpdate({ ...mainMeter, [key]: value });
  };

  const handleMeterChange = (id: string, key: keyof MeterReading, value: any) => {
    onUpdateMeters(meters.map(m => m.id === id ? { ...m, [key]: value } : m));
  };

  const handleConfigChange = (key: keyof BillConfig, value: any) => {
    onConfigUpdate({ ...config, [key]: value });
  };

  const startLongPress = (meter: MeterReading) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setMeterToDelete(meter);
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
      onUpdateMeters(meters.filter(m => m.id !== meterToDelete.id));
      setMeterToDelete(null);
      setShowResult(false);
    }
  };

  const captureCanvas = async (scale = 3) => {
    if (!resultsRef.current) return null;
    
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '380px'; 
    container.style.padding = '20px'; 
    container.style.backgroundColor = '#ffffff'; 
    
    const clone = resultsRef.current.cloneNode(true) as HTMLElement;
    const noPrintItems = clone.querySelectorAll('.no-capture');
    noPrintItems.forEach(el => el.remove());
    
    clone.classList.remove('dark');
    clone.style.backgroundColor = 'white';
    clone.style.color = 'black';
    const allDark = clone.querySelectorAll('.dark');
    allDark.forEach(el => el.classList.remove('dark'));
    
    container.appendChild(clone);
    document.body.appendChild(container);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const canvas = await html2canvas(container, {
      scale,
      backgroundColor: '#ffffff',
      width: 380,
      useCORS: true,
      logging: false
    });
    
    document.body.removeChild(container);
    return canvas;
  };

  const handleSaveDirectly = async () => {
    try {
      setIsGenerating(true);
      const canvas = await captureCanvas(3);
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Bill-${config.month}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);
          }
        }, "image/png");
      }
    } catch (e) {
      alert("Failed to save image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareImage = async () => {
    try {
      setIsSharing(true);
      const canvas = await captureCanvas(2.5); 
      if (!canvas) return;

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error("Could not create image blob");

      const fileName = `Bill-${config.month}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Electricity Bill - ${config.month}`,
          text: `Utility Bill Split for ${config.month}`
        });
      } else {
        handleSaveDirectly();
      }
    } catch (e: any) {
      console.error("Share attempt failed:", e);
      if (e.name !== 'AbortError') {
        alert("Share failed: " + (e.message || "Please try 'Save to Gallery' instead."));
      }
    } finally {
      setIsSharing(false);
    }
  };

  const billYear = config.dateGenerated.split('-')[0];
  const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="space-y-4 pb-32 w-full max-w-full overflow-x-hidden">
      
      {/* 1. Period & Date Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 mx-1">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950">
            <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest">Bill Month</label>
            <select
              value={config.month}
              onChange={(e) => { handleConfigChange('month', e.target.value); setShowResult(false); }}
              className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none appearance-none"
            >
              {months.map(m => <option key={m} value={m}>{translateMonth(m)}</option>)}
            </select>
          </div>
          <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950">
            <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest">Date</label>
            <input
              type="date"
              value={config.dateGenerated}
              onChange={(e) => { handleConfigChange('dateGenerated', e.target.value); setShowResult(false); }}
              className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Configuration Section (Toggles) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4 mx-1">
        <button 
          onClick={() => { handleConfigChange('includeBkashFee', !config.includeBkashFee); setShowResult(false); }}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <span className="text-base font-semibold text-slate-700 dark:text-slate-200">Include bKash Fee</span>
          </div>
          <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${config.includeBkashFee ? 'bg-indigo-900' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${config.includeBkashFee ? 'left-5.5' : 'left-0.5'}`}></div>
          </div>
        </button>

        <button 
          onClick={() => { handleConfigChange('includeLateFee', !config.includeLateFee); setShowResult(false); }}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="text-base font-semibold text-slate-700 dark:text-slate-200">Include Late Fee</span>
          </div>
          <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${config.includeLateFee ? 'bg-indigo-900' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${config.includeLateFee ? 'left-5.5' : 'left-0.5'}`}></div>
          </div>
        </button>
      </div>

      {/* Main Meter Entry */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 mx-1">
        <div className="flex justify-between items-center mb-4 px-1">
           <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Main Meter</h3>
           <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{formatNumber(mainUnits)} kWh</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
           <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950">
             <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">Previous</label>
             <input type="number" value={mainMeter.previous || ''} onChange={(e) => { handleMainMeterChange('previous', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-lg font-bold outline-none" />
           </div>
           <div className="relative border border-slate-100 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950">
             <label className="absolute -top-2 left-3 bg-white dark:bg-slate-900 px-1 text-[8px] font-black text-indigo-600 uppercase tracking-widest">Current</label>
             <input type="number" value={mainMeter.current || ''} onChange={(e) => { handleMainMeterChange('current', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-lg font-bold outline-none" />
           </div>
        </div>
      </div>

      {/* Sub-Meters Sheet Entry */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] px-2 py-5 shadow-sm border border-slate-100 dark:border-slate-800 mx-1 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-5 px-2">Sub-Meters</h3>
        
        <div className="grid grid-cols-[3.5fr_2fr_2fr] gap-1.5 mb-2.5 px-2">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Name</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Previous</div>
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Current</div>
        </div>

        <div className="space-y-2 px-1">
          {meters.map((meter) => (
            <div 
              key={meter.id} 
              onMouseDown={() => startLongPress(meter)} 
              onMouseUp={endLongPress} 
              onTouchStart={() => startLongPress(meter)} 
              onTouchEnd={endLongPress} 
              className="grid grid-cols-[3.5fr_2fr_2fr] gap-1.5 items-center group"
            >
              <input 
                type="text" 
                value={meter.name} 
                onChange={(e) => { handleMeterChange(meter.id, 'name', e.target.value); setShowResult(false); }} 
                className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-base font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-slate-200" 
                placeholder="Name" 
              />
              <input 
                type="number" 
                value={meter.previous || ''} 
                onChange={(e) => { handleMeterChange(meter.id, 'previous', parseFloat(e.target.value) || 0); setShowResult(false); }} 
                className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-0.5 text-center text-base font-bold text-slate-600 dark:text-slate-400 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" 
                placeholder="Prev" 
              />
              <input 
                type="number" 
                value={meter.current || ''} 
                onChange={(e) => { handleMeterChange(meter.id, 'current', parseFloat(e.target.value) || 0); setShowResult(false); }} 
                className="h-12 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-0.5 text-center text-base font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all" 
                placeholder="Curr" 
              />
            </div>
          ))}
        </div>

        {meters.length === 0 && (
          <div className="text-center py-6 text-slate-400 italic text-xs">No meters added yet.</div>
        )}
      </div>

      {!showResult && (
        <div className="px-1">
          <button 
            onClick={() => { setShowResult(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} 
            className="w-full h-14 bg-indigo-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2.5 mt-2"
          >
            <CalcIcon className="w-4 h-4" /> Generate Receipt
          </button>
        </div>
      )}

      {/* Result Section (Receipt) */}
      {showResult && (
        <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-4 mt-8 px-1">
          <div className="no-capture flex justify-between items-center px-4 mb-2">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Results</h2>
            <button onClick={() => setShowResult(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg"><ChevronUp className="w-4 h-4 text-slate-500" /></button>
          </div>

          <div 
            ref={resultsRef} 
            className="bg-white text-slate-900 p-8 shadow-2xl border border-slate-200 relative overflow-hidden font-mono text-[13px] leading-snug mx-auto max-w-[380px]"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* ATM Receipt Header */}
            <div className="text-center mb-6">
               <div>************************************</div>
               <div className="flex justify-between items-center font-black">
                 <span>*</span>
                 <span className="text-base">ELECTRICITY BILL RECEIPT</span>
                 <span>*</span>
               </div>
               <div>************************************</div>
            </div>

            <div className="mb-4">
               <div className="font-black text-base">{translateMonth(config.month).toUpperCase()} {billYear}</div>
               <div>DATE: {formatDateLocalized(config.dateGenerated)} {formattedTime}</div>
               <div className="mt-1">------------------------------------</div>
            </div>

            <div className="space-y-1 mb-4">
               <div className="flex justify-between font-black text-base">
                  <span>TOTAL BILL PAYABLE :</span>
                  <span>৳{formatNumber(result.totalCollection.toFixed(2))}</span>
               </div>
               <div className="pl-3">
                  Base Bill: ৳{formatNumber(baseBill.toFixed(2))}
               </div>
               <div className="mt-1">------------------------------------</div>
            </div>

            <div className="space-y-1 mb-4">
               <div className="text-center font-black">--- METER READINGS ---</div>
               <div className="flex justify-between">
                  <span>Main Units Used   :</span>
                  <span className="font-black">{formatNumber(mainUnits.toFixed(2))} kWh</span>
               </div>
               <div className="pl-3 opacity-70">({formatNumber(mainMeter.current.toFixed(2))} - {formatNumber(mainMeter.previous.toFixed(2))})</div>
               <div className="flex justify-between">
                  <span>Sub-meters Units  :</span>
                  <span className="font-black">{formatNumber(result.totalUnits.toFixed(2))} kWh</span>
               </div>
               <div className="mt-1">------------------------------------</div>
            </div>

            <div className="space-y-1 mb-4">
               <div className="text-center font-black">--- COST BREAKDOWN ---</div>
               <div className="flex justify-between">
                  <span>Energy Rate/Unit  :</span>
                  <span>৳{formatNumber(result.calculatedRate.toFixed(4))}</span>
               </div>
               <div className="flex justify-between">
                  <span>Demand Charge     :</span>
                  <span>৳{formatNumber(tariffConfig.demandCharge.toFixed(2))}</span>
               </div>
               <div className="flex justify-between">
                  <span>Meter Rent        :</span>
                  <span>৳{formatNumber(tariffConfig.meterRent.toFixed(2))}</span>
               </div>
               <div className="flex justify-between">
                  <span>Total VAT         :</span>
                  <span>৳{formatNumber(result.vatTotal.toFixed(2))}</span>
               </div>
               {/* Conditional Rows for bKash and Late Fees */}
               {config.includeLateFee && (
                 <div className="flex justify-between">
                    <span>Late Fee          :</span>
                    <span>৳{formatNumber(result.lateFee.toFixed(2))}</span>
                 </div>
               )}
               {config.includeBkashFee && (
                 <div className="flex justify-between">
                    <span>bKash Fee         :</span>
                    <span>৳{formatNumber(bkashFee.toFixed(2))}</span>
                 </div>
               )}
               <div className="flex justify-between">
                  <span>Shared Fixed Cost :</span>
                  <span>৳{formatNumber(totalSharedFixedCosts.toFixed(2))}</span>
               </div>
               <div className="flex justify-between font-black border-t border-dashed border-slate-300 pt-1 mt-1">
                  <span>Fixed Cost/User   :</span>
                  <span>৳{formatNumber(fixedCostPerUser.toFixed(2))}</span>
               </div>
               <div className="mt-1">------------------------------------</div>
            </div>

            <div className="mb-4">
               <div className="text-center font-black mb-2">--- INDIVIDUAL BILLS ---</div>
               <table className="w-full border-collapse">
                  <tbody>
                    {result.userCalculations.map((user) => (
                      <tr key={user.id} className="align-top">
                        <td className="py-2 pr-2">
                           <div className="font-black text-sm">{user.name.toUpperCase() || 'USER'}</div>
                           <div className="text-[13px] font-bold opacity-80 mt-1">({formatNumber(user.current.toFixed(1))} - {formatNumber(user.previous.toFixed(1))}) = {formatNumber(user.unitsUsed.toFixed(1))}u</div>
                        </td>
                        <td className="py-2 text-right font-black text-base whitespace-nowrap">৳{formatNumber(Math.round(user.totalPayable))}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-900 border-double">
                      <td className="py-2 font-black">USER TOTAL BILL</td>
                      <td className="py-2 text-right font-black text-lg">৳{formatNumber(Math.round(userSubtotal))}</td>
                    </tr>
                  </tbody>
               </table>
               <div className="mt-1">------------------------------------</div>
            </div>

            <div className="text-center font-black mt-6 mb-2">
               THANK YOU FOR YOUR PAYMENT
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white no-capture" style={{ backgroundImage: 'linear-gradient(135deg, #f1f5f9 25%, transparent 25%), linear-gradient(225deg, #f1f5f9 25%, transparent 25%)', backgroundPosition: '0 0', backgroundSize: '8px 8px' }}></div>
          </div>

          <div className="max-w-[380px] mx-auto space-y-3 no-capture px-4">
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleSaveDirectly} 
                  disabled={isGenerating}
                  className="h-14 bg-indigo-900 text-white rounded-xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                   {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Save
                </button>
                <button 
                  onClick={handleShareImage} 
                  disabled={isSharing}
                  className="h-14 bg-slate-900 text-white rounded-xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                   {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />} Share
                </button>
             </div>
             <button 
                onClick={onSaveHistory}
                className="w-full h-12 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all"
             >
                <Activity className="w-4 h-4" /> Finalize & Sync
             </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {meterToDelete && (
        <div onClick={() => setMeterToDelete(null)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-7 shadow-2xl border border-rose-500/20 text-center">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-4 tracking-widest">Confirm Delete</h3>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Type <span className="text-rose-500 font-black">DELETE</span> to confirm.</p>
              <input type="text" autoFocus placeholder="DELETE" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="w-full h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-500/10 text-center text-sm font-black outline-none uppercase" />
              <button disabled={confirmText.toUpperCase() !== 'DELETE'} onClick={handleConfirmDelete} className="w-full h-12 rounded-xl bg-rose-600 text-white font-black text-xs uppercase tracking-widest disabled:opacity-50">Confirm removal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
