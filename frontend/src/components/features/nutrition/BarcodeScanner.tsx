import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Successfully scanned
          onScan(decodedText);
          stopScanner();
        },
        (_errorMessage) => {
          // Scanning error (ignore, happens frequently)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setError(err?.message || 'Failed to access camera. Please grant camera permissions.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Scan Barcode</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-4">
            <p className="font-medium mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">Make sure you've granted camera permissions in your browser settings.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-4 text-center">
              Position the barcode within the frame
            </p>
            <div id="barcode-reader" className="rounded-lg overflow-hidden"></div>
          </div>
        )}

        <button
          onClick={handleClose}
          className="btn btn-secondary w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
