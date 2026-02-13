
import { GoogleGenAI, Type } from "@google/genai";
import type { CVProfile, CVSuggestion } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models['gemini-3-pro-preview'];

const cvProfileSchema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.OBJECT, properties: { text: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}},
    profileSummary: { type: Type.OBJECT, properties: { text: {type: Type.STRING}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}},
    careerHighlights: { type: Type.OBJECT, properties: { items: {type: Type.ARRAY, items: {type: Type.STRING}}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}},
    keyCompetencies: { type: Type.OBJECT, properties: { items: {type: Type.ARRAY, items: {type: Type.STRING}}, score: {type: Type.NUMBER}, feedback: {type: Type.STRING}}},
    employmentHistory: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              dates: { type: Type.STRING },
              responsibilities: { type: Type.STRING },
              achievements: { type: Type.ARRAY, items: { type: Type.STRING } },
            }
          }
        },
        score: {type: Type.NUMBER},
        feedback: {type: Type.STRING}
      }
    },
    educationHistory: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              institution: { type: Type.STRING },
            }
          }
        },
        score: {type: Type.NUMBER},
        feedback: {type: Type.STRING}
      }
    },
    clarifyingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};


export const analyzeInitialDocuments = async (cvText: string, linkedinUrl: string): Promise<CVProfile> => {
    const systemInstruction = `You are an expert career coach and CV writer. Your task is to analyze the provided CV text and LinkedIn profile URL.
1. Extract and structure the information from the CV into the provided JSON schema.
2. For each section (headline, summary, etc.), provide a brief, constructive feedback and an effectiveness score from 0 to 100 based on industry best practices (e.g., STAR format for achievements, keyword density for summary).
3. Identify any gaps or areas needing more detail to create a complete, compelling profile, considering information that is typically found on a LinkedIn profile but might be missing.
4. Formulate 1-3 clarifying questions to ask the user to fill these gaps.
Your entire output must be a single, valid JSON object matching the provided schema.`;

    const prompt = `
      CV Text:
      ---
      ${cvText}
      ---

      LinkedIn Profile URL:
      ---
      ${linkedinUrl}
      ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: cvProfileSchema,
            }
        });

        const jsonText = response.text;
        if (!jsonText) {
          throw new Error("API returned no text");
        }
        return JSON.parse(jsonText) as CVProfile;
    } catch (error) {
        console.error("Error analyzing documents:", error);
        throw new Error("Failed to analyze documents with Gemini API.");
    }
};

const suggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        jobTitle: {type: Type.STRING},
        company: {type: Type.STRING},
        matchScore: { type: Type.NUMBER, description: "An integer from 0 to 100 on how well the tailored CV matches the job description." },
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    section: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    suggestedText: {
                        oneOf: [
                            { type: Type.STRING },
                            { type: Type.ARRAY, items: { type: Type.STRING } },
                            { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, company: {type: Type.STRING}, dates: {type: Type.STRING}, responsibilities: {type: Type.STRING}, achievements: {type: Type.ARRAY, items: {type: Type.STRING}}} } },
                            { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { degree: {type: Type.STRING}, institution: {type: Type.STRING}} } }
                        ]
                    }
                }
            }
        }
    }
};

// Helper function to convert strings like "Profile Summary" to "profileSummary"
const toCamelCase = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
};

export const analyzeJobAndSuggestImprovements = async (
  profile: CVProfile,
  jobDescription: string
): Promise<{ matchScore: number; suggestions: CVSuggestion[]; jobTitle: string; company: string; }> => {
  
  const systemInstruction = `You are an AI assistant that helps job seekers tailor their CV. Given a candidate's baseline CV in JSON format and a job description, your goal is to:
1. Identify the Job Title and Company from the job description.
2. Analyze the job description for key requirements, skills, and company culture.
3. Suggest specific improvements for each section of the CV to maximize alignment with the role. Frame achievements in STAR format.
4. For each suggestion, provide a brief reasoning.
5. Provide an overall 'matchScore' (0-100) representing how well the *improved* CV matches the job description.
Your entire output MUST be a single, valid JSON object matching the provided schema.`;
  
  const prompt = `
    Candidate's Baseline CV:
    ---
    ${JSON.stringify(profile, null, 2)}
    ---

    Job Description:
    ---
    ${jobDescription}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: suggestionsSchema
        }
    });

    const jsonText = response.text;
     if (!jsonText) {
      throw new Error("API returned no text");
    }

    const result = JSON.parse(jsonText);
    
    // The Gemini API may not return originalText, so we map it back.
    const suggestionsWithOriginals: CVSuggestion[] = result.suggestions.map((sug: any) => {
        // Normalize the section key to match the CVProfile object keys
        const sectionKey = toCamelCase(sug.section) as keyof Omit<CVProfile, 'clarifyingQuestions'>;
        const originalSection = profile[sectionKey];
        
        let originalText: any;
        if(originalSection && typeof originalSection === 'object' && ('text' in originalSection || 'items' in originalSection)) {
             originalText = 'text' in originalSection ? originalSection.text : originalSection.items;
        } else {
            // Fallback for cases where mapping might fail
            originalText = '';
        }

        return {
            ...sug,
            section: sectionKey, // Use the consistent, camelCased key
            originalText: originalText,
        };
    });

    return { 
      matchScore: result.matchScore, 
      suggestions: suggestionsWithOriginals,
      jobTitle: result.jobTitle,
      company: result.company,
    };

  } catch (error) {
    console.error("Error analyzing job description:", error);
    throw new Error("Failed to analyze job description with Gemini API.");
  }
};
