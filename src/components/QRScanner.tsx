import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      onScan(decodedText);
      scanner.clear();
    }, (error) => {
      // Errors are normal during scanning
    });

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [onScan]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Scan QR Code</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
        
        <div id="reader" className="w-full"></div>
        
        <div className="p-6 text-center text-xs text-gray-500 font-bold uppercase tracking-widest bg-gray-50">
          Scan de code op het hoofdscherm om te synchroniseren
        </div>
      </div>
    </motion.div>
  );
};
