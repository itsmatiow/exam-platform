import { useState, useEffect, useCallback } from "react";

export function TakeTest({ testId, onComplete }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  const shuffleArray = (array) => {
    const indices = array.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  };

  useEffect(() => {
    const loadTest = async () => {
      try {
        const { test: testData } = await api.getTest(testId);
        setTest(testData);

        setAnswers(new Array(testData.questions.length).fill(null));

        const shuffled = testData.questions.map((q) => shuffleArray(q.options));
        setShuffledOptions(shuffled);

        setTimeLeft(testData.timer * 60);
      } catch (err) {
        console.error("Failed to load test:", err);
        alert("خطا در بارگذاری آزمون");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, [testId]);

  const submitTest = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userId = getUserId();
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const mappedAnswers = answers.map((answer, qIndex) => {
        if (answer === null) return -1;
        return shuffledOptions[qIndex][answer];
      });

      const { submissionId } = await api.submitTest(
        testId,
        mappedAnswers,
        userId,
        timeTaken,
      );

      onComplete(submissionId);
    } catch (err) {
      console.error("Failed to submit test:", err);
      alert("خطا در ارسال آزمون");
      setIsSubmitting(false);
    }
  }, [testId, answers, shuffledOptions, onComplete, startTime, isSubmitting]);

  // TIMER
  useEffect(() => {
    if (!test || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, timeLeft, submitTest]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = optionIndex;
    setAnswers(newAnswers);
  };

  const goToNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (test.allowBackNavigation && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    const unanswered = answers.filter((a) => a === null).length;
    if (unanswered > 0) {
      if (!confirm(`شما ${unanswered} سوال بی‌پاسخ دارید. ثبت شود؟`)) {
        return;
      }
    }
    submitTest();
  };

  // Loading
  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <Card className="p-8 text-center">
          <p>در حال بارگذاری...</p>
        </Card>
      </div>
    );
  }

  if (!test) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <Card className="p-8 text-center">آزمون یافت نشد</Card>
      </div>
    );
  }

  if (timeLeft === 0 && isSubmitting) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <Card className="p-8 text-center">در حال ارسال...</Card>
      </div>
    );
  }

  const question = test.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / test.questions.length) * 100;
  const isTimeRunningOut = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2>{test.title}</h2>

              <div
                className={`flex items-center gap-2 ${
                  isTimeRunningOut ? "text-red-600" : ""
                }`}
              >
                <Clock className="size-5" />
                <span className="tabular-nums">{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  سوال {currentQuestion + 1} از {test.questions.length}
                </span>
                <span>{Math.round(progress)}% تکمیل شده</span>
              </div>
              <Progress value={progress} />
            </div>
          </div>
        </Card>

        {/* Question */}
        <Card className="p-6">
          <div className="space-y-6">
            {/* Question Text */}
            {question.imageUrl && (
              <div className="mb-4">
                <ImageWithFallback
                  src={question.imageUrl}
                  alt="سوال"
                  className="h-auto max-h-64 max-w-full rounded border"
                />
              </div>
            )}

            {question.text && (
              <p className="whitespace-pre-wrap">{question.text}</p>
            )}

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((_, originalIndex) => {
                const shuffledIndex =
                  shuffledOptions[currentQuestion][originalIndex];
                const optionText = question.options[shuffledIndex];
                const isSelected = answers[currentQuestion] === originalIndex;

                return (
                  <button
                    key={originalIndex}
                    onClick={() => handleAnswer(originalIndex)}
                    className={`w-full rounded-lg border-2 p-4 text-right ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex size-5 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="size-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span>{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {currentQuestion === test.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "در حال ارسال..." : "ثبت آزمون"}
            </Button>
          ) : (
            <Button onClick={goToNext} className="flex-1">
              بعدی <ChevronLeft className="mr-2 size-4" />
            </Button>
          )}

          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentQuestion === 0 || !test.allowBackNavigation}
          >
            <ChevronRight className="ml-2 size-4" /> قبلی
          </Button>
        </div>

        {/* Answer Overview */}
        <Card className="p-4">
          <p className="mb-3 text-sm">پیشرفت پاسخ‌ها</p>

          <div className="flex flex-wrap gap-2">
            {answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`flex size-10 items-center justify-center rounded text-sm ${
                  index === currentQuestion
                    ? "bg-blue-500 text-white"
                    : answer !== null
                      ? "border border-green-300 bg-green-100 text-green-800"
                      : "border border-gray-300 bg-gray-100 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
