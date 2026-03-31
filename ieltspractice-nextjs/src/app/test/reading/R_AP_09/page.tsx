"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';
import { getTestById } from '@/lib/tests-registry';

const readingQuestions = [
  {
    id: 'R_AP_09_Q1',
    type: 'multiple-choice' as const,
    question: 'According to the passage, what is the primary focus of this text?',
    options: [
      'Historical analysis of ancient civilizations',
      'Scientific examination of natural phenomena',
      'Social impact of technological advancement',
      'Economic principles in modern society'
    ],
  },
  {
    id: 'R_AP_09_Q2',
    type: 'true-false' as const,
    question: 'The passage suggests that the main issue will be resolved within the next decade.',
  },
  {
    id: 'R_AP_09_Q3',
    type: 'multiple-choice' as const,
    question: 'What evidence does the author provide to support the main argument?',
    options: [
      'Statistical data from recent studies',
      'Historical examples and case studies',
      'Expert testimonies and quotes',
      'Personal anecdotes and experiences'
    ],
  },
  {
    id: 'R_AP_09_Q4',
    type: 'text' as const,
    question: 'Briefly summarize the author\'s main conclusion and its implications.',
  },
  {
    id: 'R_AP_09_Q5',
    type: 'multiple-choice' as const,
    question: 'What does the author predict for the future based on current trends?',
    options: [
      'Significant improvement in the situation',
      'Continued challenges with potential solutions',
      'Rapid deterioration of conditions',
      'No significant change expected'
    ],
  }
];

export default function ReadingTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const testConfig = getTestById('R_AP_09');

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  return (
    <TestInterface
      testId="R_AP_09"
      testType="reading"
      title={testConfig?.title || 'Academic Reading Test 9'}
      timeLimit={testConfig?.duration || 60}
      userId="student_001"
    >
      <div className="space-y-6">
        {/* Reading Passage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reading Passage</h2>
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700 leading-relaxed">
              The rapid advancement of technology in the modern era has fundamentally transformed 
              how societies function and interact. From artificial intelligence to biotechnology, 
              innovations are reshaping industries, creating new opportunities, and presenting 
              unprecedented challenges that require careful consideration and strategic planning.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Experts across various fields emphasize the importance of balancing technological progress 
              with ethical considerations. While technological solutions offer tremendous potential for 
              addressing global challenges, they also raise complex questions about privacy, security, 
              and the potential for unintended consequences that could affect future generations.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Educational institutions worldwide are adapting their curricula to prepare students for 
              a future where technological literacy will be essential. This shift requires not only 
              technical skills but also the ability to think critically about the implications of 
              technological adoption and to navigate an increasingly complex digital landscape.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Looking ahead, the integration of technology into daily life will likely accelerate, 
              making it imperative for individuals, organizations, and governments to develop frameworks 
              that maximize benefits while minimizing risks. The decisions made today will shape 
              the technological landscape of tomorrow for decades to come.
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
