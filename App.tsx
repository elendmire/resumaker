import React, { useState, useRef } from 'react';
import ResumePreview from './components/ResumePreview';
import EditorPanel from './components/EditorPanel';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData } from './types';
import { improveText } from './services/geminiService';

// Declare global types for libraries loaded via CDN
declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

const MAX_ENHANCE_COUNT = 5;

const App: React.FC = () => {
  const [data, setData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Paywall & AI Limits State
  const [credits, setCredits] = useState(MAX_ENHANCE_COUNT);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleConsumeCredit = () => {
      setCredits(prev => Math.max(0, prev - 1));
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);

    try {
      // Small delay to allow react to render the 'hidden' class changes
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = previewRef.current;
      
      // 1. High-quality capture (Scale 4 for crisp text)
      const canvas = await window.html2canvas(element, {
        scale: 4, 
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth, 
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      
      // 2. Setup A4 Dimensions (mm)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297
      const marginY = 12; // 12mm top margin for subsequent pages
      
      // 3. Calculate Layout
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Tracks the current Y position in the source image that we are printing
      let srcY = 0; 
      let remainingImgHeight = imgHeight;

      // --- Page 1 ---
      // Print the first 297mm of the image starting at (0,0)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      
      srcY += pdfHeight;
      remainingImgHeight -= pdfHeight;

      // --- Subsequent Pages ---
      while (remainingImgHeight > 1) { // 1mm tolerance
        pdf.addPage();
        
        // We want to print the content starting at `srcY` in the image.
        // But we want it to appear at `marginY` on the PDF page to give it a margin.
        // So we place the image such that `srcY` aligns with `marginY`.
        // Image Position Y = marginY - srcY
        
        const position = marginY - srcY;
        
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        
        // Create the Top Margin: Mask the area above marginY with a white rectangle
        // This covers any repeated content from the bottom of the previous page
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, marginY, 'F');
        
        // For subsequent pages, the usable height is (PageHeight - Margin)
        // We advanced the "cursor" in the image by this amount
        const usableHeight = pdfHeight - marginY;
        
        srcY += usableHeight;
        remainingImgHeight -= usableHeight;
      }
      
      pdf.save(`${data.header.name.replace(/\s+/g, '_')}_Resume.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to export PDF. Please check console.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);

    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const element = previewRef.current;
        const canvas = await window.html2canvas(element, { scale: 4 });
        const link = document.createElement('a');
        link.download = `${data.header.name.replace(/\s+/g, '_')}_Resume.png`;
        link.href = canvas.toDataURL();
        link.click();
    } catch(err) {
        console.error("PNG Export failed", err);
    } finally {
        setIsExporting(false);
    }
  };

  const handleEnhanceAll = async () => {
    // If user is not Pro, "Enhance All" triggers the paywall immediately
    if (!isPro) {
        setShowPaywall(true);
        return;
    }

    setIsEnhancing(true);
    const newData = JSON.parse(JSON.stringify(data));

    // Helper to process a batch of strings
    const processArray = async (arr: string[]) => {
        // Use Promise.all to enhance concurrently
        return Promise.all(arr.map(async (text) => {
            if (!text || text.length < 10) return text; // Skip empty or very short items
            try {
                return await improveText(text);
            } catch (e) {
                console.error("Failed to enhance text", e);
                return text;
            }
        }));
    };

    try {
        // Enhance Education Details
        for (const item of newData.education) {
            item.details = await processArray(item.details);
        }

        // Enhance Experience Points
        for (const item of newData.experience) {
            item.points = await processArray(item.points);
        }

        // Enhance Project Points
        for (const item of newData.projects) {
            item.points = await processArray(item.points);
        }

        setData(newData);
        alert("All sections have been enhanced with AI!");
    } catch (e) {
        console.error("Enhance all failed", e);
        alert("Something went wrong while enhancing the resume.");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleUnlockPro = () => {
      setIsPro(true);
      setShowPaywall(false);
      setCredits(999);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-800 font-sans">
      
      {/* Paywall Modal (Global) */}
      {showPaywall && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center transform transition-all scale-100">
                <button 
                    onClick={() => setShowPaywall(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-crown text-3xl text-purple-600"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Unlock Unlimited Power</h3>
                <p className="text-gray-600 mb-6">
                    You've reached your free limit. Upgrade to Pro for unlimited AI enhancements and bulk editing.
                </p>
                <div className="space-y-3">
                    <button 
                        onClick={handleUnlockPro} 
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Get Monthly Access - $9.99
                    </button>
                    <button 
                        onClick={handleUnlockPro}
                        className="w-full bg-white border-2 border-purple-600 text-purple-700 font-bold py-3 rounded-lg hover:bg-purple-50 transition-colors"
                    >
                        Get Lifetime Access - $49.99
                    </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <i className="fas fa-lock"></i> Secured by Stripe
                </div>
            </div>
        </div>
      )}

      {/* Editor Side */}
      <EditorPanel 
        data={data} 
        setData={setData} 
        credits={credits}
        isPro={isPro}
        triggerPaywall={() => setShowPaywall(true)}
        onConsumeCredit={handleConsumeCredit}
      />

      {/* Preview Side */}
      <div className="flex-1 flex flex-col h-full bg-gray-700 relative">
        {/* Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-600 flex items-center justify-between px-6 shadow-md z-20">
            <div className="flex items-center text-white gap-2 font-bold text-lg">
                <i className="fas fa-file-alt text-blue-400"></i> ResuMakers
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={handleEnhanceAll}
                    disabled={isEnhancing || isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-purple-700 font-medium rounded text-sm transition-colors shadow-sm"
                >
                    {isEnhancing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
                    Enhance All
                </button>
                <div className="w-px bg-gray-600 mx-1"></div>
                <button 
                    onClick={handleDownloadPNG}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors"
                >
                    <i className="fas fa-image"></i> Export PNG
                </button>
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors shadow-lg"
                >
                    {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                    Export PDF
                </button>
            </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 overflow-hidden relative bg-gray-700/50 flex justify-center">
             <div className="w-full h-full overflow-y-auto flex justify-center py-8">
                <ResumePreview data={data} previewRef={previewRef} isExporting={isExporting} />
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;