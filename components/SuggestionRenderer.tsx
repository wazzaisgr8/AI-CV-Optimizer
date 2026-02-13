
import React from 'react';
import type { Employment, Education } from '../types';

type SuggestionData = string | string[] | Employment[] | Education[];

interface SuggestionRendererProps {
  data: SuggestionData;
}

const isEmploymentArray = (arr: any[]): arr is Employment[] => {
  return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'title' in arr[0] && 'company' in arr[0];
};

const isEducationArray = (arr: any[]): arr is Education[] => {
  return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'degree' in arr[0] && 'institution' in arr[0];
};

export const SuggestionRenderer: React.FC<SuggestionRendererProps> = ({ data }) => {
  if (typeof data === 'string') {
    return <p>{data}</p>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <p className="italic text-slate-500">No content provided.</p>;
    }

    if (isEmploymentArray(data)) {
      return (
        <div className="space-y-4">
          {data.map((job, index) => (
            <div key={index}>
              <p className="font-semibold">{job.title}</p>
              <p className="text-sm text-slate-300">{job.company} | {job.dates}</p>
              {job.responsibilities && <p className="text-sm my-1 text-slate-400">{job.responsibilities}</p>}
              {job.achievements && job.achievements.length > 0 && (
                <ul className="list-disc list-inside space-y-1 mt-1">
                    {job.achievements.map((ach, i) => (
                    <li key={i}>{ach}</li>
                    ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (isEducationArray(data)) {
      return (
        <div className="space-y-2">
          {data.map((edu, index) => (
            <div key={index}>
              <p className="font-semibold">{edu.degree}</p>
              <p className="text-sm text-slate-300">{edu.institution}</p>
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback for string[]
    return (
      <ul className="list-disc list-inside space-y-1">
        {data.map((item, i) => (
          typeof item === 'string' ? <li key={i}>{item}</li> : null
        ))}
      </ul>
    );
  }

  return <p className="italic text-slate-500">No content available.</p>;
};
