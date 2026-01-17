import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n';
import Tesseract from 'tesseract.js';

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: number) => void;
}

const OCRModal: React.FC<OCRModalProps> = ({ isOpen, onClose, onScan }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scannedValue, setScannedValue] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedValue(null);
      setError(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera Error:", err);
      setError(t('camera_permission_denied'));
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        processImage(canvas);
      }
    }
  };

  const processImage = async (canvas: HTMLCanvasElement) => {
    setIsCapturing(true);
    setError(null);
    
    try {
      // Use Tesseract to recognize text
      const result = await Tesseract.recognize(
        canvas,
        'eng',
        { 
          // logger: m => console.log(m) // Optional logger
        }
      );

      const text = result.data.text;
      console.log("OCR Result:", text);

      // Attempt to extract the most likely meter reading number
      // Regex looks for sequences of digits, potentially with a decimal point
      const numbers = text.match(/\d+(\.\d+)?/g);
      
      if (numbers && numbers.length > 0) {
        // Simple heuristic: pick the longest number or the one that looks most like a reading
        // For now, let's pick the longest sequence found, as meters usually have multiple digits
        const likelyReading = numbers.sort((a, b) => b.length - a.length)[0];
        setScannedValue(parseFloat(likelyReading));
      } else {
        setError(t('no_text_detected'));
      }

    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to process image.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetry = () => {
    setScannedValue(null);
    setError(null);
    // Attempt to restart camera if it's not running
    startCamera();
  };

  const handleConfirm = () => {
    if (scannedValue !== null) {
      onScan(scannedValue);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('scan_meter')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative flex-1 bg-black flex flex-col items-center justify-center overflow-hidden">
          {scannedValue === null && !error ? (
            <>
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 className="w-full h-full object-cover"
               />
               <canvas ref={canvasRef} className="hidden" />
               
               {/* Overlay Guide */}
               <div className="absolute inset-0 border-2 border-indigo-500/50 m-12 rounded-lg pointer-events-none flex items-center justify-center">
                  <div className="bg-black/50 text-white px-2 py-1 rounded text-xs font-medium">
                     {t('scan_instruction')}
                  </div>
               </div>

               {/* Capture Button */}
               <div className="absolute bottom-6 w-full flex justify-center">
                 <button 
                   onClick={captureImage}
                   disabled={isCapturing}
                   className="w-16 h-16 rounded-full bg-white border-4 border-indigo-200 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                 >
                   {isCapturing ? (
                     <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   ) : (
                     <div className="w-12 h-12 rounded-full bg-indigo-600"></div>
                   )}
                 </button>
               </div>
            </>
          ) : (
             <div className="w-full h-full bg-white dark:bg-slate-900 p-8 flex flex-col items-center justify-center text-center space-y-6">
                {error ? (
                   <>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
                         <X className="w-8 h-8 text-red-500" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 font-medium">{error}</p>
                   </>
                ) : (
                   <>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full">
                         <Check className="w-8 h-8 text-green-500" />
                      </div>
                      <div>
                         <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Detected Reading</p>
                         <input 
                            type="number" 
                            value={scannedValue || ''} 
                            onChange={(e) => setScannedValue(parseFloat(e.target.value))}
                            className="text-4xl font-bold text-center w-full bg-transparent border-b-2 border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 outline-none text-slate-900 dark:text-white pb-2"
                         />
                      </div>
                   </>
                )}
                
                <div className="flex gap-3 w-full">
                   <button 
                     onClick={handleRetry}
                     className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                   >
                      <RefreshCw className="w-4 h-4" /> {t('retry')}
                   </button>
                   {scannedValue !== null && (
                      <button 
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
                      >
                         <Check className="w-4 h-4" /> {t('use_value')}
                      </button>
                   )}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OCRModal;