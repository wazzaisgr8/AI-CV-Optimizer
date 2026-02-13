
import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface MatchScoreChartProps {
  score: number;
}

export const MatchScoreChart: React.FC<MatchScoreChartProps> = ({ score }) => {
  const data = [{ name: 'score', value: score }];
  
  const scoreColor = score > 80 ? '#10B981' : score > 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative group" style={{ width: '100%', height: 180 }}>
      {/* Tooltip */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 z-10 pointer-events-none">
        <p className="text-center text-xs text-slate-300">
          Score is calculated based on keyword alignment, skills match, and relevance of experience from the job description.
        </p>
      </div>

      <ResponsiveContainer>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
          barSize={20}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            angleAxisId={0}
            fill={scoreColor}
            cornerRadius={10}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-current text-4xl font-bold"
            style={{ fill: scoreColor }}
          >
            {`${score}%`}
          </text>
           <text
            x="50%"
            y="65%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-current text-sm text-slate-400"
          >
            Match Score
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};
