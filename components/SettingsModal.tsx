import React from 'react';
import { X, Save, Smartphone, Download, RotateCcw } from 'lucide-react';
import { AppSettings, SaveMethod } from '../types';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const DEFAULT_THEME = {
  primaryColor: '#8b5cf6',
  backgroundColor: '#09090b',
  surfaceColor: '#18181b',
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  // Sync when modal opens
  React.useEffect(() => {
    if (isOpen) setLocalSettings(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleColorChange = (key: keyof typeof DEFAULT_THEME, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }));
  };

  const resetTheme = () => {
    setLocalSettings(prev => ({
      ...prev,
      theme: DEFAULT_THEME
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/10 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white">Настройки</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={22} />
          </Button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto no-scrollbar">
          {/* Default Quality */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-zinc-300">
                Качество по умолчанию
                </label>
                <span className="text-xs font-mono bg-surfaceHighlight text-primary px-2 py-1 rounded-md border border-white/10">
                    {localSettings.defaultQuality}%
                </span>
            </div>
            
            <input
              type="range"
              min="1"
              max="100"
              value={localSettings.defaultQuality}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  defaultQuality: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-surfaceHighlight rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Выше качество — больше размер. Рекомендуется 85-95%.
            </p>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-zinc-300">
                  Тема приложения
                </label>
                <Button variant="ghost" size="sm" onClick={resetTheme} className="text-xs h-8">
                  <RotateCcw size={12} /> Сбросить
                </Button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {/* Primary Color */}
                <div className="flex items-center justify-between bg-surfaceHighlight/50 p-3 rounded-xl border border-white/5">
                   <span className="text-sm text-zinc-400">Акцентный цвет</span>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">{localSettings.theme.primaryColor}</span>
                      <input 
                        type="color" 
                        value={localSettings.theme.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0 bg-transparent"
                      />
                   </div>
                </div>

                {/* Background Color */}
                <div className="flex items-center justify-between bg-surfaceHighlight/50 p-3 rounded-xl border border-white/5">
                   <span className="text-sm text-zinc-400">Фон страницы</span>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">{localSettings.theme.backgroundColor}</span>
                      <input 
                        type="color" 
                        value={localSettings.theme.backgroundColor}
                        onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0 bg-transparent"
                      />
                   </div>
                </div>

                {/* Surface Color */}
                <div className="flex items-center justify-between bg-surfaceHighlight/50 p-3 rounded-xl border border-white/5">
                   <span className="text-sm text-zinc-400">Цвет карточек</span>
                   <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500">{localSettings.theme.surfaceColor}</span>
                      <input 
                        type="color" 
                        value={localSettings.theme.surfaceColor}
                        onChange={(e) => handleColorChange('surfaceColor', e.target.value)}
                        className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0 bg-transparent"
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* Save Method */}
          <div>
            <label className="block text-sm font-semibold text-zinc-300 mb-4">
              Метод сохранения
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    saveMethod: SaveMethod.BROWSER_DOWNLOAD,
                  })
                }
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                  localSettings.saveMethod === SaveMethod.BROWSER_DOWNLOAD
                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]'
                    : 'border-white/5 bg-surfaceHighlight text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Download size={24} className="mb-2" />
                <span className="text-sm font-medium">Скачивание</span>
              </button>

              <button
                onClick={() =>
                  setLocalSettings({
                    ...localSettings,
                    saveMethod: SaveMethod.DEVICE_FS,
                  })
                }
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                  localSettings.saveMethod === SaveMethod.DEVICE_FS
                    ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--color-primary),0.2)]'
                    : 'border-white/5 bg-surfaceHighlight text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <Smartphone size={24} className="mb-2" />
                <span className="text-sm font-medium">Файловая система</span>
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
              <strong className="text-zinc-400">Файловая система:</strong> сохраняет напрямую в папку без лишних диалогов (PC Chrome, Edge). <br/>
              <strong className="text-zinc-400">Скачивание:</strong> стандартный метод браузера.
            </p>
          </div>
        </div>

        <div className="p-5 bg-surfaceHighlight border-t border-white/5 flex justify-end shrink-0">
          <Button
            size="lg"
            onClick={() => {
              onSave(localSettings);
              onClose();
            }}
            className="w-full md:w-auto shadow-lg shadow-primary/20"
          >
            <Save size={18} /> Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  );
};