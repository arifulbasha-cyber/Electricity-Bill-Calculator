
import React from 'react';
import { Calculator, History, GitFork } from 'lucide-react';
import { useLanguage } from '../i18n';

interface MobileNavProps {
  currentView: 'home' | 'estimator' | 'history';
  onChangeView: (view: 'home' | 'estimator' | 'history') => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onChangeView }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'estimator', label: 'Calculator', icon: Calculator },
    { id: 'home', label: 'Splitter', icon: GitFork },
    { id: 'history', label: 'History', icon: History },
  ] as const;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-50 no-print">
      <div className="max-w-md mx-auto h-20 bg-white/90 dark:bg-slate-900/80 backdrop-blur-3xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/10 px-4 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`flex flex-col items-center justify-center transition-all duration-300 relative py-2 px-3 flex-1 ${
                isActive ? 'scale-110' : 'opacity-40 grayscale-[0.5] hover:opacity-100'
              }`}
            >
              <div className={`transition-all duration-300 ${
                isActive ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-600 dark:text-white'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              
              <span className={`text-[10px] font-black uppercase tracking-[0.05em] mt-1 ${
                isActive ? 'text-indigo-900 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-300'
              }`}>
                {item.label}
              </span>

              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-in zoom-in duration-300"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
