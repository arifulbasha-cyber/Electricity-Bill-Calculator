
import React, { useState, useRef, useMemo } from 'react';
import { BillCalculationResult, BillConfig, MeterReading, Tenant, TariffConfig } from '../types';
import { useLanguage } from '../i18n';
import { Calculator, ChevronUp, Save, Share2, Loader2, Download, Activity, Zap } from 'lucide-react';
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
  const totalSubUnits = useMemo(() => meters.reduce((acc, m) => acc + Math.max(0, m.current - m.previous), 0), [meters]);
  const systemLoss = Math.max(0, mainUnits - totalSubUnits);

  const bkashFee = config.includeBkashFee ? tariffConfig.bkashCharge : 0;
  const baseBill = result.totalCollection - result.lateFee - bkashFee;
  const totalSharedFixedCosts = tariffConfig.demandCharge + tariffConfig.meterRent + result.vatFixed + result.lateFee + bkashFee;
  const fixedCostPerUser = meters.length > 0 ? totalSharedFixedCosts / meters.length : 0;

  const userSubtotal = useMemo(() => 
    result.userCalculations.reduce((acc, u) => acc + u.totalPayable, 0), 
  [result.userCalculations]);

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
      const canvas = await captureCanvas(3);
      if (!canvas) return;
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Bill-${config.month}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Bill Split`, text: `Bill for ${config.month}` });
        } else {
          handleSaveDirectly();
        }
      });
    } catch (e) {} finally { setIsSharing(false); }
  };

  const billYear = config.dateGenerated.split('-')[0].slice(-2);

  return (
    <div className="space-y-3 pb-32 max-w-2xl mx-auto">
      
      {/* Input Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Entry</h3>
          <span className="text-[10px] font-black text-emerald-500 uppercase">{formatNumber(mainUnits)} kWh Main</span>
        </div>
        <div className="grid grid-cols-12 gap-2">
           <div className="col-span-4 relative border border-slate-100 dark:border-slate-800 rounded-lg p-1.5 h-10 flex items-center bg-slate-50 dark:bg-slate-950">
             <label className="absolute -top-1.5 left-2 bg-white dark:bg-slate-900 px-1 text-[7px] font-black text-slate-400 uppercase tracking-widest">Date</label>
             <input type="date" value={config.dateGenerated} onChange={(e) => { handleConfigChange('dateGenerated', e.target.value); setShowResult(false); }} className="w-full bg-transparent text-[11px] font-bold outline-none" />
           </div>
           <div className="col-span-4 relative border border-slate-100 dark:border-slate-800 rounded-lg p-1.5 h-10 flex items-center bg-slate-50 dark:bg-slate-950">
             <label className="absolute -top-1.5 left-2 bg-white dark:bg-slate-900 px-1 text-[7px] font-black text-slate-400 uppercase tracking-widest">Previous</label>
             <input type="number" value={mainMeter.previous || ''} onChange={(e) => { handleMainMeterChange('previous', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-[11px] font-bold outline-none" />
           </div>
           <div className="col-span-4 relative border border-slate-100 dark:border-slate-800 rounded-lg p-1.5 h-10 flex items-center bg-slate-50 dark:bg-slate-950">
             <label className="absolute -top-1.5 left-2 bg-white dark:bg-slate-900 px-1 text-[7px] font-black text-emerald-500 uppercase tracking-widest">Current</label>
             <input type="number" value={mainMeter.current || ''} onChange={(e) => { handleMainMeterChange('current', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-[11px] font-bold outline-none" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { handleConfigChange('includeBkashFee', !config.includeBkashFee); setShowResult(false); }} className={`h-11 rounded-xl px-4 flex items-center justify-between border ${config.includeBkashFee ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
           <span className="text-[9px] font-black uppercase">bKash</span>
           <div className={`w-7 h-4 rounded-full relative transition-colors ${config.includeBkashFee ? 'bg-white/30' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.includeBkashFee ? 'left-3.5' : 'left-0.5'}`}></div>
           </div>
        </button>
        <button onClick={() => { handleConfigChange('includeLateFee', !config.includeLateFee); setShowResult(false); }} className={`h-11 rounded-xl px-4 flex items-center justify-between border ${config.includeLateFee ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
           <span className="text-[9px] font-black uppercase">Late Fee</span>
           <div className={`w-7 h-4 rounded-full relative transition-colors ${config.includeLateFee ? 'bg-white/30' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${config.includeLateFee ? 'left-3.5' : 'left-0.5'}`}></div>
           </div>
        </button>
      </div>

      <div className="space-y-1.5">
        {meters.map((meter, index) => (
          <div key={meter.id} onMouseDown={() => startLongPress(meter)} onMouseUp={endLongPress} onTouchStart={() => startLongPress(meter)} onTouchEnd={endLongPress} className="bg-white dark:bg-slate-900 rounded-xl p-2.5 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-indigo-600">{index+1}</span>
            <div className="flex-1 grid grid-cols-12 gap-2 items-center">
              <input type="text" value={meter.name} onChange={(e) => { handleMeterChange(meter.id, 'name', e.target.value); setShowResult(false); }} className="col-span-4 h-9 bg-transparent text-xs font-bold outline-none border-b border-slate-50 dark:border-slate-800" placeholder="User" />
              <div className="col-span-3 relative h-9 flex items-center border-b border-slate-50 dark:border-slate-800">
                <label className="absolute -top-1.5 left-0 text-[7px] font-black text-slate-400 uppercase">Prev</label>
                <input type="number" value={meter.previous || ''} onChange={(e) => { handleMeterChange(meter.id, 'previous', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-xs font-bold text-center" />
              </div>
              <div className="col-span-3 relative h-9 flex items-center border-b border-slate-50 dark:border-slate-800">
                <label className="absolute -top-1.5 left-0 text-[7px] font-black text-emerald-500 uppercase">Curr</label>
                <input type="number" value={meter.current || ''} onChange={(e) => { handleMeterChange(meter.id, 'current', parseFloat(e.target.value) || 0); setShowResult(false); }} className="w-full bg-transparent text-xs font-bold text-center" />
              </div>
              <div className="col-span-2 text-right">
                <span className="text-[7px] block font-black text-slate-400 uppercase leading-none">Units</span>
                <span className="text-xs font-black text-indigo-600 font-mono">{formatNumber(Math.max(0, meter.current - meter.previous))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!showResult && (
        <button onClick={() => { setShowResult(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} className="w-full h-14 bg-indigo-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
          <Calculator className="w-5 h-5" /> Calculate Split Bill
        </button>
      )}

      {/* ATM Receipt Style Result Section */}
      {showResult && (
        <div className="animate-in slide-in-from-bottom-6 duration-500 space-y-4">
          
          <div className="no-capture flex justify-between items-center px-2 pt-6 mb-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Digital Receipt</h2>
            <button onClick={() => setShowResult(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><ChevronUp className="w-4 h-4 text-slate-500" /></button>
          </div>

          <div 
            ref={resultsRef} 
            className="bg-white text-slate-900 p-6 shadow-2xl border-x border-t border-slate-200 relative overflow-hidden font-mono text-sm leading-relaxed mx-auto max-w-[380px]"
            style={{ backgroundImage: 'radial-gradient(#e2e8f0 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}
          >
            {/* ATM Receipt Header */}
            <div className="text-center space-y-2 mb-6">
               <div className="flex justify-center mb-1"><Zap className="w-8 h-8 text-slate-900" /></div>
               <h1 className="text-lg font-black uppercase tracking-tighter">Utility Transaction</h1>
               <div className="text-[10px] font-bold border-y border-dashed border-slate-300 py-1">
                 {translateMonth(config.month).toUpperCase()} {billYear} • {formatDateLocalized(config.dateGenerated)}
               </div>
            </div>

            {/* Main Billing Totals */}
            <div className="space-y-4 mb-6">
               <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2">
                  <span className="text-[10px] font-black uppercase">Total Collection</span>
                  <span className="text-2xl font-black">৳{formatNumber(result.totalCollection.toFixed(2))}</span>
               </div>
               
               <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2">
                  <span className="text-[10px] font-black uppercase">Base Energy Bill</span>
                  <span className="text-2xl font-black">৳{formatNumber(baseBill.toFixed(2))}</span>
               </div>
            </div>

            {/* Reading Details */}
            <div className="space-y-1 mb-6 text-[11px]">
               <div className="flex justify-between">
                  <span>Main Prev Reading</span>
                  <span>{formatNumber(mainMeter.previous.toFixed(1))}</span>
               </div>
               <div className="flex justify-between">
                  <span>Main Curr Reading</span>
                  <span>{formatNumber(mainMeter.current.toFixed(1))}</span>
               </div>
               <div className="flex justify-between font-black border-t border-dashed border-slate-300 pt-1 mt-1">
                  <span>Main Total Energy</span>
                  <span>{formatNumber(mainUnits.toFixed(1))} kWh</span>
               </div>
               <div className="flex justify-between">
                  <span>Total User Units</span>
                  <span>{formatNumber(result.totalUnits.toFixed(1))} kWh</span>
               </div>
               <div className="flex justify-between">
                  <span>Calculated Rate/Unit</span>
                  <span>৳{formatNumber(result.calculatedRate.toFixed(2))}</span>
               </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-1 mb-6 text-[10px] uppercase font-bold text-slate-600">
               <div className="flex justify-between italic">
                  <span>Demand Charge</span>
                  <span>{formatNumber(tariffConfig.demandCharge.toFixed(2))}</span>
               </div>
               <div className="flex justify-between italic">
                  <span>Meter Rent</span>
                  <span>{formatNumber(tariffConfig.meterRent.toFixed(2))}</span>
               </div>
               <div className="flex justify-between italic">
                  <span>Fixed VAT (5%)</span>
                  <span>{formatNumber(result.vatFixed.toFixed(2))}</span>
               </div>
               <div className="flex justify-between italic">
                  <span>Total VAT Amt</span>
                  <span>{formatNumber(result.vatTotal.toFixed(2))}</span>
               </div>
               <div className="flex justify-between italic">
                  <span>Late Fee Applied</span>
                  <span>{formatNumber(result.lateFee.toFixed(2))}</span>
               </div>
               <div className="flex justify-between italic">
                  <span>bKash Charge</span>
                  <span>{formatNumber(bkashFee.toFixed(2))}</span>
               </div>
               <div className="flex justify-between text-slate-900 font-black border-t border-slate-300 pt-1 mt-1">
                  <span>Fixed Cost / User</span>
                  <span>৳{formatNumber(fixedCostPerUser.toFixed(2))}</span>
               </div>
            </div>

            {/* Individual Breakdown Table */}
            <div className="mb-6">
               <div className="text-[10px] font-black uppercase text-center border-b border-slate-300 mb-2">User Assignments</div>
               <table className="w-full text-[11px]">
                  <tbody>
                    {result.userCalculations.map((user) => (
                      <tr key={user.id} className="border-b border-dashed border-slate-200">
                        <td className="py-2 pr-2 font-black">
                           <div className="leading-tight">{user.name.toUpperCase() || 'USER'}</div>
                           <div className="text-[8px] font-normal opacity-60">P:{formatNumber(user.previous.toFixed(1))} | C:{formatNumber(user.current.toFixed(1))}</div>
                        </td>
                        <td className="py-2 text-right opacity-70 whitespace-nowrap">{formatNumber(user.unitsUsed.toFixed(1))}u</td>
                        <td className="py-2 text-right font-black">৳{formatNumber(Math.round(user.totalPayable))}</td>
                      </tr>
                    ))}
                    {/* User Collection Subtotal row */}
                    <tr className="border-t-2 border-slate-900">
                      <td colSpan={2} className="py-2 font-black uppercase text-[10px] tracking-tighter">User Total Bill</td>
                      <td className="py-2 text-right font-black text-indigo-900">৳{formatNumber(Math.round(userSubtotal))}</td>
                    </tr>
                  </tbody>
               </table>
            </div>

            <div className="text-center text-[10px] font-black uppercase border-t-4 border-double border-slate-900 pt-4 pb-2">
               Thank you for your payment
            </div>
            
            {/* Visual jagged bottom for receipt effect */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-white no-capture" style={{ backgroundImage: 'linear-gradient(135deg, #f1f5f9 25%, transparent 25%), linear-gradient(225deg, #f1f5f9 25%, transparent 25%)', backgroundPosition: '0 0', backgroundSize: '10px 10px' }}></div>
          </div>

          {/* Action Buttons */}
          <div className="max-w-[380px] mx-auto space-y-3 no-capture">
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleSaveDirectly} 
                  disabled={isGenerating}
                  className="h-14 bg-indigo-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                   {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} Save to Gallery
                </button>
                <button 
                  onClick={handleShareImage} 
                  disabled={isSharing}
                  className="h-14 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                >
                   {isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />} Share
                </button>
             </div>
             <button 
                onClick={onSaveHistory}
                className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all"
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
