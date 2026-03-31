"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';
import { getTestById } from '@/lib/tests-registry';

const writingQuestions = [
  {
    id: 'W_AT_02_Task1',
    type: 'writing' as const,
    question: `The graph below shows the population growth in three different countries from 2000 to 2020.

Write a report for a university lecturer describing the information shown below.`,
    instructions: `You should write at least 150 words.
Allow approximately 20 minutes for this task.
Write in an academic style.`,
    image: '/images/writing-task2-graph.png'
  },
  {
    id: 'W_AT_02_Task2',
    type: 'writing' as const,
    question: `Some people believe that traditional classroom education is becoming obsolete, while others argue that it will always be essential.

Discuss both these views and give your own opinion.`,
    instructions: `You should write at least 250 words.
Allow approximately 40 minutes for this task.
Give reasons for your answer and include any relevant examples from your own knowledge or experience.`,
  }
];

export default function WritingTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const testConfig = getTestById('W_AT_02');

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const getWordCount = (text: string): number => {
    return text.split(/\s+/).filter((word: string) => word.length > 0).length;
  };

  const getMinimumWords = (questionId: string): number => {
    return questionId.includes('Task1') ? 150 : 250;
  };

  return (
    <TestInterface
      testId="W_AT_02"
      testType="writing"
      title={testConfig?.title || 'Academic Writing Test 2'}
      timeLimit={testConfig?.duration || 60}
      userId="student_001"
    >
      <div className="space-y-8">
        {/* Writing Test Instructions */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-3">Writing Test Instructions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Task 1 (20 minutes)</h3>
              <ul className="space-y-1 text-sm text-green-600">
                <li>• Minimum 150 words</li>
                <li>• Describe visual information</li>
                <li>• Academic writing style</li>
                <li>• Report format</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Task 2 (40 minutes)</h3>
              <ul className="space-y-1 text-sm text-green-600">
                <li>• Minimum 250 words</li>
                <li>• Essay writing</li>
                <li>• Discuss and give opinion</li>
                <li>• Include examples</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Task 1 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Task 1</h2>
            <p className="text-sm text-gray-600 mt-1">Report Writing (Minimum 150 words)</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                {writingQuestions[0].question}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {writingQuestions[0].instructions}
                </p>
              </div>
            </div>

            {/* Graph Image Placeholder */}
            <div className="mb-6">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                </svg>
                <p className="text-gray-600 font-medium">Graph: Population Growth 2000-2020</p>
                <p className="text-sm text-gray-500 mt-2">Sample graph showing population trends in three countries</p>
              </div>
            </div>

            <QuestionRenderer
              question={writingQuestions[0]}
              value={answers[writingQuestions[0].id]}
              onChange={(answer) => updateAnswer(writingQuestions[0].id, answer)}
            />
          </div>
        </div>

        {/* Task 2 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Task 2</h2>
            <p className="text-sm text-gray-600 mt-1">Essay Writing (Minimum 250 words)</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed mb-4">
                {writingQuestions[1].question}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 whitespace-pre-line">
                  {writingQuestions[1].instructions}
                </p>
              </div>
            </div>

            <QuestionRenderer
              question={writingQuestions[1]}
              value={answers[writingQuestions[1].id]}
              onChange={(answer) => updateAnswer(writingQuestions[1].id, answer)}
            />
          </div>
        </div>

        {/* Word Count Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Word Count Summary</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Task 1</h4>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-800">
                  {getWordCount(answers[writingQuestions[0].id] || '')}
                </span>
                <span className="text-sm text-gray-600">/ {getMinimumWords(writingQuestions[0].id)} min</span>
              </div>
              {getWordCount(answers[writingQuestions[0].id] || '') < getMinimumWords(writingQuestions[0].id) && (
                <p className="text-sm text-red-600 mt-2">⚠️ Below minimum word count</p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Task 2</h4>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-gray-800">
                  {getWordCount(answers[writingQuestions[1].id] || '')}
                </span>
                <span className="text-sm text-gray-600">/ {getMinimumWords(writingQuestions[1].id)} min</span>
              </div>
              {getWordCount(answers[writingQuestions[1].id] || '') < getMinimumWords(writingQuestions[1].id) && (
                <p className="text-sm text-red-600 mt-2">⚠️ Below minimum word count</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </TestInterface>
  );
}
