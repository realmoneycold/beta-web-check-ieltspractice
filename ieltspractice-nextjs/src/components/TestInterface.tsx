"use client";

import { useState, useEffect, useCallback } from 'react';
import { submitTest } from '@/app/actions/submit-test';

interface TestInterfaceProps {
  testId: string;
  testType: 'reading' | 'listening' | 'writing' | 'speaking';
  title: string;
  timeLimit: number; // in minutes
  userId: string;
  children: React.ReactNode;
  onComplete?: (result: any) => void;
}

export default function TestInterface({ 
  testId, 
  testType, 
  title, 
  timeLimit, 
  userId, 
  children,
  onComplete 
}: TestInterfaceProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const updateAnswer = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const timeSpent = (timeLimit * 60) - timeRemaining;
    
    try {
      const result = await submitTest({
        userId,
        testId,
        answers,
        testType,
        timeSpent
      });
      
      if (result.success) {
        setIsSubmitted(true);
        onComplete?.(result);
      } else {
        alert(`Error submitting test: ${result.error}`);
      }
    } catch (error) {
      console.error('Test submission error:', error);
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
  };

  useEffect(() => {
    if (!testStarted || isSubmitted || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted, isSubmitted, timeRemaining]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Submitted!</h2>
          <p className="text-gray-600 mb-6">Your {testType} test has been successfully submitted.</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              <strong>Test Type:</strong> {testType.charAt(0).toUpperCase() + testType.slice(1)}
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Time Limit:</strong> {timeLimit} minutes
            </p>
            <p className="text-gray-600">
              <strong>Test ID:</strong> {testId}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Make sure you have a stable internet connection. 
              The test will auto-submit when time expires.
            </p>
          </div>
          <button 
            onClick={startTest}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
              <p className="text-sm text-gray-600">Test ID: {testId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <TimerDisplay timeRemaining={timeRemaining} />
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Test Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <NotepadPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

function TimerDisplay({ timeRemaining }: { timeRemaining: number }) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className={`text-lg font-mono font-semibold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

function NotepadPanel() {
  const [notes, setNotes] = useState('');

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Use this space for notes during the test..."
        className="w-full h-64 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <p className="text-xs text-gray-500 mt-2">
        Notes are saved locally and will not be submitted.
      </p>
    </div>
  );
}
