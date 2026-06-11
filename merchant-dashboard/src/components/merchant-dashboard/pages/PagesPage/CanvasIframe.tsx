import React, { useEffect, useRef } from 'react';
import { LivePageData } from '../../../../lib/types/page-builder';

interface CanvasIframeProps {
  currentLayout: LivePageData;
  previewUrl: string;
}

export const CanvasIframe: React.FC<CanvasIframeProps> = ({ currentLayout, previewUrl }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const syncLayout = () => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'LAYOUT_UPDATE', payload: currentLayout },
          '*'
        );
      }
    };

    // Send the message on any currentLayout change
    syncLayout();

    // Also resend when iframe loads to ensure it receives initial state
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', syncLayout);
      return () => iframe.removeEventListener('load', syncLayout);
    }
  }, [currentLayout]);

  return (
    <div className="w-full h-[650px] bg-slate-100 flex items-center justify-center p-6 border border-slate-200 rounded-xl overflow-hidden shadow-inner relative">
      <div className="absolute top-2 left-4 text-xxs text-slate-400 font-mono tracking-wider">
        LIVE RENDER VIEW
      </div>
      <iframe
        ref={iframeRef}
        src={`${previewUrl}${previewUrl.includes('?') ? '&' : '?'}preview=true`}
        className="w-full h-full bg-white shadow-lg border border-slate-200 rounded-lg max-w-[1000px]"
        title="Page Preview Canvas"
      />
    </div>
  );
};
