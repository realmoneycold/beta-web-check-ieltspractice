"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';

const listeningQuestions = [
  {
    id: 'L_AP_01_Q1',
    type: 'multiple-choice' as const,
    question: 'What is the main purpose of the lecture?',
    audioUrl: '/audio/sample-lecture.mp3', // Sample audio file
    options: [
      'To discuss the history of artificial intelligence',
      'To explain the impact of AI on modern society',
      'To compare different AI technologies',
      'To debate the ethics of AI development'
    ],
  },
  {
    id: 'L_AP_01_Q2',
    type: 'listening' as const,
    question: 'According to the speaker, what year did AI first demonstrate human-level performance in chess?',
    audioUrl: '/audio/sample-lecture.mp3',
  },
  {
    id: 'L_AP_01_Q3',
    type: 'true-false' as const,
    question: 'The speaker believes that AI will eventually replace all human jobs.',
    audioUrl: '/audio/sample-lecture.mp3',
  },
  {
    id: 'L_AP_01_Q4',
    type: 'multiple-choice' as const,
    question: 'What example does the speaker give to illustrate AI in healthcare?',
    audioUrl: '/audio/sample-lecture.mp3',
    options: [
      'Robotic surgery systems',
      'Disease diagnosis from medical images',
      'Drug discovery and development',
      'Patient monitoring systems'
    ],
  },
  {
    id: 'L_AP_01_Q5',
    type: 'listening' as const,
    question: 'What two challenges does the speaker mention for future AI development?',
    audioUrl: '/audio/sample-lecture.mp3',
  }
];

export default function ListeningTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  return (
    <TestInterface
      testId="L_AP_01"
      testType="listening"
      title="IELTS Academic Listening Test 1"
      timeLimit={30}
      userId="student_001"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">Listening Test Instructions</h2>
          <ul className="space-y-2 text-blue-700">
            <li>• You will listen to a lecture about Artificial Intelligence</li>
            <li>• You can hear the audio multiple times during the test</li>
            <li>• Take notes while listening to help answer the questions</li>
            <li>• You have 30 minutes total for this test</li>
            <li>• Answer all questions based on what you hear</li>
          </ul>
        </div>

        {/* Audio Player Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Lecture: The Impact of Artificial Intelligence</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Audio Lecture</h3>
                <p className="text-gray-600 mb-4">Duration: Approximately 5 minutes</p>
                
                {/* Audio Player */}
                <div className="bg-white rounded-lg border p-4">
                  <audio controls className="w-full">
                    <source src="/audio/sample-lecture.mp3" type="audio/mpeg" />
                    <source src="/audio/sample-lecture.ogg" type="audio/ogg" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="mt-2 text-sm text-gray-500">
                    Note: This is a sample audio. In production, actual lecture content would be provided.
                  </div>
                </div>
              </div>
            </div>
            
            {/* Transcript Preview (for demonstration) */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Sample Transcript Preview:</h4>
              <p className="text-sm text-yellow-700 italic">
                "Good morning, everyone. Today we're going to discuss the profound impact that artificial intelligence 
                has had on our modern society. When we think about AI, we often imagine science fiction movies, 
                but the reality is that AI is already integrated into many aspects of our daily lives..."
              </p>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Questions</h2>
          <div className="space-y-6">
            {listeningQuestions.map((question) => (
              <QuestionRenderer
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(answer) => updateAnswer(question.id, answer)}
              />
            ))}
          </div>
        </div>

        {/* Note-taking Area */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Notes</h3>
          <textarea
            placeholder="Take notes while listening to the lecture..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            readOnly
          />
          <p className="text-sm text-gray-500 mt-2">
            Notes are for your reference only and will not be submitted.
          </p>
        </div>
      </div>
    </TestInterface>
  );
}
