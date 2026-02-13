
import React, { useState, useCallback } from 'react';
import type { CVProfile } from '../types';
import { analyzeInitialDocuments } from '../services/geminiService';
import { UploadIcon, WandIcon } from './Icons';
import { Loader } from './Loader';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for pdf.js, which is required for it to work in a browser environment.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.mjs`;

interface FileUploadProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, file, onFileChange, accept }) => {
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault();
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <label 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="flex justify-center w-full h-32 px-4 transition bg-slate-900/50 border-2 border-slate-700 border-dashed rounded-md appearance-none cursor-pointer hover:border-cyan-400 focus:outline-none">
        <span className="flex items-center space-x-2">
          <UploadIcon className="w-6 h-6 text-slate-500" />
          {file ? (
            <span className="font-medium text-slate-300">{file.name}</span>
          ) : (
            <span className="font-medium text-slate-500">
              Drop file or <span className="text-cyan-400">browse</span>
            </span>
          )}
        </span>
        <input type="file" name="file_upload" className="hidden" accept={accept} onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)} />
      </label>
    </div>
  );
};

interface Step1_ProfileBuilderProps {
  onProfileCreated: (profile: CVProfile) => void;
}

const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    if (file.type === 'application/pdf') {
      reader.onload = async (event) => {
        if (!event.target?.result) return reject('Failed to read PDF file.');
        try {
          const pdf = await pdfjsLib.getDocument({ data: event.target.result as ArrayBuffer }).promise;
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
          }
          resolve(textContent);
        } catch (error) {
          console.error('PDF parsing error:', error);
          reject('Error parsing PDF file. It might be corrupted or protected.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      reader.onload = async (event) => {
        if (!event.target?.result) return reject('Failed to read DOCX file.');
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: event.target.result as ArrayBuffer });
          resolve(result.value);
        } catch (error) {
          console.error('DOCX parsing error:', error);
          reject('Error parsing DOCX file.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain') {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(file);
    } else {
        reject(`Unsupported file type: ${file.type || 'unknown'}. Please upload a .docx, .pdf, or .txt file.`);
    }
  });
};


const LINKEDIN_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;

export const Step1_ProfileBuilder: React.FC<Step1_ProfileBuilderProps> = ({ onProfileCreated }) => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setLinkedinUrl(newUrl);
    if (newUrl && !LINKEDIN_REGEX.test(newUrl)) {
      setUrlError('Please enter a valid LinkedIn profile URL.');
    } else {
      setUrlError(null);
    }
  };

  const handleBuildProfile = useCallback(async () => {
    setError(null);
    if (!cvFile) {
      setError("Please upload your CV.");
      return;
    }
     if (!linkedinUrl || urlError) {
      setError("Please provide a valid LinkedIn URL.");
      return;
    }

    setIsLoading(true);
    
    try {
      const cvText = await readFileContent(cvFile);
      const profile = await analyzeInitialDocuments(cvText, linkedinUrl);
      onProfileCreated(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [cvFile, linkedinUrl, urlError, onProfileCreated]);

  const isButtonDisabled = !cvFile || !linkedinUrl || !!urlError || isLoading;

  return (
    <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-cyan-400">Welcome to the AI CV Optimizer</h2>
            <p className="text-slate-400 mt-3 text-lg">A simple two-step process to land your next interview.</p>
        </div>

      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
                <span className="bg-cyan-500 text-white font-bold rounded-full h-8 w-8 flex items-center justify-center">1</span>
                <h3 className="text-2xl font-bold">Build Your Baseline Profile</h3>
            </div>
            <p className="text-slate-400 mt-2">Upload your CV and provide your LinkedIn profile URL.</p>
        </div>
        
        {isLoading ? (
          <Loader text="Analyzing documents and building your profile..." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <FileUpload label="Upload Your CV (.docx, .pdf, .txt)" file={cvFile} onFileChange={setCvFile} accept=".docx,.pdf,.txt" />
              <div>
                <label htmlFor="linkedin-url" className="block text-sm font-medium text-slate-300 mb-2">LinkedIn Profile URL</label>
                <input
                    id="linkedin-url"
                    type="url"
                    value={linkedinUrl}
                    onChange={handleUrlChange}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    className={`w-full h-32 p-4 bg-slate-900/50 border-2 rounded-md transition-colors focus:outline-none focus:ring-2 ${urlError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500'}`}
                />
                {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
              </div>
            </div>
            {error && <p className="text-red-400 text-center mb-4">{error}</p>}
            <div className="text-center">
              <button
                onClick={handleBuildProfile}
                disabled={isButtonDisabled}
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <WandIcon className="w-5 h-5 mr-2" />
                Build My Profile
              </button>
            </div>
          </>
        )}
      </div>
       <div className="text-center mt-10 text-slate-500">
            <div className="flex items-center justify-center gap-2">
                <span className="bg-slate-700 text-slate-300 font-bold rounded-full h-8 w-8 flex items-center justify-center">2</span>
                <p className="font-bold text-lg text-slate-400">Apply for Jobs</p>
            </div>
            <p className="mt-2">Once your profile is built, you can match it against any job description.</p>
        </div>
    </div>
  );
};