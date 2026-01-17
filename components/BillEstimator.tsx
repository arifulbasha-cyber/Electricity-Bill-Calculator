
import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { useLanguage } from '../i18n';
import { TariffConfig } from '../types';

interface BillEstimatorProps {
    tariffConfig: TariffConfig;
}

const BillEstimator: React.FC<BillEstimatorProps> = ({ tariffConfig }) => {
  const { t, formatNumber } = useLanguage();
  const [activeTab, setActiveTab] = useState<'forward' | 'reverse'>('forward');
  const [units, setUnits] = useState<number | string>('');
  const [targetBill, setTargetBill] = useState<number | string>('');
  const [showResult, setShowResult] = useState(false);

  const DEMAND_CHARGE = tariffConfig.demandCharge;
  const METER_RENT = tariffConfig.meterRent;
  const VAT_RATE = tariffConfig.vatRate;
  const SLABS = tariffConfig.slabs;

  const calculateBill = (u: number) => {
    let remainingUnits = u;
    let energyCost = 0;
    let previousLimit = 0;

    for (const slab of SLABS) {
      const slabSize = slab.limit - previousLimit;
      const unitsInSlab = Math.min(remainingUnits, slabSize);
      
      if (unitsInSlab > 0) {
        energyCost += unitsInSlab * slab.rate;
        remainingUnits -= unitsInSlab;
      }
      previousLimit = slab.limit;
      if (remainingUnits <= 0) break;
    }

    if (remainingUnits > 0 && SLABS.length > 0) {
        const lastRate = SLABS[SLABS.length - 1].rate;
        energyCost += remainingUnits * lastRate;
    }

    const totalSubjectToVat = energyCost + DEMAND_CHARGE + METER_RENT;
    const vatAmount = totalSubjectToVat * VAT_RATE;
    const totalPayable = totalSubjectToVat + vatAmount;

    return {
      energyCost,
      totalSubjectToVat,
      vatAmount,
      totalPayable
    };
  };

  const calculateUnitsDetailed = (bill: number) => {
    const vatAmount = (bill * VAT_RATE) / (1 + VAT_RATE);
    const taxableBase = bill - vatAmount;
    const energyCost = taxableBase - (DEMAND_CHARGE + METER_RENT);

    let remainingCost = energyCost;
    let totalUnits = 0;
    let previousLimit = 0;
    
    if (energyCost > 0) {
      for (let i = 0; i < SLABS.length; i++) {
          const slab = SLABS[i];
          const slabSize = slab.limit - previousLimit;
          const maxCostForSlab = slabSize * slab.rate;

          if (remainingCost >= maxCostForSlab) {
              totalUnits += slabSize;
              remainingCost -= maxCostForSlab;
          } else {
              const unitsInSlab = remainingCost / slab.rate;
              totalUnits += unitsInSlab;
              remainingCost = 0;
              break;
          }
          previousLimit = slab.limit;
      }
      
      if (remainingCost > 0.01 && SLABS.length > 0) {
           const lastRate = SLABS[SLABS.length - 1].rate;
           totalUnits += remainingCost / lastRate;
      }
    }

    return { totalUnits, energyCost, vatAmount };
  };

  const currentUnits = typeof units === 'number' ? units : 0;
  const forwardResult = calculateBill(currentUnits);
  
  const currentBillInput = typeof targetBill === 'number' ? targetBill : 0;
  const reverseResult = calculateUnitsDetailed(currentBillInput);

  const handleCalculate = () => {
    if (activeTab === 'forward' && units !== '') setShowResult(true);
    if (activeTab === 'reverse' && targetBill !== '') setShowResult(true);
  };

  const resetResult = () => setShowResult(false);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { setActiveTab('forward'); resetResult(); }}
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'forward' 
                ? 'text-indigo-900 dark:text-indigo-400 border-indigo-900' 
                : 'text-slate-400 border-transparent'
            }`}
          >
            Bill from Units
          </button>
          <button
            onClick={() => { setActiveTab('reverse'); resetResult(); }}
            className={`flex-1 py-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'reverse' 
                ? 'text-indigo-900 dark:text-indigo-400 border-indigo-900' 
                : 'text-slate-400 border-transparent'
            }`}
          >
            Units from Bill
          </button>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'forward' ? (
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl p-3">
              <label className="absolute -top-2.5 left-4 bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Enter Units (kWh)
              </label>
              <input
                type="number"
                value={units}
                onChange={(e) => { setUnits(e.target.value === '' ? '' : parseFloat(e.target.value)); resetResult(); }}
                onFocus={(e) => e.target.select()}
                className="w-full h-10 bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none"
                placeholder=""
              />
            </div>
          ) : (
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-2xl p-3">
              <label className="absolute -top-2.5 left-4 bg-white dark:bg-slate-900 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Enter Total Bill (৳)
              </label>
              <input
                type="number"
                value={targetBill}
                onChange={(e) => { setTargetBill(e.target.value === '' ? '' : parseFloat(e.target.value)); resetResult(); }}
                onFocus={(e) => e.target.select()}
                className="w-full h-10 bg-transparent text-xl font-bold text-slate-900 dark:text-white outline-none"
                placeholder=""
              />
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full h-14 bg-indigo-900 text-white rounded-xl font-bold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center"
          >
            {activeTab === 'forward' ? 'Calculate Bill' : 'Calculate Units'}
          </button>

          {showResult && (
            <div className="pt-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 space-y-4">
                {activeTab === 'forward' ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Units:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatNumber(currentUnits.toFixed(2))} kWh</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Energy Cost:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber(forwardResult.energyCost.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Fixed Charges:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber((DEMAND_CHARGE + METER_RENT).toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">VAT (5%):</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber(forwardResult.vatAmount.toFixed(2))}</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-4"></div>
                    <div className="text-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        Final Bill: ৳{formatNumber(Math.round(forwardResult.totalPayable))}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Total Bill:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber(currentBillInput.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Energy Base:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber(reverseResult.energyCost.toFixed(2))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">VAT Component:</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">৳{formatNumber(reverseResult.vatAmount.toFixed(2))}</span>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 my-4"></div>
                    <div className="text-center">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        Estimated Units: {formatNumber(reverseResult.totalUnits.toFixed(2))} kWh
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillEstimator;
