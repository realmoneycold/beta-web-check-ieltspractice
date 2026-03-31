"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';

const readingQuestions = [
  {
    id: 'R_AP_01_Q1',
    type: 'multiple-choice' as const,
    question: 'According to the passage, what is the primary cause of climate change mentioned?',
    options: [
      'Natural climate cycles',
      'Human activities and greenhouse gas emissions',
      'Solar radiation variations',
      'Volcanic eruptions'
    ],
  },
  {
    id: 'R_AP_01_Q2',
    type: 'true-false' as const,
    question: 'The passage states that renewable energy sources can completely replace fossil fuels by 2030.',
  },
  {
    id: 'R_AP_01_Q3',
    type: 'multiple-choice' as const,
    question: 'What does the author suggest is the most effective immediate action individuals can take?',
    options: [
      'Invest in renewable energy companies',
      'Reduce personal carbon footprint through lifestyle changes',
      'Participate in climate protests',
      'Support government environmental policies'
    ],
  },
  {
    id: 'R_AP_01_Q4',
    type: 'text' as const,
    question: 'Briefly explain the concept of "carbon offsetting" as described in the passage.',
  },
  {
    id: 'R_AP_01_Q5',
    type: 'multiple-choice' as const,
    question: 'According to the text, which sector contributes most to global carbon emissions?',
    options: [
      'Transportation',
      'Agriculture',
      'Energy production',
      'Industrial manufacturing'
    ],
  }
];

export default function ReadingTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  return (
    <TestInterface
      testId="R_AP_01"
      testType="reading"
      title="IELTS Academic Reading Test 1"
      timeLimit={60}
      userId="student_001" // This would come from authentication
    >
      <div className="space-y-6">
        {/* Reading Passage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reading Passage</h2>
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700 leading-relaxed">
              Climate change represents one of the most significant challenges facing humanity in the 21st century. 
              The scientific consensus overwhelmingly indicates that human activities, particularly the burning of 
              fossil fuels and deforestation, are the primary drivers of the unprecedented rise in global temperatures 
              since the Industrial Revolution.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              The Intergovernmental Panel on Climate Change (IPCC) has established that limiting global warming to 
              1.5°C above pre-industrial levels requires unprecedented changes in all aspects of society. While 
              renewable energy sources such as solar, wind, and hydroelectric power offer promising alternatives to 
              fossil fuels, their implementation faces significant technical and economic challenges that cannot be 
              overcome overnight.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Individual actions, though seemingly small in the face of such a global challenge, collectively contribute 
              to meaningful change. Simple lifestyle modifications such as reducing energy consumption, adopting 
              plant-based diets, and supporting sustainable businesses can significantly reduce one's carbon footprint. 
              Furthermore, the concept of carbon offsetting allows individuals and organizations to compensate for their 
              emissions by investing in projects that reduce greenhouse gases elsewhere.
            </p>
            <p className="text-gray-700 leading-relaxed">
              The energy sector remains the largest contributor to global carbon emissions, accounting for approximately 
              35% of total emissions. Transportation follows closely behind, while industrial processes and agriculture 
              also play significant roles. Addressing climate change requires a comprehensive approach that combines 
              technological innovation, policy changes, and individual commitment to sustainable practices.
            </p>
          </div>
        </div>

        {/* Questions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Questions</h2>
          <div className="space-y-6">
            {readingQuestions.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(answer) => updateAnswer(question.id, answer)}
              />
            ))}
          </div>
        </div>
      </div>
    </TestInterface>
  );
}
