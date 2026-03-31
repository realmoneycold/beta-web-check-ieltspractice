"use client";

import { useState } from 'react';
import { TESTS_REGISTRY } from '@/lib/tests-registry';

interface TestCard {
  id: string;
  title: string;
  type: 'reading' | 'listening' | 'writing' | 'speaking';
  duration: number;
  description: string;
  icon: string;
  color: string;
}

const testCards = TESTS_REGISTRY;

export default function DashboardPage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const getTestUrl = (testId: string, testType: string) => {
    return `/test/${testType}/${testId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IELTS Practice Platform</h1>
              <p className="text-sm text-gray-600">Choose a test to begin your practice session</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Student: Demo User</span>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                D
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Reading', 'Listening', 'Writing', 'Speaking'].map((skill) => (
              <div key={skill} className="text-center">
                <div className="text-2xl font-bold text-gray-800">0/10</div>
                <div className="text-sm text-gray-600">{skill} Tests</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Grid */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-6">Available Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testCards.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedTest(test.id)}
              >
                <div className={`h-2 ${test.color} rounded-t-lg`}></div>
                <div className="p-6">
                  <div className="text-3xl mb-3 text-center">{test.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{test.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>⏱️ {test.duration} min</span>
                    <span className="capitalize">{test.type}</span>
                  </div>

                  <a
                    href={getTestUrl(test.id, test.type)}
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Navigate to test
                    }}
                  >
                    Start Test
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Overall Band Score</h3>
            <div className="text-3xl font-bold text-blue-600">-</div>
            <p className="text-sm text-gray-600">Complete tests to see your score</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Tests Completed</h3>
            <div className="text-3xl font-bold text-green-600">0</div>
            <p className="text-sm text-gray-600">Out of 40 total tests</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Study Streak</h3>
            <div className="text-3xl font-bold text-orange-600">0</div>
            <p className="text-sm text-gray-600">Days in a row</p>
          </div>
        </div>
      </main>
    </div>
  );
}
