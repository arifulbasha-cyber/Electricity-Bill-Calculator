
import React, { useState } from 'react';
import { Tenant } from '../types';
import { useLanguage } from '../i18n';
import { Save, Plus, Trash2, Phone, Mail, Edit2, Users, ArrowLeft } from 'lucide-react';

interface TenantManagerProps {
  tenants: Tenant[];
  onUpdateTenants: (tenants: Tenant[]) => void;
}

const TenantManager: React.FC<TenantManagerProps> = ({ tenants, onUpdateTenants }) => {
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Tenant>>({});
  const [isAdding, setIsAdding] = useState(false);

  const startAdd = () => {
    setEditingId(null);
    setForm({});
    setIsAdding(true);
  };

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setForm(tenant);
    setIsAdding(true);
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this tenant?')) {
      onUpdateTenants(tenants.filter(x => x.id !== id));
    }
  };

  const handleSave = () => {
    if (!form.name) return;

    if (editingId) {
      const updated = tenants.map(t => t.id === editingId ? { ...t, ...form } as Tenant : t);
      onUpdateTenants(updated);
    } else {
      const newTenant: Tenant = {
        id: Date.now().toString(),
        name: form.name,
        phone: form.phone,
        email: form.email
      };
      onUpdateTenants([...tenants, newTenant]);
    }
    cancelEdit();
  };

  return (
    <div className="bg-white dark:bg-slate-900 w-full rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-200 overflow-hidden">
      {/* Page Header - Deepened */}
      <div className="p-8 border-b border-emerald-700/10 dark:border-emerald-500/10 bg-emerald-600 dark:bg-emerald-900/40">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{t('tenant_manager')}</h2>
            <p className="text-sm font-bold text-emerald-100 mt-1 uppercase tracking-widest">{t('tenant_desc')}</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {isAdding ? (
           <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-xl mx-auto">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                <h3 className="font-black text-slate-900 dark:text-white text-base uppercase tracking-widest mb-6">{editingId ? 'Edit Tenant' : 'Add New Tenant'}</h3>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('name')}</label>
                    <input 
                      type="text" 
                      value={form.name || ''} 
                      onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full h-14 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="e.g. Uttom"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('phone')}</label>
                    <input 
                      type="text" 
                      value={form.phone || ''} 
                      onChange={e => setForm({...form, phone: e.target.value})}
                      className="w-full h-14 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="017..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('email')}</label>
                    <input 
                      type="email" 
                      value={form.email || ''} 
                      onChange={e => setForm({...form, email: e.target.value})}
                      className="w-full h-14 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                   <button onClick={handleSave} className="flex-1 bg-emerald-600 text-white h-14 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                      <Save className="w-5 h-5 inline mr-2" /> Save
                   </button>
                   <button onClick={cancelEdit} className="flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 h-14 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-600 transition-all">
                      Cancel
                   </button>
                </div>
              </div>
           </div>
        ) : (
           <div className="space-y-6">
             <div className="flex justify-end">
                <button 
                    onClick={startAdd}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> {t('add_tenant')}
                </button>
             </div>

             {tenants.length === 0 && (
               <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <div className="text-slate-400 font-black uppercase tracking-widest text-sm">{t('no_tenants')}</div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {tenants.map(tenant => (
                 <div key={tenant.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
                    <div className="flex items-center gap-4 overflow-hidden">
                       <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm">
                          {tenant.name.substring(0, 2).toUpperCase()}
                       </div>
                       <div className="min-w-0">
                          <div className="font-black text-slate-900 dark:text-slate-100 text-base truncate">{tenant.name}</div>
                          <div className="flex flex-col text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                             {tenant.phone && <span className="flex items-center gap-1 truncate"><Phone className="w-2.5 h-2.5" /> {tenant.phone}</span>}
                             {tenant.email && <span className="flex items-center gap-1 truncate"><Mail className="w-2.5 h-2.5" /> {tenant.email}</span>}
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2 shrink-0 ml-2">
                       <button onClick={() => startEdit(tenant)} className="p-3 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90">
                          <Edit2 className="w-5 h-5" />
                       </button>
                       <button onClick={() => handleDelete(tenant.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default TenantManager;
