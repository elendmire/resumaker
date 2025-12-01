import React from 'react';
import { ResumeData } from '../types';

interface ResumePreviewProps {
  data: ResumeData;
  previewRef: React.RefObject<HTMLDivElement>;
  isExporting?: boolean;
}

// Helper to format YYYY-MM to MMM YYYY
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString + '-01'); // Append day to make it parseable
  // Check for invalid date
  if (isNaN(date.getTime())) return dateString; 
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const formatPeriod = (start: string, end: string, isCurrent: boolean) => {
  const startStr = formatDate(start);
  if (isCurrent) return `${startStr} – Present`;
  const endStr = formatDate(end);
  return startStr && endStr ? `${startStr} – ${endStr}` : startStr || endStr;
};

// Helper to check if a section has valid content to display
const hasContent = (section: any[], type: 'education' | 'experience' | 'projects' | 'skills') => {
  if (!section || section.length === 0) return false;
  
  return section.some(item => {
    if (type === 'education') {
      return item.school?.trim() || item.degree?.trim() || (item.details && item.details.some((d: string) => d.trim()));
    }
    if (type === 'experience') {
      return item.company?.trim() || item.role?.trim() || (item.points && item.points.some((p: string) => p.trim()));
    }
    if (type === 'projects') {
      return item.name?.trim() || item.techStack?.trim() || (item.points && item.points.some((p: string) => p.trim()));
    }
    if (type === 'skills') {
      // Strictly require both name and items to display a skill row
      return item.name?.trim() && item.items?.trim();
    }
    return false;
  });
};

const ResumePreview: React.FC<ResumePreviewProps> = ({ data, previewRef, isExporting }) => {
  // Filter out empty contact details for the header
  const contactItems = [
    data.header.phone,
    data.header.email && <a href={`mailto:${data.header.email}`} className="hover:underline">{data.header.email}</a>,
    data.header.linkedin && <a href={`https://${data.header.linkedin}`} target="_blank" rel="noreferrer" className="hover:underline">{data.header.linkedin}</a>,
    data.header.github && <a href={`https://${data.header.github}`} target="_blank" rel="noreferrer" className="hover:underline">{data.header.github}</a>,
    data.header.website && <a href={`https://${data.header.website}`} target="_blank" rel="noreferrer" className="hover:underline">{data.header.website}</a>
  ].filter(item => typeof item === 'string' ? item.trim() !== '' : true);

  return (
    <div 
      ref={previewRef}
      id="resume-preview"
      className="resume-preview-page bg-white p-[12mm] text-black resume-font text-[10.5pt] leading-normal relative"
    >
      {/* Visual Page Break Indicator - Hidden during Export */}
      {!isExporting && (
         <div 
            className="absolute left-0 right-0 h-4 bg-gray-100 border-y-2 border-dashed border-gray-300 flex items-center justify-center pointer-events-none z-50 opacity-80"
            style={{ top: '297mm' }}
         >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2">End of Page 1</span>
         </div>
      )}

      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold mb-2 tracking-wide">{data.header.name}</h1>
        <div className="flex justify-center flex-wrap gap-x-2 text-[10pt] text-black">
          {contactItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-gray-300">|</span>}
              {item}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Education */}
      {hasContent(data.education, 'education') && (
        <section className="mb-4">
          <h2 className="uppercase font-bold border-b border-black mb-2 text-[11pt] tracking-wider">Education</h2>
          {data.education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between font-bold">
                <span>{edu.school}</span>
                <span>{edu.location}</span>
              </div>
              <div className="flex justify-between italic mb-1">
                <span>
                  {edu.degree}
                  {edu.gpa && <span className="not-italic text-gray-700 font-normal">, {edu.gpa} GPA</span>}
                </span>
                <span>{formatPeriod(edu.startDate, edu.endDate, edu.isCurrent)}</span>
              </div>
              {edu.details.map((detail, idx) => {
                 if (!detail || detail.trim() === '') return null;
                 return (
                  <p key={idx} className="text-[10pt] pl-4 -indent-4">
                    <span className="font-bold text-[12pt] leading-[0] mr-1">•</span>
                    {detail}
                  </p>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {hasContent(data.experience, 'experience') && (
        <section className="mb-4">
          <h2 className="uppercase font-bold border-b border-black mb-2 text-[11pt] tracking-wider">Experience</h2>
          {data.experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between">
                <span className="font-bold">{exp.company}</span>
                <span>{formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}</span>
              </div>
              <div className="flex justify-between italic mb-1">
                <span>{exp.role}</span>
                <span>{exp.location}</span>
              </div>
              <ul className="list-none m-0 p-0">
                {exp.points.map((point, idx) => {
                   if (!point || point.trim() === '') return null;
                   return (
                    <li key={idx} className="pl-4 relative mb-0.5">
                       <span className="absolute left-0 top-1.5 w-1 h-1 bg-black rounded-full"></span>
                       {point}
                    </li>
                   );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {hasContent(data.projects, 'projects') && (
        <section className="mb-4">
          <h2 className="uppercase font-bold border-b border-black mb-2 text-[11pt] tracking-wider">Projects</h2>
          {data.projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <div className="flex justify-between">
                <div className="flex gap-2 items-baseline">
                  <span className="font-bold underline">{proj.name}</span>
                  {proj.techStack && <span className="italic text-gray-800">| {proj.techStack}</span>}
                </div>
                <span>{formatPeriod(proj.startDate, proj.endDate, proj.isCurrent)}</span>
              </div>
              <ul className="list-none m-0 p-0 mt-1">
                {proj.points.map((point, idx) => {
                  if (!point || point.trim() === '') return null;
                  return (
                    <li key={idx} className="pl-4 relative mb-0.5">
                       <span className="absolute left-0 top-1.5 w-1 h-1 bg-black rounded-full"></span>
                       {point}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {hasContent(data.skills, 'skills') && (
        <section>
          <h2 className="uppercase font-bold border-b border-black mb-2 text-[11pt] tracking-wider">Skills</h2>
          <div className="flex flex-col gap-1">
            {data.skills.map((skill) => {
              // Hide the row if Category or Items are empty
              if (!skill.name?.trim() || !skill.items?.trim()) return null;
              
              return (
                <div key={skill.id} className="flex">
                  <span className="font-bold mr-2 whitespace-nowrap">{skill.name}:</span>
                  <span>{skill.items}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ResumePreview;