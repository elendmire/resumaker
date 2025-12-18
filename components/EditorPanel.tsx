import React, { useState } from 'react';
import { ResumeData, ExperienceItem, ProjectItem, EducationItem, SkillCategory, ReferenceItem } from '../types';
import { improveText } from '../services/geminiService';

interface EditorPanelProps {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  credits: number;
  isPro: boolean;
  triggerPaywall: () => void;
  onConsumeCredit: () => void;
}

const MAX_ENHANCE_COUNT = 5;

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
];

const YEARS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() + 5) - i);

const EditorPanel: React.FC<EditorPanelProps> = ({ data, setData, credits, isPro, triggerPaywall, onConsumeCredit }) => {
  const [activeTab, setActiveTab] = useState<'header' | 'experience' | 'education' | 'projects' | 'skills' | 'references'>('header');
  const [improvingId, setImprovingId] = useState<string | null>(null);

  // Helper to handle AI improvement
  const handleAIImprove = async (text: string, callback: (newText: string) => void, id: string) => {
    if (credits <= 0 && !isPro) {
      triggerPaywall();
      return;
    }

    setImprovingId(id);
    
    // Only consume credit if not pro (or depending on business logic, maybe pros have unlimited)
    if (!isPro) {
        onConsumeCredit();
    }
    
    const improved = await improveText(text);
    callback(improved);
    setImprovingId(null);
  };

  // --- Handlers for Inputs ---
  const handleHeaderChange = (name: keyof ResumeData['header'], value: string) => {
    setData(prev => ({
      ...prev,
      header: { ...prev.header, [name]: value }
    }));
  };

  // --- Generic List Handlers ---
  const handleListChange = (
    section: 'experience' | 'projects' | 'education' | 'skills' | 'references',
    id: string,
    field: string,
    value: any
  ) => {
    setData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handlePointChange = (
    section: 'experience' | 'projects' | 'education',
    itemId: string,
    pointIndex: number,
    value: string
  ) => {
    setData(prev => {
        const list = prev[section] as any[];
        return {
            ...prev,
            [section]: list.map(item => {
                if (item.id !== itemId) return item;
                const key = section === 'education' ? 'details' : 'points';
                const newPoints = [...item[key]];
                newPoints[pointIndex] = value;
                return { ...item, [key]: newPoints };
            })
        }
    });
  };

  const addItem = (section: 'experience' | 'projects' | 'education' | 'skills' | 'references') => {
    const id = (Date.now() + Math.random()).toString();
    let newItem: any;

    if (section === 'experience') {
        newItem = { 
            id, company: 'New Company', role: 'Role', location: 'City', 
            startDate: '', endDate: '', isCurrent: false, 
            points: ['New achievement'] 
        };
    }
    else if (section === 'projects') {
        newItem = { 
            id, name: 'Project Name', techStack: 'Tech Stack', 
            startDate: '', endDate: '', isCurrent: false, 
            points: ['Description'] 
        };
    }
    else if (section === 'education') {
        newItem = { 
            id, school: 'University', location: 'City', degree: 'Degree', gpa: '', 
            startDate: '', endDate: '', isCurrent: false, 
            details: ['Coursework...'] 
        };
    }
    else if (section === 'references') {
        newItem = {
            id, name: 'Reference Name', role: 'Role', company: 'Company', email: 'email@example.com'
        };
    }
    else {
        newItem = { id, name: 'Category', items: 'Skill 1, Skill 2' };
    }

    setData(prev => ({
      ...prev,
      [section]: [...(prev[section] as any[]), newItem]
    }));
  };

  const removeItem = (section: keyof ResumeData, id: string) => {
    setData(prev => ({
      ...prev,
      [section]: (prev[section] as any[]).filter((item: any) => item.id !== id)
    }));
  };

  // --- Drag and Drop Logic ---
  const [draggedItem, setDraggedItem] = useState<{ section: string, index: number } | null>(null);

  const onDragStart = (e: React.DragEvent, section: string, index: number) => {
    setDraggedItem({ section, index });
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, section: string, index: number) => {
    e.preventDefault(); 
    if (!draggedItem || draggedItem.section !== section) return;
  };

  const onDrop = (e: React.DragEvent, section: keyof ResumeData, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.section !== section) return;
    
    const dragIndex = draggedItem.index;
    if (dragIndex === dropIndex) return;

    setData(prev => {
      const list = [...(prev[section] as any[])];
      const [removed] = list.splice(dragIndex, 1);
      list.splice(dropIndex, 0, removed);
      return { ...prev, [section]: list };
    });
    setDraggedItem(null);
  };

  const stopDragPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // --- Custom Date Selector Component ---
  const DateSelect = ({ value, onChange, disabled }: { value: string, onChange: (val: string) => void, disabled?: boolean }) => {
    const [year, month] = value.split('-');

    const handleMonth = (e: React.ChangeEvent<HTMLSelectElement>) => {
       const newMonth = e.target.value;
       const currentYear = year || new Date().getFullYear().toString();
       onChange(`${currentYear}-${newMonth}`);
    };

    const handleYear = (e: React.ChangeEvent<HTMLSelectElement>) => {
       const newYear = e.target.value;
       const currentMonth = month || '01';
       onChange(`${newYear}-${currentMonth}`);
    };

    return (
      <div className="flex gap-1 w-full" onMouseDown={stopDragPropagation} onClick={stopDragPropagation}>
        <select 
            value={month || ''} 
            onChange={handleMonth}
            disabled={disabled}
            className={`w-1/2 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 appearance-none ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
        >
            <option value="" disabled>Month</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select 
            value={year || ''} 
            onChange={handleYear}
            disabled={disabled}
            className={`w-1/2 bg-white border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 appearance-none ${disabled ? 'bg-gray-100 text-gray-400' : ''}`}
        >
            <option value="" disabled>Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    );
  };

  // --- Renderers ---
  const renderInput = (label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder = "") => (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input 
        type="text" 
        value={value} 
        onChange={onChange}
        onMouseDown={stopDragPropagation}
        onClick={stopDragPropagation}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  const renderDateRange = (item: any, section: 'experience' | 'projects' | 'education') => (
    <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date Period</label>
        <div className="flex gap-2 items-center mb-2">
            <div className="flex-1">
                <DateSelect 
                    value={item.startDate} 
                    onChange={(val) => handleListChange(section, item.id, 'startDate', val)} 
                />
            </div>
            <span className="text-gray-400 text-xs">to</span>
            <div className="flex-1">
                <DateSelect 
                    value={item.endDate} 
                    onChange={(val) => handleListChange(section, item.id, 'endDate', val)}
                    disabled={item.isCurrent}
                />
            </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={stopDragPropagation}>
            <input 
                type="checkbox" 
                checked={item.isCurrent} 
                onChange={(e) => handleListChange(section, item.id, 'isCurrent', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500" 
            />
            <span className="text-sm text-gray-600">Currently working here (Present)</span>
        </label>
    </div>
  );

  const renderTextAreaWithAI = (label: string, value: string, onChange: (val: string) => void, id: string) => (
    <div className="mb-3">
       <div className="flex justify-between items-end mb-1">
        <label className="block text-xs font-semibold text-gray-500 uppercase">{label}</label>
        <button 
            onClick={(e) => { e.stopPropagation(); handleAIImprove(value, onChange, id); }}
            disabled={improvingId !== null}
            className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-purple-200"
        >
            {improvingId === id ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
            {improvingId === id ? 'Thinking...' : isPro ? 'Enhance (Pro)' : `Enhance (${credits}/${MAX_ENHANCE_COUNT})`}
        </button>
       </div>
      <textarea 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        onMouseDown={stopDragPropagation}
        onClick={stopDragPropagation}
        rows={2}
        className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200 w-full max-w-md shadow-xl z-10 relative">
      
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto bg-white border-b border-gray-200 no-scrollbar">
        {['header', 'education', 'experience', 'projects', 'skills', 'references'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'header' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Personal Details</h3>
            {renderInput('Full Name', data.header.name, (e) => handleHeaderChange('name', e.target.value))}
            {renderInput('Phone', data.header.phone, (e) => handleHeaderChange('phone', e.target.value))}
            {renderInput('Email', data.header.email, (e) => handleHeaderChange('email', e.target.value))}
            {renderInput('LinkedIn (URL)', data.header.linkedin, (e) => handleHeaderChange('linkedin', e.target.value), 'linkedin.com/in/...')}
            {renderInput('GitHub (URL)', data.header.github, (e) => handleHeaderChange('github', e.target.value), 'github.com/...')}
            {renderInput('Website', data.header.website, (e) => handleHeaderChange('website', e.target.value), 'yourwebsite.com')}
          </div>
        )}

        {/* Experience */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gray-800">Experience</h3>
                <button onClick={() => addItem('experience')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">+ Add</button>
            </div>
            {data.experience.map((item, idx) => (
              <div 
                key={item.id} 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group relative"
                draggable
                onDragStart={(e) => onDragStart(e, 'experience', idx)}
                onDragOver={(e) => onDragOver(e, 'experience', idx)}
                onDrop={(e) => onDrop(e, 'experience', idx)}
              >
                <div className="flex justify-between items-center mb-2 cursor-move opacity-50 hover:opacity-100">
                    <span className="text-xs uppercase font-bold tracking-wider text-gray-400"><i className="fas fa-grip-lines mr-2"></i>Drag to Reorder</span>
                    <button onClick={(e) => { e.stopPropagation(); removeItem('experience', item.id); }} className="text-red-400 hover:text-red-600 transition-colors"><i className="fas fa-trash"></i></button>
                </div>
                {renderInput('Company', item.company, (e) => handleListChange('experience', item.id, 'company', e.target.value))}
                {renderInput('Role', item.role, (e) => handleListChange('experience', item.id, 'role', e.target.value))}
                {renderInput('Location', item.location, (e) => handleListChange('experience', item.id, 'location', e.target.value))}
                
                {renderDateRange(item, 'experience')}
                
                <label className="block text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Bullet Points</label>
                {item.points.map((point, pIdx) => (
                    <div key={pIdx} className="flex gap-2 items-start mb-2">
                         <div className="flex-1">
                            {renderTextAreaWithAI(`Point ${pIdx + 1}`, point, (val) => handlePointChange('experience', item.id, pIdx, val), `${item.id}-${pIdx}`)}
                         </div>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const newPoints = item.points.filter((_, i) => i !== pIdx);
                                handleListChange('experience', item.id, 'points', newPoints);
                            }}
                            className="mt-6 text-gray-400 hover:text-red-500"
                            title="Remove point"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
                 <button 
                    onClick={(e) => { e.stopPropagation(); handleListChange('experience', item.id, 'points', [...item.points, "New bullet point"]); }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"
                >
                    <i className="fas fa-plus"></i> Add Bullet Point
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {activeTab === 'projects' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Projects</h3>
                    <button onClick={() => addItem('projects')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">+ Add</button>
                </div>
                {data.projects.map((item, idx) => (
                    <div 
                        key={item.id} 
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                        draggable
                        onDragStart={(e) => onDragStart(e, 'projects', idx)}
                        onDragOver={(e) => onDragOver(e, 'projects', idx)}
                        onDrop={(e) => onDrop(e, 'projects', idx)}
                    >
                         <div className="flex justify-between items-center mb-2 cursor-move opacity-50 hover:opacity-100">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-400"><i className="fas fa-grip-lines mr-2"></i>Drag to Reorder</span>
                            <button onClick={(e) => { e.stopPropagation(); removeItem('projects', item.id); }} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </div>
                        {renderInput('Name', item.name, (e) => handleListChange('projects', item.id, 'name', e.target.value))}
                        {renderInput('Sub-title / Technologies', item.techStack, (e) => handleListChange('projects', item.id, 'techStack', e.target.value))}
                        
                        {renderDateRange(item, 'projects')}
                        
                        <label className="block text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Details</label>
                        {item.points.map((point, pIdx) => (
                            <div key={pIdx} className="flex gap-2 items-start mb-2">
                                <div className="flex-1">
                                    {renderTextAreaWithAI(`Detail ${pIdx + 1}`, point, (val) => handlePointChange('projects', item.id, pIdx, val), `${item.id}-${pIdx}`)}
                                </div>
                                 <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newPoints = item.points.filter((_, i) => i !== pIdx);
                                        handleListChange('projects', item.id, 'points', newPoints);
                                    }}
                                    className="mt-6 text-gray-400 hover:text-red-500"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ))}
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleListChange('projects', item.id, 'points', [...item.points, "New detail"]); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"
                        >
                            <i className="fas fa-plus"></i> Add Detail
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Education */}
        {activeTab === 'education' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Education</h3>
                    <div className="flex gap-2">
                        <button onClick={() => addItem('education')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">+ Add</button>
                    </div>
                </div>
                {data.education.map((item, idx) => (
                    <div 
                        key={item.id} 
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                        draggable
                        onDragStart={(e) => onDragStart(e, 'education', idx)}
                        onDragOver={(e) => onDragOver(e, 'education', idx)}
                        onDrop={(e) => onDrop(e, 'education', idx)}
                    >
                         <div className="flex justify-between items-center mb-2 cursor-move opacity-50 hover:opacity-100">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-400"><i className="fas fa-grip-lines mr-2"></i>Drag to Reorder</span>
                            <button onClick={(e) => { e.stopPropagation(); removeItem('education', item.id); }} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </div>
                        {renderInput('School', item.school, (e) => handleListChange('education', item.id, 'school', e.target.value))}
                        {renderInput('Location', item.location, (e) => handleListChange('education', item.id, 'location', e.target.value))}
                        
                        <div className="flex gap-2">
                            <div className="flex-grow">
                                {renderInput('Degree', item.degree, (e) => handleListChange('education', item.id, 'degree', e.target.value))}
                            </div>
                            <div className="w-1/3">
                                {renderInput('GPA (Optional)', item.gpa || '', (e) => handleListChange('education', item.id, 'gpa', e.target.value), 'e.g. 3.8')}
                            </div>
                        </div>

                        {renderDateRange(item, 'education')}
                        
                        <label className="block text-xs font-semibold text-gray-500 uppercase mt-4 mb-2">Details (Coursework, etc)</label>
                        {item.details.map((point, pIdx) => (
                            <div key={pIdx} className="flex gap-2 items-start mb-2">
                                <div className="flex-1">
                                    {renderTextAreaWithAI(`Detail ${pIdx + 1}`, point, (val) => handlePointChange('education', item.id, pIdx, val), `${item.id}-${pIdx}`)}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const newDetails = item.details.filter((_, i) => i !== pIdx);
                                        handleListChange('education', item.id, 'details', newDetails);
                                    }}
                                    className="mt-6 text-gray-400 hover:text-red-500"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        ))}
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleListChange('education', item.id, 'details', [...item.details, "New detail"]); }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-1"
                        >
                            <i className="fas fa-plus"></i> Add Detail
                        </button>
                    </div>
                ))}
            </div>
        )}

        {/* Skills */}
        {activeTab === 'skills' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Skills</h3>
                    <button onClick={() => addItem('skills')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">+ Add</button>
                </div>
                 {data.skills.map((item, idx) => (
                    <div 
                        key={item.id} 
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                        draggable
                        onDragStart={(e) => onDragStart(e, 'skills', idx)}
                        onDragOver={(e) => onDragOver(e, 'skills', idx)}
                        onDrop={(e) => onDrop(e, 'skills', idx)}
                    >
                         <div className="flex justify-between items-center mb-2 cursor-move opacity-50 hover:opacity-100">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-400"><i className="fas fa-grip-lines mr-2"></i>Drag to Reorder</span>
                            <button onClick={(e) => { e.stopPropagation(); removeItem('skills', item.id); }} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </div>
                        
                        <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Category Suggestions</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {["Languages", "Frameworks", "Developer Tools", "Libraries", "Soft Skills", "Certifications"].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => handleListChange('skills', item.id, 'name', cat)}
                                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition-colors"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            {renderInput('Category Name', item.name, (e) => handleListChange('skills', item.id, 'name', e.target.value))}
                        </div>
                        
                        {renderInput('Items (Comma separated)', item.items, (e) => handleListChange('skills', item.id, 'items', e.target.value))}
                    </div>
                 ))}
             </div>
        )}

        {/* References */}
        {activeTab === 'references' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">References</h3>
                    <button onClick={() => addItem('references')} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 shadow-sm">+ Add</button>
                </div>
                 {data.references && data.references.map((item, idx) => (
                    <div 
                        key={item.id} 
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                        draggable
                        onDragStart={(e) => onDragStart(e, 'references', idx)}
                        onDragOver={(e) => onDragOver(e, 'references', idx)}
                        onDrop={(e) => onDrop(e, 'references', idx)}
                    >
                         <div className="flex justify-between items-center mb-2 cursor-move opacity-50 hover:opacity-100">
                            <span className="text-xs uppercase font-bold tracking-wider text-gray-400"><i className="fas fa-grip-lines mr-2"></i>Drag to Reorder</span>
                            <button onClick={(e) => { e.stopPropagation(); removeItem('references', item.id); }} className="text-red-400 hover:text-red-600"><i className="fas fa-trash"></i></button>
                        </div>
                        
                        {renderInput('Name', item.name, (e) => handleListChange('references', item.id, 'name', e.target.value))}
                        {renderInput('Role', item.role, (e) => handleListChange('references', item.id, 'role', e.target.value))}
                        {renderInput('Where (Company)', item.company, (e) => handleListChange('references', item.id, 'company', e.target.value))}
                        {renderInput('Email', item.email, (e) => handleListChange('references', item.id, 'email', e.target.value))}
                    </div>
                 ))}
             </div>
        )}

      </div>
    </div>
  );
};

export default EditorPanel;