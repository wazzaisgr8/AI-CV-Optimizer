
import React, { useState, useEffect, useCallback } from 'react';
import type { CVProfile, JobApplication } from '../types';
import { analyzeJobAndSuggestImprovements } from '../services/geminiService';
import { Loader } from './Loader';
import { MatchScoreChart } from './MatchScoreChart';
import { WandIcon, CheckCircleIcon } from './Icons';
import { SuggestionRenderer } from './SuggestionRenderer';

interface Step2_JobMatcherProps {
  baselineProfile: CVProfile;
  existingApplication: JobApplication | null;
  onSaveApplication: (application: JobApplication) => void;
}

export const Step2_JobMatcher: React.FC<Step2_JobMatcherProps> = ({ baselineProfile, existingApplication, onSaveApplication }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<Omit<JobApplication, 'id' | 'date' | 'tailoredCV' | 'jobDescription'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingApplication) {
        setJobDescription(existingApplication.jobDescription);
        setAnalysisResult({
            matchScore: existingApplication.matchScore,
            suggestions: existingApplication.suggestions,
            jobTitle: existingApplication.jobTitle,
            company: existingApplication.company,
        });
    } else {
        setJobDescription('');
        setAnalysisResult(null);
    }
  }, [existingApplication]);


  const handleAnalyze = useCallback(async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeJobAndSuggestImprovements(baselineProfile, jobDescription);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [jobDescription, baselineProfile]);
  
  const handleSave = () => {
    if (!analysisResult) return;

    // Create a deep copy of the baseline profile to modify
    const tailoredCV = JSON.parse(JSON.stringify(baselineProfile));

    analysisResult.suggestions.forEach(suggestion => {
        const section = tailoredCV[suggestion.section];
        if (section) {
            if ('text' in section) {
                section.text = suggestion.suggestedText as string;
            } else if ('items' in section) {
                section.items = suggestion.suggestedText as any[];
            }
        }
    });

    const newApplication: JobApplication = {
        id: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        jobDescription: jobDescription,
        ...analysisResult,
        tailoredCV: tailoredCV,
    };
    onSaveApplication(newApplication);
  };


  return (
    <div className="space-y-8">
      <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-cyan-400">Job Matcher & CV Tailor</h2>
        <p className="text-slate-400 text-center mb-6">Paste a job description below to get a match score and AI-powered suggestions to tailor your CV.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <label htmlFor="job-description" className="block text-lg font-medium text-slate-300 mb-2">Job Description</label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              disabled={isLoading || !!existingApplication}
            />
          </div>
          <div className="flex flex-col items-center justify-center">
            {isLoading && <Loader text="Analyzing job and tailoring CV..." />}
            {!isLoading && !analysisResult && !existingApplication && (
              <button
                onClick={handleAnalyze}
                disabled={!jobDescription.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <WandIcon className="w-5 h-5 mr-2" />
                Analyze & Tailor CV
              </button>
            )}
            {analysisResult && (
                <div className="w-full text-center">
                    <h3 className="text-xl font-semibold">{analysisResult.jobTitle}</h3>
                    <p className="text-slate-400 mb-4">{analysisResult.company}</p>
                    <MatchScoreChart score={analysisResult.matchScore} />
                    {!existingApplication && 
                        <button
                            onClick={handleSave}
                            className="mt-6 w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
                        >
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Save This Application
                        </button>
                    }
                </div>
            )}
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        </div>
      </div>
      
      {analysisResult && (
        <div className="bg-slate-800 p-6 md:p-8 rounded-lg shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center text-cyan-400">AI-Powered Suggestions</h3>
            <div className="space-y-6">
                {analysisResult.suggestions.map((s, index) => (
                    <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <h4 className="text-lg font-bold text-cyan-400 capitalize mb-2">{s.section.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <p className="text-sm text-slate-400 mb-4 italic">"{s.reasoning}"</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h5 className="font-semibold text-slate-300 mb-1">Original</h5>
                                <div className="text-sm p-3 bg-slate-800 rounded prose prose-invert prose-sm text-slate-400 max-w-none">
                                    <SuggestionRenderer data={s.originalText} />
                                </div>
                            </div>
                            <div>
                                <h5 className="font-semibold text-emerald-300 mb-1">Suggestion</h5>
                                <div className="text-sm p-3 bg-slate-800 border border-emerald-500/50 rounded prose prose-invert prose-sm text-slate-200 max-w-none">
                                    <SuggestionRenderer data={s.suggestedText} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
};
