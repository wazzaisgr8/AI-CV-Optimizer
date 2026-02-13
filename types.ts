
export interface Employment {
  title: string;
  company: string;
  dates: string;
  responsibilities: string;
  achievements: string[];
}

export interface Education {
  degree: string;
  institution: string;
}

export interface CVProfile {
  headline: { text: string; score: number; feedback: string };
  profileSummary: { text: string; score: number; feedback: string };
  careerHighlights: { items: string[]; score: number; feedback: string };
  keyCompetencies: { items: string[]; score: number; feedback: string };
  employmentHistory: { items: Employment[]; score: number; feedback: string };
  educationHistory: { items: Education[]; score: number; feedback: string };
  clarifyingQuestions: string[];
}


export interface CVSuggestion {
  section: keyof Omit<CVProfile, 'clarifyingQuestions'>;
  originalText: string | string[] | Employment[] | Education[];
  suggestedText: string | string[] | Employment[] | Education[];
  reasoning: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  date: string;
  jobDescription: string;
  matchScore: number;
  suggestions: CVSuggestion[];
  tailoredCV: CVProfile;
}
