"use server";

export async function completeTest(testData: {
  userId: string;
  testId: string;
  score: number;
  testType: 'reading' | 'listening' | 'writing' | 'speaking';
}) {
  try {
    // Validate input
    if (!testData.userId || !testData.testId || typeof testData.score !== 'number') {
      throw new Error("Missing required test completion data");
    }

    // Update user progress in the database
    // Note: You'll need to import and use your Prisma client
    /*
    await prisma.userProgress.update({
      where: {
        userId_testType: {
          userId: testData.userId,
          testType: testData.testType,
        },
      },
      update: {
        latestScore: testData.score,
        testsCompleted: {
          increment: 1,
        },
        lastTestDate: new Date(),
      },
      create: {
        userId: testData.userId,
        testType: testData.testType,
        latestScore: testData.score,
        testsCompleted: 1,
        lastTestDate: new Date(),
      },
    });

    // Update user's overall band score if applicable
    const userProgress = await prisma.userProgress.findMany({
      where: { userId: testData.userId },
    });

    // Calculate overall band score based on all test types
    const overallBand = calculateOverallBand(userProgress);

    await prisma.user.update({
      where: { id: testData.userId },
      data: {
        current_band: overallBand,
        tasks_done: {
          increment: 1,
        },
      },
    });
    */

    // For now, return a mock completion result
    const completionResult = {
      userId: testData.userId,
      testId: testData.testId,
      testType: testData.testType,
      score: testData.score,
      completedAt: new Date(),
      bandScore: calculateBandScore(testData.score, testData.testType),
    };

    return {
      success: true,
      completion: completionResult,
      message: "Test completed successfully",
    };

  } catch (error) {
    console.error("Error completing test:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete test",
    };
  }
}

function calculateBandScore(score: number, testType: string): number {
  // Convert percentage score to IELTS band score (0-9)
  // This is a simplified calculation - you may need to adjust based on your scoring system
  if (score >= 90) return 9.0;
  if (score >= 85) return 8.5;
  if (score >= 80) return 8.0;
  if (score >= 75) return 7.5;
  if (score >= 70) return 7.0;
  if (score >= 65) return 6.5;
  if (score >= 60) return 6.0;
  if (score >= 55) return 5.5;
  if (score >= 50) return 5.0;
  if (score >= 45) return 4.5;
  if (score >= 40) return 4.0;
  return 3.5;
}

function calculateOverallBand(progressArray: any[]): number {
  // Calculate overall IELTS band score from all test types
  // This is a simplified calculation - adjust based on your requirements
  if (!progressArray || progressArray.length === 0) return 0;
  
  const totalScore = progressArray.reduce((sum, progress) => sum + progress.latestScore, 0);
  const averageScore = totalScore / progressArray.length;
  
  return calculateBandScore(averageScore, 'overall');
}
