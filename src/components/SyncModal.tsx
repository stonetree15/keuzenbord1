import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { X, Share2, MonitorSmartphone } from 'lucide-react';
import { Button } from './ui/button';

interface SyncModalProps {
  uid: string;
  secret: string;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ uid, secret, onClose }) => {
  const syncUrl = `${window.location.origin}${window.location.pathname}?sync=${uid}&secret=${secret}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-3 text-center border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-1">
            <MonitorSmartphone size={20} />
          </div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Koppel Apparaat</h2>
          <p className="text-gray-500 font-bold mt-0.5 text-[10px] leading-tight px-4">
            Scan deze code om live te synchroniseren op een ander toestel.
          </p>
        </div>
        
        <div className="p-3 flex justify-center bg-gray-50">
          <div className="p-1.5 bg-white rounded-xl shadow-md border-2 border-white ring-2 ring-blue-50">
            <QRCodeSVG value={syncUrl} size={150} level="H" includeMargin />
          </div>
        </div>
        
        <div className="p-3 flex flex-col gap-1.5">
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(syncUrl);
            }}
            variant="outline"
            className="w-full py-2 font-black uppercase tracking-widest text-[9px] border-2 gap-2 h-auto"
          >
            <Share2 size={12} />
            Kopieer Link
          </Button>
          
          <Button 
            onClick={onClose}
            className="w-full py-2 bg-gray-900 text-white font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-gray-800 transition-all h-auto"
          >
            Sluiten
          </Button>
        </div>
        
        <div className="p-2 bg-blue-50 text-[9px] text-blue-600 font-black text-center uppercase tracking-[0.15em]">
          Beheer blijft enkel op dit apparaat actief
        </div>
      </motion.div>
    </div>
  );
};
