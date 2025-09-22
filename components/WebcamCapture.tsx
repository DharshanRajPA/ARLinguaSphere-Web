
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon } from './Icons';

interface WebcamCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

export const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    let stream: MediaStream;
    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam error:", err);
        setError("Could not access the webcam. Please ensure permissions are granted.");
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const handleCapture = useCallback(() => {
    if (isCapturing) return;
    setIsCapturing(true);

    const interval = setInterval(() => {
        setCountdown(prev => prev - 1);
    }, 1000);

    setTimeout(() => {
        clearInterval(interval);
        const video = videoRef.current;
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onCapture(dataUrl);
            }
        }
    }, 3000);

  }, [onCapture, isCapturing]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 w-full max-w-3xl">
        <div className="relative">
          {error ? (
            <div className="aspect-video flex items-center justify-center bg-gray-900 rounded-md">
                <p className="text-red-400 text-center">{error}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md aspect-video" />
          )}
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-9xl font-bold">{countdown > 0 ? countdown : <CameraIcon className="w-24 h-24" />}</div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-center items-center gap-4">
          <button
            onClick={handleCapture}
            disabled={!!error || isCapturing}
            className="px-6 py-3 bg-cyan-600 text-white rounded-md font-semibold hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <CameraIcon className="w-6 h-6" />
            {isCapturing ? `Capturing in ${countdown}...` : 'Capture Photo'}
          </button>
          <button
            onClick={onClose}
            disabled={isCapturing}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
