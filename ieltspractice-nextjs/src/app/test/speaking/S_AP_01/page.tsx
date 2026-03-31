"use client";

import { useState } from 'react';
import TestInterface from '@/components/TestInterface';
import QuestionRenderer from '@/components/QuestionRenderer';

const speakingQuestions = [
  {
    id: 'S_AP_01_Part1',
    type: 'speaking' as const,
    question: "Let's talk about your hometown. What do you like most about the place where you grew up?",
    instructions: "Speak for 1-2 minutes. Mention specific places, people, or memories that make your hometown special to you."
  },
  {
    id: 'S_AP_01_Part2',
    type: 'speaking' as const,
    question: "Describe a memorable journey you have taken. You should say: where you went, who you traveled with, what you did during the journey, and explain why this journey was memorable.",
    instructions: "You have 1 minute to prepare, then speak for 2-3 minutes. Take notes if needed."
  },
  {
    id: 'S_AP_01_Part3',
    type: 'speaking' as const,
    question: "How has tourism changed in your country over the past few decades? Do you think these changes have been mostly positive or negative?",
    instructions: "Discuss the impact of tourism on culture, economy, and environment. Speak for 2-3 minutes."
  }
];

export default function SpeakingTestPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPart, setCurrentPart] = useState(1);
  const [preparationTime, setPreparationTime] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);

  const updateAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const startPreparation = (partNumber: number) => {
    setCurrentPart(partNumber);
    setPreparationTime(60); // 1 minute preparation
    setIsPreparing(true);
    
    const timer = setInterval(() => {
      setPreparationTime(prev => {
        if (prev <= 1) {
          setIsPreparing(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <TestInterface
      testId="S_AP_01"
      testType="speaking"
      title="IELTS Speaking Test 1"
      timeLimit={14} // 11-14 minutes for speaking test
      userId="student_001"
    >
      <div className="space-y-8">
        {/* Speaking Test Instructions */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-purple-800 mb-3">Speaking Test Instructions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-purple-700 mb-2">Part 1 (4-5 min)</h3>
              <ul className="space-y-1 text-sm text-purple-600">
                <li>• Introduction & interview</li>
                <li>• General questions</li>
                <li>• Personal topics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-700 mb-2">Part 2 (3-4 min)</h3>
              <ul className="space-y-1 text-sm text-purple-600">
                <li>• 1 minute preparation</li>
                <li>• 2-3 minute talk</li>
                <li>• Cue card topic</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-700 mb-2">Part 3 (4-5 min)</h3>
              <ul className="space-y-1 text-sm text-purple-600">
                <li>• Two-way discussion</li>
                <li>• Abstract topics</li>
                <li>• In-depth questions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Part 1 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-purple-50">
            <h2 className="text-xl font-bold text-gray-800">Part 1: Introduction and Interview</h2>
            <p className="text-sm text-gray-600 mt-1">Duration: 4-5 minutes</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Examiner Instructions:</strong> Ask follow-up questions about hobbies, family, work/studies, 
                  and other personal topics. Maintain a natural conversation flow.
                </p>
              </div>
            </div>

            <QuestionRenderer
              question={speakingQuestions[0]}
              value={answers[speakingQuestions[0].id]}
              onChange={(answer) => updateAnswer(speakingQuestions[0].id, answer)}
            />
          </div>
        </div>

        {/* Part 2 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-purple-50">
            <h2 className="text-xl font-bold text-gray-800">Part 2: Individual Long Turn</h2>
            <p className="text-sm text-gray-600 mt-1">Duration: 3-4 minutes (including 1 minute preparation)</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              {/* Cue Card Design */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-4">
                <div className="text-center mb-4">
                  <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                    CUE CARD
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  Describe a memorable journey you have taken
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>You should say:</p>
                  <ul className="space-y-1 ml-4">
                    <li>• <strong>where</strong> you went</li>
                    <li>• <strong>who</strong> you traveled with</li>
                    <li>• <strong>what</strong> you did during the journey</li>
                    <li>• and explain <strong>why</strong> this journey was memorable</li>
                  </ul>
                </div>
              </div>

              {/* Preparation Timer */}
              {isPreparing && currentPart === 2 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 text-center">
                  <p className="text-orange-800 font-semibold">Preparation Time</p>
                  <p className="text-3xl font-bold text-orange-600">{preparationTime}s</p>
                  <p className="text-sm text-orange-600 mt-1">Take notes below</p>
                </div>
              )}

              {!isPreparing && currentPart === 2 && (
                <button
                  onClick={() => startPreparation(2)}
                  className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors font-semibold mb-4"
                >
                  Start 1-Minute Preparation
                </button>
              )}
            </div>

            <QuestionRenderer
              question={speakingQuestions[1]}
              value={answers[speakingQuestions[1].id]}
              onChange={(answer) => updateAnswer(speakingQuestions[1].id, answer)}
            />
          </div>
        </div>

        {/* Part 3 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b bg-purple-50">
            <h2 className="text-xl font-bold text-gray-800">Part 3: Two-way Discussion</h2>
            <p className="text-sm text-gray-600 mt-1">Duration: 4-5 minutes</p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Examiner Instructions:</strong> Ask abstract questions related to the Part 2 topic. 
                  Encourage detailed responses, opinions, and analysis. Discuss broader implications.
                </p>
              </div>

              {/* Additional discussion prompts */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Additional Topics to Discuss:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• The impact of budget travel vs. luxury travel</li>
                  <li>• How social media has changed travel experiences</li>
                  <li>• Environmental concerns in tourism</li>
                  <li>• Cultural exchange through travel</li>
                </ul>
              </div>
            </div>

            <QuestionRenderer
              question={speakingQuestions[2]}
              value={answers[speakingQuestions[2].id]}
              onChange={(answer) => updateAnswer(speakingQuestions[2].id, answer)}
            />
          </div>
        </div>

        {/* Recording Tips */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">Recording Tips</h3>
          <ul className="space-y-2 text-purple-700">
            <li>• 🎤 Use a quiet room with minimal background noise</li>
            <li>• 📱 Keep your device 6-8 inches from your mouth</li>
            <li>• ⏰ Speak clearly at a natural pace</li>
            <li>• 🎯 Use a range of vocabulary and grammar structures</li>
            <li>• 💭 Don't worry about small mistakes - fluency is key</li>
            <li>• 🔊 Test your microphone before starting the test</li>
          </ul>
        </div>
      </div>
    </TestInterface>
  );
}
