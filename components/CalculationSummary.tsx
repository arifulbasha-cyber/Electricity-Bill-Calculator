
import React, { useRef, useState } from 'react';
import { BillCalculationResult, BillConfig, MeterReading, TariffConfig } from '../types';
import { FileText, Printer, Image as ImageIcon, Save, Loader2, X, FileDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useLanguage } from '../i18n';

interface CalculationSummaryProps {
  result: BillCalculationResult;
  config: BillConfig;
  mainMeter: MeterReading;
  meters: MeterReading[];
  onSaveHistory: () => void;
  tariffConfig: TariffConfig;
  isHistorical?: boolean;
  onClose?: () => void;
}

const CalculationSummary: React.FC<CalculationSummaryProps> = ({ result, config, mainMeter, meters, onSaveHistory, tariffConfig, isHistorical = false, onClose }) => {
  const { t, formatNumber, translateMonth, formatDateLocalized } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Constants for subtext
  const DEMAND_CHARGE = tariffConfig.demandCharge;
  const METER_RENT = tariffConfig.meterRent;

  const handlePrint = () => {
    window.print();
  };

  const getCaptureCanvas = async (scale: number = 3) => {
      if (!reportRef.current) return null;
      
      const element = reportRef.current;
      const clone = element.cloneNode(true) as HTMLElement;

      const bumpTextSize = (el: HTMLElement) => {
        const classMap: Record<string, string> = {
          'text-[10px]': 'text-sm',
          'text-xs': 'text-base',
          'text-sm': 'text-lg',
          'text-base': 'text-xl',
          'text-lg': 'text-2xl',
          'text-xl': 'text-3xl',
          'text-2xl': 'text-4xl',
          'text-3xl': 'text-5xl',
          'sm:text-xs': 'sm:text-base',
          'sm:text-sm': 'sm:text-lg',
          'sm:text-base': 'sm:text-xl',
        };

        const classes = el.className.split(' ');
        const newClasses = classes.map(c => classMap[c] || c);
        el.className = newClasses.join(' ');
      };

      const allElements = clone.querySelectorAll('*');
      allElements.forEach(node => {
        if (node instanceof HTMLElement) bumpTextSize(node);
      });
      bumpTextSize(clone); 

      const scrollables = clone.querySelectorAll('.overflow-x-auto');
      scrollables.forEach(el => {
        (el as HTMLElement).style.overflow = 'visible';
        (el as HTMLElement).style.display = 'block';
      });
      
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '768px';
      container.style.backgroundColor = '#ffffff'; 
      
      clone.classList.remove('dark');
      const allDark = clone.querySelectorAll('.dark');
      allDark.forEach(el => el.classList.remove('dark'));
      
      const allText = clone.querySelectorAll('*');
      allText.forEach(el => {
         if (el instanceof HTMLElement) {
             if (el.classList.contains('text-white')) {
                 el.classList.remove('text-white');
                 el.classList.add('text-slate-900');
             }
             if (el.classList.contains('text-slate-200') || el.classList.contains('text-slate-300')) {
                 el.classList.remove('text-slate-200', 'text-slate-300');
                 el.classList.add('text-slate-600');
             }
         }
      });

      container.appendChild(clone);
      document.body.appendChild(container);

      await new Promise(resolve => setTimeout(resolve, 150));
      
      const canvas = await html2canvas(clone, {
        scale: scale, 
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        width: 768,
        windowWidth: 768 
      });
      
      document.body.removeChild(container);
      return canvas;
  };

  const handleSaveImage = async () => {
    try {
      setIsGeneratingImage(true);
      const canvas = await getCaptureCanvas(3);
      if (!canvas) return;
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `Electricity-Bill-${config.month}-${config.dateGenerated}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate image", error);
      alert("Failed to save image. Please try again.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSavePDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const canvas = await getCaptureCanvas(2); 
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Electricity-Bill-${config.month}-${config.dateGenerated}.pdf`);
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Failed to save PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const mainMeterUnits = Math.max(0, mainMeter.current - mainMeter.previous);

  return (
    <div className="bg-white dark:bg-slate-900 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:m-0 print:p-0 w-full transition-colors duration-200">
       {/* Actions Bar (No Print) */}
       <div className="bg-emerald-50/80 dark:bg-slate-900/80 backdrop-blur px-4 sm:px-6 py-4 border-b border-emerald-100 dark:border-slate-800 flex flex-wrap gap-3 justify-between items-center no-print">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm sm:text-base">
             <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> {t('bill_report')} {isHistorical && <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs px-2 py-0.5 rounded-full ml-2">Viewing History</span>}
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onClose && isHistorical && (
               <button 
                  onClick={onClose}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors shadow-sm"
               >
                  <X className="w-4 h-4" /> <span className="sm:hidden lg:inline">{t('cancel')}</span>
               </button>
            )}

            <button 
              onClick={handleSaveImage} 
              disabled={isGeneratingImage || isGeneratingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              title={`${t('save_image')} (Tablet View)`}
            >
               {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} 
               <span className="sm:hidden lg:inline">{t('save_image')}</span>
            </button>

            <button 
              onClick={handleSavePDF} 
              disabled={isGeneratingImage || isGeneratingPdf}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              title="Save as PDF"
            >
               {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />} 
               <span className="sm:hidden lg:inline">PDF</span>
            </button>

            <button 
              onClick={handlePrint} 
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
               <Printer className="w-4 h-4" /> <span className="sm:hidden lg:inline">{t('print')}</span>
            </button>
          </div>
       </div>

       {/* Printable Content */}
       <div ref={reportRef} className="p-4 sm:p-8 space-y-6 sm:space-y-10 print:p-0 print:space-y-6 bg-white dark:bg-slate-900 min-h-[500px] print:min-h-0 transition-colors duration-200">
          
          {/* Header */}
          <div className="text-center border-b-2 border-emerald-800 dark:border-emerald-100 pb-4 sm:pb-6 print:pb-4">
             <h1 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 sm:mb-4 print:text-2xl print:mb-2">{t('tmss_house_bill')}</h1>
             <div className="flex justify-between max-w-2xl mx-auto text-sm font-medium text-slate-600 dark:text-slate-300 pt-2 px-1 sm:px-4">
                <div className="flex flex-col items-start">
                   <span className="text-[10px] sm:text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">{t('bill_month')}</span>
                   <span className="text-slate-900 dark:text-white text-base sm:text-lg print:text-base">{translateMonth(config.month)}</span>
                </div>
                 <div className="flex flex-col items-end">
                   <span className="text-[10px] sm:text-xs uppercase text-slate-400 dark:text-slate-500 font-bold tracking-wider">{t('date_generated')}</span>
                   <span className="text-slate-900 dark:text-white text-base sm:text-lg print:text-base">{formatDateLocalized(config.dateGenerated)}</span>
                </div>
             </div>
          </div>

          {/* New Simple Result Card - Matching Reference Image Style */}
          <div className="animate-in fade-in duration-500">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-4 max-w-sm mx-auto print:border-slate-200">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-sm font-bold uppercase tracking-wider">{t('total_units')}:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">{formatNumber(result.totalUnits.toFixed(2))} kWh</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-sm font-bold uppercase tracking-wider">{t('energy_cost')}:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">৳{formatNumber((config.totalBillPayable - result.vatTotal - DEMAND_CHARGE - METER_RENT).toFixed(2))}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-sm font-bold uppercase tracking-wider">{t('fixed_charges')}:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">৳{formatNumber((DEMAND_CHARGE + METER_RENT).toFixed(2))}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="text-sm font-bold uppercase tracking-wider">VAT (5%):</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">৳{formatNumber(result.vatTotal.toFixed(2))}</span>
                </div>
                
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-4"></div>

                <div className="text-center pt-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                      Final Bill: ৳{formatNumber(Math.round(config.totalBillPayable))}
                    </span>
                </div>
              </div>
          </div>

          {/* Meter Readings Table - Shown ONLY in History or if relevant */}
          {isHistorical && (
            <div className="animate-in fade-in duration-500 delay-150">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 tracking-tight">{t('meter_readings')}</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 print:border-slate-200">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 print:bg-slate-50">
                      <tr className="text-slate-500 dark:text-slate-400 uppercase font-black text-[10px]">
                          <th className="px-4 py-3">{t('name')}</th>
                          <th className="px-4 py-3 text-center">{t('meter_no')}</th>
                          <th className="px-4 py-3 text-right">{t('previous')}</th>
                          <th className="px-4 py-3 text-right">{t('current')}</th>
                          <th className="px-4 py-3 text-right">{t('unit')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200">
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20 font-bold">
                          <td className="px-4 py-3 text-slate-900 dark:text-white">{t('main_meter')}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{formatNumber(mainMeter.meterNo)}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatNumber(mainMeter.previous)}</td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{formatNumber(mainMeter.current)}</td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatNumber(mainMeterUnits)}</td>
                      </tr>
                      {meters.map(m => {
                          const u = Math.max(0, m.current - m.previous);
                          return (
                            <tr key={m.id}>
                              <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{t(m.name)}</td>
                              <td className="px-4 py-2.5 text-center text-slate-500 dark:text-slate-400">{formatNumber(m.meterNo)}</td>
                              <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{formatNumber(m.previous)}</td>
                              <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">{formatNumber(m.current)}</td>
                              <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">{formatNumber(u)}</td>
                            </tr>
                          );
                      })}
                      <tr className="font-bold uppercase bg-emerald-50/20 dark:bg-black">
                          <td colSpan={4} className="px-4 py-3 text-right text-[10px] tracking-widest text-slate-500 dark:text-slate-400">{t('total_user_units')}</td>
                          <td className="px-4 py-3 text-right text-slate-900 dark:text-white">{formatNumber(result.totalUnits)}</td>
                      </tr>
                    </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Individual Bills - Final Split (Always Shown) */}
          <div className="animate-in fade-in duration-500 delay-300">
             <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-700 pb-2 mb-4 tracking-tight">{t('final_split')}</h3>
             <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 print:border-slate-300">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-emerald-50/30 dark:bg-slate-800 print:bg-slate-100 text-[10px] sm:text-sm">
                     <tr className="text-slate-500 dark:text-slate-400 uppercase">
                        <th className="pl-2 pr-1 py-2 sm:px-4 sm:py-3 font-semibold text-left">{t('user')}</th>
                        <th className="px-1 py-2 sm:px-4 sm:py-3 font-semibold text-right">{t('units')}</th>
                        <th className="px-1 py-2 sm:px-4 sm:py-3 font-semibold text-right"><span className="sm:hidden">{t('engy')}</span><span className="hidden sm:inline">{t('energy_cost')}</span></th>
                        <th className="px-1 py-2 sm:px-4 sm:py-3 font-semibold text-right"><span className="sm:hidden">{t('fixed')}</span><span className="hidden sm:inline">{t('fixed_cost')}</span></th>
                        <th className="pl-1 pr-2 py-2 sm:px-4 sm:py-3 font-semibold text-right text-emerald-700 dark:text-emerald-400 print:text-black">{t('bill')}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-slate-200 text-xs sm:text-sm">
                     {result.userCalculations.map((user) => (
                        <tr key={user.id}>
                           <td className="pl-2 pr-1 py-2 sm:px-4 sm:py-2 font-medium text-slate-700 dark:text-slate-300">{t(user.name)}</td>
                           <td className="px-1 py-2 sm:px-4 sm:py-2 text-right text-slate-600 dark:text-slate-400">{formatNumber(user.unitsUsed)}</td>
                           <td className="px-1 py-2 sm:px-4 sm:py-2 text-right text-slate-600 dark:text-slate-400">{formatNumber(Math.round(user.energyCost))}</td>
                           <td className="px-1 py-2 sm:px-4 sm:py-2 text-right text-slate-600 dark:text-slate-400">{formatNumber(Math.round(user.fixedCost))}</td>
                           <td className="pl-1 pr-2 py-2 sm:px-4 sm:py-2 text-right font-bold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base print:text-black">{formatNumber(Math.round(user.totalPayable))}</td>
                        </tr>
                     ))}
                     <tr className="bg-emerald-900 dark:bg-black font-bold text-white border-t-2 border-emerald-800 dark:border-slate-700 print:bg-emerald-50 print:text-slate-900 print:border-slate-300 h-10 sm:h-12 leading-none">
                        <td colSpan={4} className="pl-2 pr-1 sm:px-4 text-right uppercase text-[10px] sm:text-xs tracking-wider text-emerald-100 dark:text-slate-500 whitespace-nowrap align-middle" style={{ verticalAlign: 'middle' }}>
                            <span className="sm:hidden">{t('total')}</span><span className="hidden sm:inline">{t('total_collection')}</span>
                        </td>
                        <td className="pl-1 pr-2 sm:px-4 text-right text-emerald-400 print:text-emerald-900 align-middle py-2 sm:py-3" style={{ verticalAlign: 'middle' }}>{formatNumber(Math.round(result.totalCollection))}</td>
                     </tr>
                  </tbody>
               </table>
             </div>
          </div>
       </div>
    </div>
  );
};

export default CalculationSummary;
