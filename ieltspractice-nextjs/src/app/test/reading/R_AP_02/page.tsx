"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';
import { getTestById } from '@/lib/tests-registry';

const readingQuestions = [
  {
    id: 'R_AP_02_Q1',
    type: 'multiple-choice' as const,
    question: 'According to the passage, what is the main impact of smartphones on modern communication?',
    options: [
      'They have completely eliminated face-to-face communication',
      'They have created new forms of social interaction while changing traditional patterns',
      'They have made communication less personal and meaningful',
      'They have had no significant effect on how people communicate'
    ],
  },
  {
    id: 'R_AP_02_Q2',
    type: 'true-false' as const,
    question: 'The passage states that older generations are more adaptable to new technology than younger generations.',
  },
  {
    id: 'R_AP_02_Q3',
    type: 'multiple-choice' as const,
    question: 'What does the author suggest is the biggest challenge facing digital communication?',
    options: [
      'The cost of smartphones and data plans',
      'The lack of internet access in rural areas',
      'Finding a balance between digital and personal interaction',
      'The complexity of modern applications'
    ],
  },
  {
    id: 'R_AP_02_Q4',
    type: 'text' as const,
    question: 'Briefly explain what the author means by "digital literacy" in the context of the passage.',
  },
  {
    id: 'R_AP_02_Q5',
    type: 'multiple-choice' as const,
    question: 'According to the text, which group has benefited most from digital communication technologies?',
    options: [
      'Elderly people living alone',
      'Students in remote areas',
      'Business professionals',
      'Healthcare workers'
    ],
  }
];

export default function ReadingTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const testConfig = getTestById('R_AP_02');

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  return (
    <TestInterface
      testId="R_AP_02"
      testType="reading"
      title={testConfig?.title || 'Academic Reading Test 2'}
      timeLimit={testConfig?.duration || 60}
      userId="student_001"
    >
      <div className="space-y-6">
        {/* Reading Passage */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Reading Passage</h2>
          <div className="prose max-w-none">
            <p className="mb-4 text-gray-700 leading-relaxed">
              The proliferation of smartphones and digital communication platforms has fundamentally transformed 
              how humans interact in the 21st century. While traditional forms of communication such as 
              face-to-face conversations and handwritten letters continue to exist, they now coexist with 
              an ever-expanding array of digital alternatives that have reshaped social dynamics across 
              generations and cultures.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Research indicates that younger generations, often referred to as "digital natives," have 
              developed unique communication patterns that blend multiple platforms simultaneously. 
              They might engage in text messaging while participating in video calls and monitoring 
              social media feeds, creating what sociologists term "multimodal communication." This ability 
              to process multiple streams of information simultaneously represents a significant cognitive 
              shift from how previous generations approached social interaction.
            </p>
            <p className="mb-4 text-gray-700 leading-relaxed">
              However, this digital transformation is not without its challenges. Psychologists have raised 
              concerns about the potential impact of reduced face-to-face interaction on the development 
              of social skills, particularly among adolescents. The concept of "digital literacy" has 
              emerged as crucial, encompassing not just technical proficiency but also the ability to 
              navigate complex social dynamics in online environments while maintaining meaningful 
      relationships offline.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Despite these concerns, digital communication has enabled unprecedented connectivity. 
              Students in remote areas can now access educational resources previously unavailable to them, 
              while families separated by geographical distances can maintain daily contact through video calls. 
              The key challenge facing modern society lies in finding a sustainable balance between the 
              efficiency and convenience of digital communication and the irreplaceable value of 
              traditional, in-person interactions.
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
