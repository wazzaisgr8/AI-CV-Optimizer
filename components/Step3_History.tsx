
import React from 'react';
import type { JobApplication } from '../types';
import { BriefcaseIcon, ClockIcon } from './Icons';

interface Step3_HistoryProps {
  applications: JobApplication[];
  onViewApplication: (application: JobApplication) => void;
  onNewApplication: () => void;
}

export const Step3_History: React.FC<Step3_HistoryProps> = ({ applications, onViewApplication, onNewApplication }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <ClockIcon className="w-10 h-10 text-cyan-400" />
                <div>
                    <h2 className="text-3xl font-bold">Application History</h2>
                    <p className="text-slate-400">Review your past tailored CVs.</p>
                </div>
            </div>
          <button
            onClick={onNewApplication}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <BriefcaseIcon className="w-5 h-5 mr-2" />
            Start New Application
          </button>
        </div>

        {applications.length === 0 ? (
          <p className="text-center text-slate-400 py-8">You haven't saved any applications yet.</p>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="bg-slate-900/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:bg-slate-700/50">
                <div className="flex-grow">
                  <p className="font-bold text-lg text-cyan-300">{app.jobTitle}</p>
                  <p className="text-sm text-slate-400">{app.company} - Applied on {app.date}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-xs text-slate-400">Match Score</p>
                        <p className="text-xl font-bold text-emerald-400">{app.matchScore}%</p>
                    </div>
                    <button
                        onClick={() => onViewApplication(app)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-md transition-colors"
                    >
                        View
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
