
import React, { useState } from 'react';
import type { CVProfile, JobApplication } from './types';
import { DocumentTextIcon, BriefcaseIcon, ClockIcon } from './components/Icons';
import { Step1_ProfileBuilder } from './components/Step1_ProfileBuilder';
import { Step2_JobMatcher } from './components/Step2_JobMatcher';
import { Step3_History } from './components/Step3_History';

type AppStep = 'profile' | 'matcher' | 'history';

export default function App() {
  const [step, setStep] = useState<AppStep>('profile');
  const [cvProfile, setCvProfile] = useState<CVProfile | null>(null);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [activeJob, setActiveJob] = useState<JobApplication | null>(null);

  const handleProfileCreated = (profile: CVProfile) => {
    setCvProfile(profile);
    setStep('matcher');
  };

  const handleApplicationSaved = (application: JobApplication) => {
    setJobApplications(prev => [...prev, application]);
    setActiveJob(null);
    setStep('history');
  };

  const handleStartNewApplication = () => {
      setActiveJob(null);
      setStep('matcher');
  }

  const handleViewApplication = (application: JobApplication) => {
      setActiveJob(application);
      setStep('matcher');
  }

  const renderStep = () => {
    switch (step) {
      case 'profile':
        return <Step1_ProfileBuilder onProfileCreated={handleProfileCreated} />;
      case 'matcher':
        if (!cvProfile) {
          setStep('profile'); // Should not happen, but as a safeguard
          return <Step1_ProfileBuilder onProfileCreated={handleProfileCreated} />;
        }
        return <Step2_JobMatcher baselineProfile={cvProfile} existingApplication={activeJob} onSaveApplication={handleApplicationSaved} />;
      case 'history':
        return <Step3_History applications={jobApplications} onViewApplication={handleViewApplication} onNewApplication={handleStartNewApplication} />;
      default:
        return <Step1_ProfileBuilder onProfileCreated={handleProfileCreated} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-cyan-400">AI CV Optimizer</h1>
            <nav className="flex space-x-2 sm:space-x-4">
              <button
                onClick={() => setStep('profile')}
                disabled={!cvProfile}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${step === 'profile' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                <DocumentTextIcon className="h-5 w-5" />
                <span className="hidden sm:inline">My Profile</span>
              </button>
              <button
                onClick={handleStartNewApplication}
                disabled={!cvProfile}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${step === 'matcher' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                <BriefcaseIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Job Matcher</span>
              </button>
              <button
                onClick={() => setStep('history')}
                disabled={jobApplications.length === 0}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${step === 'history' ? 'bg-cyan-500 text-white' : 'text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
              >
                <ClockIcon className="h-5 w-5" />
                 <span className="hidden sm:inline">History</span>
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderStep()}
      </main>
    </div>
  );
}
