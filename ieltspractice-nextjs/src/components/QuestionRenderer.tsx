"use client";

import { useState } from 'react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'text' | 'true-false' | 'matching' | 'listening' | 'writing' | 'speaking';
  question: string;
  options?: string[];
  instructions?: string;
  audioUrl?: string;
  image?: string;
}

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (answer: any) => void;
  showCorrect?: boolean;
}

export default function QuestionRenderer({ question, value, onChange, showCorrect = false }: QuestionRendererProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const handleRecording = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // In a real implementation, you'd stop the MediaRecorder and get the blob
      // For now, we'll simulate it
      setAudioBlob(new Blob(['mock audio data'], { type: 'audio/wav' }));
      onChange('mock_audio_answer.wav');
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
      // In a real implementation, you'd start MediaRecorder here
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      // Store timer to clear it when stopping
      (window as any).recordingTimer = timer;
    }
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={showCorrect}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="true"
                checked={value === 'true'}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                disabled={showCorrect}
              />
              <span className="text-gray-700">True</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="false"
                checked={value === 'false'}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                disabled={showCorrect}
              />
              <span className="text-gray-700">False</span>
            </label>
          </div>
        );

      case 'text':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={showCorrect}
          />
        );

      case 'writing':
        return (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Word Count: {value?.split(/\s+/).filter((word: string) => word.length > 0).length || 0}</span>
              <span className="text-sm text-gray-500">Minimum words: {question.id.includes('Task1') ? '150' : '250'}</span>
            </div>
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Write your response here..."
              className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={showCorrect}
            />
          </div>
        );

      case 'listening':
        return (
          <div>
            {question.audioUrl && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <audio controls className="w-full">
                  <source src={question.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter your answer based on the audio..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={showCorrect}
            />
          </div>
        );

      case 'speaking':
        return (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Recording Instructions:</p>
              <p className="text-sm text-gray-700">{question.instructions || "Click the record button and speak clearly into your microphone."}</p>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={handleRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRecording ? `Stop Recording (${recordingTime}s)` : 'Start Recording'}
              </button>
              
              {audioBlob && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">✓ Recording saved</span>
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(audioBlob);
                      const audio = new Audio(url);
                      audio.play();
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Preview
                  </button>
                </div>
              )}
            </div>
            
            {audioBlob && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">Audio recording ready for submission</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your answer..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={showCorrect}
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Question {question.id}
        </h3>
        <p className="text-gray-700 leading-relaxed">{question.question}</p>
      </div>
      
      {question.image && (
        <div className="mb-4">
          <img 
            src={question.image} 
            alt="Question illustration" 
            className="max-w-full h-auto rounded-lg border"
          />
        </div>
      )}
      
      <div className="mb-4">
        {renderQuestionInput()}
      </div>
      
      {showCorrect && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">This answer would be evaluated automatically.</p>
        </div>
      )}
    </div>
  );
}
