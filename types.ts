export interface ResumeHeader {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  website: string;
}

export interface EducationItem {
  id: string;
  school: string;
  location: string;
  degree: string;
  gpa?: string;
  startDate: string; // Format: YYYY-MM
  endDate: string;   // Format: YYYY-MM
  isCurrent: boolean;
  details: string[]; // Coursework, honors, etc.
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string; // Format: YYYY-MM
  endDate: string;   // Format: YYYY-MM
  isCurrent: boolean;
  points: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  techStack: string; // e.g., "Swift, SwiftUI"
  startDate: string; // Format: YYYY-MM
  endDate: string;   // Format: YYYY-MM
  isCurrent: boolean;
  points: string[];
}

export interface SkillCategory {
  id: string;
  name: string; // e.g. "Languages"
  items: string; // e.g. "TypeScript, C++"
}

export interface ReferenceItem {
  id: string;
  name: string;
  role: string;
  company: string; // "Where"
  email: string;
}

export interface ResumeData {
  header: ResumeHeader;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillCategory[];
  references: ReferenceItem[];
}