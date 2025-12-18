import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  header: {
    name: "Yihui Hu",
    phone: "781-957-8508",
    email: "yihui.hu@tufts.edu",
    linkedin: "linkedin.com/in/yihuihu",
    github: "github.com/yihui-hu",
    website: "yihui.work"
  },
  education: [
    {
      id: 'edu-1',
      school: "Tufts University",
      location: "Medford, MA",
      degree: "B.S. in Computer Science",
      gpa: "3.98",
      startDate: "2021-09",
      endDate: "2025-05",
      isCurrent: false,
      details: [
        "Relevant Coursework: Data Structures, Algorithms, Mobile App Dev (Swift), Machine Structure & Assembly, Operating Systems, Database Systems, Web Programming, Linear Algebra, Discrete Math"
      ]
    }
  ],
  experience: [
    {
      id: 'exp-1',
      company: "Azuki",
      role: "Design Engineer Contractor",
      location: "Los Angeles, CA",
      startDate: "2024-09",
      endDate: "",
      isCurrent: true,
      points: [
        "Working on [under NDA] for Anime.com"
      ]
    },
    {
      id: 'exp-2',
      company: "Apple",
      role: "Software Engineer Intern",
      location: "Cupertino, CA",
      startDate: "2024-05",
      endDate: "2024-08",
      isCurrent: false,
      points: [
        "Developed high-performance prototypes for scrolling charts, achieving 30-50% CPU usage reduction",
        "Collaborated with Human Interface design team for best data viz practices and ergonomic API designs"
      ]
    },
    {
      id: 'exp-3',
      company: "Typo*",
      role: "Design Engineer",
      location: "New York City, NY",
      startDate: "2024-01",
      endDate: "2024-05",
      isCurrent: false,
      points: [
        "Implemented custom gestures, fluid transitions for iOS app using UIKit, AppKit and SwiftUI",
        "Redesigned and optimized commenting user flow, resulting in 94% increase in feature engagement"
      ]
    },
    {
      id: 'exp-4',
      company: "Markit Social",
      role: "Software Engineer Intern",
      location: "Boston, MA",
      startDate: "2023-05",
      endDate: "2024-01",
      isCurrent: false,
      points: [
        "Revamped web app with mass texting, custom form templates and creator dashboard with analytics",
        "Achieved up to 20x performance gains via parallelization and batching API calls when importing contacts",
        "Future-proofed support for upcoming features by streamlining backend Firebase functions"
      ]
    }
  ],
  projects: [
    {
      id: 'proj-1',
      name: "Are:na",
      techStack: "Swift, SwiftUI, UIKit",
      startDate: "2023-10",
      endDate: "",
      isCurrent: true,
      points: [
        "Built a native SwiftUI app for the research platform Are.na, with ~1000 active users",
        "Fine-tuned optimizations using a combination of lazy views, caching and asynchronous data loading with Combine, reducing CPU and memory usage by more than 60%"
      ]
    },
    {
      id: 'proj-2',
      name: "henesys",
      techStack: "React, JavaScript, Express, AWS, MongoDB",
      startDate: "2022-12",
      endDate: "2023-02",
      isCurrent: false,
      points: [
        "Built a super fast, community-focused & PWA-ready bookmarking app with 50+ organic users",
        "Implemented text, URL & file upload REST API endpoints, alongside custom authentication with JWT"
      ]
    }
  ],
  skills: [
    {
      id: 'skill-1',
      name: "Languages",
      items: "TypeScript, JavaScript, Swift, C, C++, HTML, CSS, Python"
    },
    {
      id: 'skill-2',
      name: "Frameworks",
      items: "React, React Native, Next.js, Node, MongoDB, PostgreSQL, Express, AWS, Firebase, Redux, SwiftUI"
    },
    {
      id: 'skill-3',
      name: "Tools",
      items: "Git, Figma, Sketch, Adobe Photoshop, Adobe Illustrator, Rive, Visual Studio Code"
    }
  ],
  references: [
    {
      id: 'ref-1',
      name: "Jane Smith",
      role: "Senior Engineering Manager",
      company: "Apple",
      email: "jane.smith@apple.com"
    }
  ]
};