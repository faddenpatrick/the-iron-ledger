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
  const [manualBarcode, setManualBarcode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    setError('');
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
      let errorMsg = 'Failed to access camera.';

      if (err?.message?.includes('Permission denied')) {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings and try again.';
      } else if (err?.message?.includes('NotFoundError')) {
        errorMsg = 'No camera found on this device.';
      } else if (err?.message?.includes('NotAllowedError')) {
        errorMsg = 'Camera access blocked. Check your browser permissions.';
      }

      setError(errorMsg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
      handleClose();
    }
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

        {!isScanning && !showManualInput && (
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <p className="text-gray-300 text-sm mb-4 text-center">
              Click below to start camera and scan a barcode
            </p>
            <button
              onClick={startScanner}
              className="btn btn-primary w-full mb-3"
            >
              📷 Start Camera
            </button>
            <button
              onClick={() => setShowManualInput(true)}
              className="btn btn-secondary w-full text-sm"
            >
              Enter Barcode Manually
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-4">
            <p className="font-medium mb-2">❌ Camera Error</p>
            <p className="text-sm mb-3">{error}</p>
            <details className="text-xs">
              <summary className="cursor-pointer mb-2 font-medium">How to enable camera</summary>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera permissions</li>
                <li>Reload the page if needed</li>
                <li>Or use manual entry below</li>
              </ul>
            </details>
            <button
              onClick={() => setShowManualInput(true)}
              className="btn btn-secondary w-full mt-3 text-sm"
            >
              Enter Barcode Manually Instead
            </button>
          </div>
        )}

        {isScanning && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-4 text-center">
              Position the barcode within the frame
            </p>
            <div id="barcode-reader" className="rounded-lg overflow-hidden"></div>
          </div>
        )}

        {showManualInput && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm mb-3">Enter barcode number:</p>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleManualSubmit();
              }}
              placeholder="e.g., 012345678901"
              className="input mb-3"
              autoFocus
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualBarcode.trim()}
              className="btn btn-primary w-full"
            >
              Look Up Barcode
            </button>
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
