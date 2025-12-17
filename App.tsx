import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, Upload, Image as ImageIcon, Loader2, Download, Archive, RefreshCw } from 'lucide-react';
import JSZip from 'jszip';
import fileSaver from 'file-saver';
import { Button } from './components/Button';
import { SettingsModal } from './components/SettingsModal';
import { Lightbox } from './components/Lightbox';
import { convertHeicToJpeg } from './services/heicService';
import { getSettings, saveSettings } from './services/storage';
import { AppSettings, ConvertedImage, ConversionStatus, SaveMethod } from './types';

const { saveAs } = fileSaver;

// Helper to convert hex to RGB channels (e.g. "255 255 255") for Tailwind opacity support
const hexToRgbChannels = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

// Helper to darken a hex color for primaryDark variant
const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
};

const App = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [status, setStatus] = useState<ConversionStatus>({
    total: 0,
    processed: 0,
    isConverting: false
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [quality, setQuality] = useState(settings.defaultQuality);

  // Apply CSS Variables for Theming
  useEffect(() => {
    const root = document.documentElement;
    const { primaryColor, backgroundColor, surfaceColor } = settings.theme;
    
    // Derived colors
    const primaryDark = adjustBrightness(primaryColor, -20); // Darken by 20%
    const surfaceHighlight = adjustBrightness(surfaceColor, 15); // Lighten by 15%

    root.style.setProperty('--color-primary', hexToRgbChannels(primaryColor));
    root.style.setProperty('--color-primary-dark', hexToRgbChannels(primaryDark));
    root.style.setProperty('--color-bg', hexToRgbChannels(backgroundColor));
    root.style.setProperty('--color-surface', hexToRgbChannels(surfaceColor));
    root.style.setProperty('--color-surface-highlight', hexToRgbChannels(surfaceHighlight));
    
    // Update theme-color meta tag for browser UI
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', backgroundColor);

  }, [settings.theme]);

  useEffect(() => {
    setQuality(settings.defaultQuality);
  }, [settings.defaultQuality]);

  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setQuality(newSettings.defaultQuality);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const fileList = Array.from(e.target.files);
    const files = fileList.filter(
      (f) => f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
    );

    if (files.length === 0) {
      alert('Пожалуйста, выберите файлы формата HEIC.');
      return;
    }

    setStatus({
      total: files.length,
      processed: 0,
      isConverting: true,
      currentFile: 'Запуск...'
    });

    const newImages: ConvertedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setStatus(prev => ({ ...prev, currentFile: file.name }));
      
      try {
        const jpegBlob = await convertHeicToJpeg(file, quality);
        const url = URL.createObjectURL(jpegBlob);
        
        const converted: ConvertedImage = {
          id: Math.random().toString(36).substr(2, 9),
          originalName: file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          url,
          blob: jpegBlob,
          size: jpegBlob.size,
          originalSize: file.size
        };

        newImages.push(converted);
        setImages((prev) => [...prev, converted]);
      } catch (err) {
        console.error(`Failed to convert ${file.name}`, err);
      }

      setStatus(prev => ({ ...prev, processed: i + 1 }));
    }

    setStatus(prev => ({ ...prev, isConverting: false, currentFile: undefined }));
    e.target.value = '';
  };

  const saveImage = async (image: ConvertedImage) => {
    // @ts-ignore
    const supportsFS = typeof window.showSaveFilePicker === 'function';

    if (settings.saveMethod === SaveMethod.DEVICE_FS && supportsFS) {
      try {
        // @ts-ignore
        const handle = await window.showSaveFilePicker({
          suggestedName: image.originalName,
          types: [{
            description: 'JPEG Image',
            accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(image.blob);
        await writable.close();
      } catch (err: any) {
        if (err.name === 'AbortError') return;

        const errorMessage = err.message || '';
        const isSecurityError = err.name === 'SecurityError' || errorMessage.includes('Cross origin');

        if (isSecurityError) {
          console.warn('FS API blocked, using fallback');
          alert('Сохранение в папку недоступно в режиме предпросмотра. Файл будет скачан.');
          saveAs(image.blob, image.originalName);
        } else {
          console.error('FS Save failed', err);
          saveAs(image.blob, image.originalName);
        }
      }
    } else {
      saveAs(image.blob, image.originalName);
    }
  };

  const saveAll = async () => {
    if (images.length === 0) return;

    // @ts-ignore
    const supportsFS = typeof window.showDirectoryPicker === 'function';

    if (settings.saveMethod === SaveMethod.DEVICE_FS && supportsFS) {
       try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        
        let savedCount = 0;
        for (const img of images) {
           // @ts-ignore
           const fileHandle = await dirHandle.getFileHandle(img.originalName, { create: true });
           const writable = await fileHandle.createWritable();
           await writable.write(img.blob);
           await writable.close();
           savedCount++;
        }
        alert(`Успешно сохранено изображений: ${savedCount}`);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        
        const errorMessage = err.message || '';
        const isSecurityError = err.name === 'SecurityError' || errorMessage.includes('Cross origin');

        if (isSecurityError) {
          alert('Сохранение в папку недоступно. Скачивание архивом...');
          const zip = new JSZip();
          images.forEach((img) => {
            zip.file(img.originalName, img.blob);
          });
          const content = await zip.generateAsync({ type: 'blob' });
          saveAs(content, 'converted_images.zip');
        } else {
          alert('Ошибка при сохранении в папку. Попробуйте обычный метод.');
        }
      }
    } else {
      const zip = new JSZip();
      images.forEach((img) => {
        zip.file(img.originalName, img.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'converted_images.zip');
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark text-textMain relative overflow-hidden transition-colors duration-500">
      
      {/* Background Decor */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-20 pointer-events-none animate-blob" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-20 pointer-events-none animate-blob animation-delay-2000" />

      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-surfaceHighlight bg-surface/30 backdrop-blur-md flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-primaryDark p-2.5 rounded-xl shadow-[0_0_15px_rgba(var(--color-primary),0.4)]">
            <ImageIcon className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
            HEIC <span className="text-primary font-extrabold">Pro</span>
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-full">
          <Settings size={22} />
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar relative z-0">
        <div className="max-w-6xl mx-auto space-y-10">
          
          {/* Settings & Status Bar - Modern Glass Card */}
          <div className="bg-surface/40 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               {/* Controls */}
               <div className="flex-1 space-y-5">
                 <div className="flex items-center justify-between">
                   <label className="text-sm font-semibold text-textMuted uppercase tracking-wider">Качество сжатия</label>
                   <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">{quality}%</span>
                 </div>
                 <input 
                    type="range" 
                    min="1" max="100" 
                    value={quality} 
                    onChange={(e) => setQuality(parseInt(e.target.value))}
                    disabled={status.isConverting}
                    className="w-full h-1.5 bg-surfaceHighlight rounded-full appearance-none cursor-pointer accent-primary"
                 />
               </div>

               {/* Upload Button */}
               <div className="flex-shrink-0">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept=".heic,.HEIC,.heif,.HEIF"
                    className="hidden"
                    onChange={handleFiles}
                    disabled={status.isConverting}
                  />
                  <label htmlFor="file-upload">
                    <Button 
                      as="span" 
                      variant="primary" 
                      size="lg" 
                      className={`w-full md:w-auto cursor-pointer rounded-2xl px-8 py-4 shadow-xl shadow-primary/20 ${status.isConverting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {status.isConverting ? <Loader2 className="animate-spin" /> : <Upload />}
                      {status.isConverting ? 'Обработка...' : 'Загрузить HEIC'}
                    </Button>
                  </label>
               </div>
            </div>

            {/* Progress Bar */}
            {status.isConverting && (
              <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between text-xs text-textMuted uppercase tracking-wider font-bold">
                  <span>Обработано {status.processed} из {status.total}</span>
                  <span>{Math.round((status.processed / status.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-blue-500 shadow-[0_0_10px_rgba(var(--color-primary),0.5)] transition-all duration-300 ease-out"
                    style={{ width: `${(status.processed / status.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 font-mono truncate">{status.currentFile}</p>
              </div>
            )}
          </div>

          {/* Results Gallery */}
          {images.length > 0 && (
             <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   Галерея <span className="text-zinc-500 text-base font-normal">({images.length})</span>
                 </h2>
                 <Button variant="secondary" size="sm" onClick={saveAll} className="bg-surfaceHighlight hover:bg-zinc-700">
                    <Archive size={16} /> Скачать всё
                 </Button>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {images.map((img, idx) => (
                   <div 
                    key={img.id} 
                    className="group relative aspect-square bg-surface rounded-2xl overflow-hidden border border-white/5 cursor-zoom-in hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/10 hover:-translate-y-1"
                    onClick={() => setLightboxIndex(idx)}
                   >
                     <img 
                       src={img.url} 
                       alt={img.originalName} 
                       className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                       loading="lazy"
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <span className="text-white font-medium text-xs truncate w-full">{img.originalName}</span>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          {/* Empty State */}
          {!status.isConverting && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-600 border border-dashed border-zinc-800 rounded-3xl bg-surface/20">
              <div className="p-4 bg-surface rounded-full mb-4">
                <ImageIcon size={48} className="opacity-50 text-zinc-500" />
              </div>
              <p className="text-xl font-semibold text-zinc-400">Галерея пуста</p>
              <p className="text-sm mt-2 text-zinc-600">Загрузите файлы, чтобы начать магию</p>
            </div>
          )}

        </div>
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSettingsSave}
      />

      {/* Conditional rendering for Lightbox ensures fresh mount and animation state reset */}
      {lightboxIndex !== null && (
        <Lightbox 
          isOpen={true}
          initialIndex={lightboxIndex || 0}
          images={images}
          onClose={() => setLightboxIndex(null)}
          onSave={saveImage}
          saveMethod={settings.saveMethod}
        />
      )}
    </div>
  );
};

export default App;