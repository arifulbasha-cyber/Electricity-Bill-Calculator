
import React, { useState } from 'react';
import { TariffConfig } from '../types';
import { DEFAULT_TARIFF_CONFIG } from '../constants';
import { useLanguage } from '../i18n';
import { X, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface TariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TariffConfig;
  onSave: (newConfig: TariffConfig) => void;
}

const TariffModal: React.FC<TariffModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const { t } = useLanguage();
  const [tempConfig, setTempConfig] = useState<TariffConfig>(JSON.parse(JSON.stringify(config)));

  if (!isOpen) return null;

  const handleChange = (key: keyof TariffConfig, value: string | number) => {
    setTempConfig({ ...tempConfig, [key]: parseFloat(value.toString()) || 0 });
  };

  const handleSlabChange = (index: number, key: 'limit' | 'rate', value: string) => {
    const newSlabs = [...tempConfig.slabs];
    newSlabs[index] = { ...newSlabs[index], [key]: parseFloat(value) || 0 };
    setTempConfig({ ...tempConfig, slabs: newSlabs });
  };

  const addSlab = () => {
    const lastSlab = tempConfig.slabs[tempConfig.slabs.length - 1];
    setTempConfig({
      ...tempConfig,
      slabs: [...tempConfig.slabs, { limit: lastSlab ? lastSlab.limit + 100 : 100, rate: lastSlab ? lastSlab.rate : 0 }]
    });
  };

  const removeSlab = (index: number) => {
    const newSlabs = tempConfig.slabs.filter((_, i) => i !== index);
    setTempConfig({ ...tempConfig, slabs: newSlabs });
  };

  const handleSave = () => {
    onSave(tempConfig);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Reset all rates to default?')) {
      setTempConfig(DEFAULT_TARIFF_CONFIG);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transition-colors duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('tariff_settings')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('tariff_desc')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('demand_charge')}</label>
              <input
                type="number"
                value={tempConfig.demandCharge}
                onChange={(e) => handleChange('demandCharge', e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('meter_rent')}</label>
              <input
                type="number"
                value={tempConfig.meterRent}
                onChange={(e) => handleChange('meterRent', e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('vat_rate_percent')}</label>
              <div className="relative">
                <input
                  type="number"
                  value={tempConfig.vatRate * 100}
                  onChange={(e) => setTempConfig({...tempConfig, vatRate: (parseFloat(e.target.value) || 0) / 100})}
                  className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-sm pr-6"
                />
                <span className="absolute right-3 top-2 text-slate-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">{t('bkash_charge')}</label>
              <input
                type="number"
                value={tempConfig.bkashCharge}
                onChange={(e) => handleChange('bkashCharge', e.target.value)}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('slab_rates_config')}</label>
              <button 
                onClick={addSlab}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> {t('add_slab')}
              </button>
            </div>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 font-semibold">{t('limit')}</th>
                    <th className="px-4 py-2 font-semibold">{t('rate_per_unit')}</th>
                    <th className="px-2 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {tempConfig.slabs.map((slab, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="number"
                          value={slab.limit}
                          onChange={(e) => handleSlabChange(idx, 'limit', e.target.value)}
                          className="w-full rounded border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm py-1 focus:border-emerald-500 outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={slab.rate}
                          onChange={(e) => handleSlabChange(idx, 'rate', e.target.value)}
                          className="w-full rounded border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm py-1 focus:border-emerald-500 outline-none"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button 
                          onClick={() => removeSlab(idx)}
                          className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tempConfig.slabs.length === 0 && (
                 <div className="p-4 text-center text-slate-400 text-sm italic">No slabs defined. Add one to start.</div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <RotateCcw className="w-4 h-4" /> {t('reset_defaults')}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-500 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> {t('save_changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffModal;
