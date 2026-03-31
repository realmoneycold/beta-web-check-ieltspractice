"use server";

import { revalidatePath } from "next/cache";
import { completeTest } from "./complete-test";

export async function submitReadingAnswers(testData: {
  userId: string;
  testId: string;
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
  }>;
  timeSpent: number;
  testType: 'reading' | 'listening' | 'writing' | 'speaking';
}) {
  try {
    // Validate input
    if (!testData.userId || !testData.testId || !testData.answers) {
      throw new Error("Missing required test data");
    }

    // Calculate score
    const correctAnswers = testData.answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = testData.answers.length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    // Save submission to database (using Prisma)
    // Note: You'll need to import and use your Prisma client
    /*
    const submission = await prisma.testSubmission.create({
      data: {
        userId: testData.userId,
        testId: testData.testId,
        testType: testData.testType,
        score: score,
        correctAnswers: correctAnswers,
        totalQuestions: totalQuestions,
        timeSpent: testData.timeSpent,
        answers: testData.answers,
        submittedAt: new Date(),
      },
    });
    */

    // For now, return a mock submission
    const submission = {
      id: `submission_${Date.now()}`,
      userId: testData.userId,
      testId: testData.testId,
      testType: testData.testType,
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      timeSpent: testData.timeSpent,
      submittedAt: new Date(),
    };

    // Call completeTest function
    await completeTest({
      userId: testData.userId,
      testId: testData.testId,
      score: score,
      testType: testData.testType,
    });

    // Revalidate the dashboard path to refresh the UI
    revalidatePath("/dashboard");

    return {
      success: true,
      submission: submission,
      message: "Test submitted successfully",
    };

  } catch (error) {
    console.error("Error submitting test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit test",
    };
  }
}

export async function submitTest(testData: {
  userId: string;
  testId: string;
  answers: Record<string, any>;
  testType: 'reading' | 'listening' | 'writing' | 'speaking';
  timeSpent: number;
}) {
  try {
    // Convert answers to the expected format for submitReadingAnswers
    const formattedAnswers = Object.entries(testData.answers).map(([questionId, answer]) => ({
      questionId,
      answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
      isCorrect: false, // You'll need to implement actual answer validation logic
    }));

    // Call the main submission function
    return await submitReadingAnswers({
      userId: testData.userId,
      testId: testData.testId,
      answers: formattedAnswers,
      timeSpent: testData.timeSpent,
      testType: testData.testType,
    });

  } catch (error) {
    console.error("Error in submitTest:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit test",
    };
  }
}
