import React, { useState, useRef, useEffect } from 'react';
import ResumePreview from './components/ResumePreview';
import EditorPanel from './components/EditorPanel';
import { INITIAL_RESUME_DATA } from './constants';
import { ResumeData } from './types';
import { apiService } from './services/apiService';
import { improveText } from './services/geminiService';

declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

const MAX_ENHANCE_COUNT = 5;

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-[#0077B5]' };
  const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fab fa-linkedin' };

  return (
    <div className={`fixed bottom-6 right-6 ${bgColors[type]} text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-fade-in-up transition-all ring-1 ring-white/20`}>
      <i className={`fas ${icons[type]} text-xl`}></i>
      <span className="font-bold tracking-tight">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity"><i className="fas fa-times"></i></button>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [credits, setCredits] = useState(MAX_ENHANCE_COUNT);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => setToast({ message, type });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleLinkedInSync(code);
    }
  }, []);

  const handleLinkedInSync = async (code: string) => {
    setIsLinkedInConnecting(true);
    showToast("Connecting to backend...", 'info');
    
    try {
      // Backend servisinden veriyi çek
      const parsed = await apiService.exchangeLinkedInCode(code);
      
      const mergedData: ResumeData = {
        ...INITIAL_RESUME_DATA,
        header: { ...INITIAL_RESUME_DATA.header, ...parsed.header },
        education: (parsed.education || []).map(edu => ({ ...edu, id: Math.random().toString() })),
        experience: (parsed.experience || []).map(exp => ({ ...exp, id: Math.random().toString() })),
        projects: (parsed.projects || []).map(proj => ({ ...proj, id: Math.random().toString() })),
        skills: (parsed.skills || []).map(skill => ({ ...skill, id: Math.random().toString() })),
        references: (parsed.references || []).map(ref => ({ ...ref, id: Math.random().toString() })),
      } as ResumeData;

      setData(mergedData);
      showToast("LinkedIn Profile Synced Successfully!", 'success');
    } catch (error) {
      showToast("Sync failed. Make sure your backend is running.", 'error');
      console.error(error);
    } finally {
      setIsLinkedInConnecting(false);
    }
  };

  const initiateLinkedInAuth = () => {
    // Backend'de tanımladığınız CLIENT_ID ve REDIRECT_URI
    const clientId = "YOUR_LINKEDIN_CLIENT_ID"; 
    const redirectUri = encodeURIComponent(window.location.origin);
    const scope = encodeURIComponent("r_liteprofile r_emailaddress");
    const state = "random_state_string";
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    
    // Kullanıcıyı LinkedIn login sayfasına yönlendir
    window.location.href = authUrl;
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const element = previewRef.current;
      const canvas = await window.html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', scrollY: -window.scrollY });
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${data.header.name.replace(/\s+/g, '_')}_Resume.pdf`);
      showToast("PDF downloaded!", 'success');
    } catch (err) {
      showToast("Export failed.", 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!previewRef.current || isExporting) return;
    setIsExporting(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const canvas = await window.html2canvas(previewRef.current, { scale: 2, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = `${data.header.name.replace(/\s+/g, '_')}_Resume.png`;
        link.href = canvas.toDataURL();
        link.click();
        showToast("PNG downloaded!", 'success');
    } catch(err) { showToast("Export failed.", 'error'); } finally { setIsExporting(false); }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-800 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isLinkedInConnecting && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
                <div className="w-20 h-20 border-4 border-[#0077B5] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-2xl font-bold mb-2">Talking to Backend</h3>
                <p className="text-gray-300">Exchanging credentials and parsing profile...</p>
            </div>
        </div>
      )}

      {showPaywall && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center border border-gray-100">
                <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-crown text-3xl text-purple-600"></i></div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Unlock Pro</h3>
                <p className="text-gray-600 mb-6">Upgrade for unlimited AI enhancements and priority exports.</p>
                <button onClick={() => { setIsPro(true); setShowPaywall(false); }} className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-xl transition-all">Go Pro - $9.99/mo</button>
            </div>
        </div>
      )}

      <EditorPanel 
        data={data} 
        setData={setData} 
        credits={credits}
        isPro={isPro}
        triggerPaywall={() => setShowPaywall(true)}
        onConsumeCredit={() => setCredits(c => Math.max(0, c - 1))}
        onConnectLinkedIn={initiateLinkedInAuth}
      />

      <div className="flex-1 flex flex-col h-full bg-[#111827] relative">
        <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 shadow-md z-20">
            <div className="flex items-center gap-2 font-bold text-lg select-none">
                <i className="fas fa-file-alt text-blue-400"></i> 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">ResuMakers</span>
            </div>
            <div className="flex gap-3">
                <button onClick={handleDownloadPNG} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition-colors border border-gray-700">
                    <i className="fas fa-image"></i> PNG
                </button>
                <button onClick={handleDownloadPDF} disabled={isExporting} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:translate-y-px">
                    {isExporting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                    Export PDF
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-gray-900 flex justify-center">
             <div className="w-full h-full overflow-y-auto flex justify-center py-10 px-4 scrollbar-thin scrollbar-thumb-gray-700">
                <ResumePreview data={data} previewRef={previewRef} isExporting={isExporting} />
             </div>
        </div>
      </div>
    </div>
  );
};

export default App;