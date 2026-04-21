import React, { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PYTHON_API_URL } from "../../config/api";
import { buildInterviewPdfPayload, downloadInterviewPdf, printCurrentPage } from "../../utility/reportActions";

const MAX_RECORDING_SECONDS = 5 * 60;
const MAX_UPLOAD_SIZE_MB = 100;

const scoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const AIInterviewStart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const persistedContext = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("candidateInterviewContext") || "{}");
    } catch {
      return {};
    }
  }, []);
  const context = location.state || persistedContext;
  const questions = context.questions || [];
  const sessionId = context.sessionId || "";
  const [report, setReport] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(context.sessionSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMedia, setRecordedMedia] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const joinedQuestions = useMemo(
    () => questions.map((item, index) => `${index + 1}. ${item.question}`).join("\n"),
    [questions]
  );

  const stopStreamPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const resetRecordingState = () => {
    setRecordedMedia(null);
    setRecordingTime(0);
    mediaChunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopStreamPreview();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const startRecording = async () => {
    setError("");
    setReport(null);
    resetRecordingState();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      let mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4";
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: mimeType });
        setRecordedMedia(blob);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stopStreamPreview();
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((previous) => {
          const nextValue = previous + 1;
          if (nextValue >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return nextValue;
        });
      }, 1000);
    } catch {
      setError("Could not access camera or microphone. Please allow permissions.");
    }
  };

  const persistContext = (nextData) => {
    sessionStorage.setItem(
      "candidateInterviewContext",
      JSON.stringify({
        ...context,
        ...nextData,
      })
    );
  };

  const handleAnalyzeClick = async () => {
    if (!recordedMedia) {
      setError("Please record your interview first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setReport(null);

    try {
      const fileSizeMb = recordedMedia.size / (1024 * 1024);
      if (fileSizeMb > MAX_UPLOAD_SIZE_MB) {
        throw new Error(
          `Your recording is ${fileSizeMb.toFixed(1)} MB. Please keep the upload under ${MAX_UPLOAD_SIZE_MB} MB and try again.`
        );
      }

      const formData = new FormData();
      formData.append("video", recordedMedia, "full-interview-response.webm");
      formData.append("question", joinedQuestions);
      formData.append("question_context", `Evaluate the candidate's full interview based on these questions:\n${joinedQuestions}`);
      formData.append("question_display", "Complete interview session response");
      formData.append("session_id", sessionId);
      formData.append("question_index", "0");
      formData.append("complete_session", "true");

      const response = await fetch(`${PYTHON_API_URL}/api/interview-analysis`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            data.error || `Your interview video is too large to upload. Please keep it under ${MAX_UPLOAD_SIZE_MB} MB.`
          );
        }
        if (response.status === 503) {
          throw new Error(data.error || "The AI analysis service is temporarily busy. Please wait a few seconds and try again.");
        }
        throw new Error(data.error || "Failed to analyze the interview.");
      }

      setReport(data.report || null);
      setSessionSummary(data.session || null);
      persistContext({
        sessionSummary: data.session,
        completedReports: data.report ? [data.report] : [],
      });
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing the interview.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    downloadInterviewPdf("full-interview-report.pdf", buildInterviewPdfPayload({
      candidateName: context.candidate_name || "Candidate",
      candidateEmail: context.candidate_email || "",
      jobTitle: context.jobDetails?.title || context.job?.basicDetails?.title || "Interview",
      companyName: context.job?.name || context.jobDetails?.company || "Interview Genius",
      interviewType: context.interviewType,
      difficulty: context.difficulty,
      atsReport: context.atsReport,
      questions,
      report,
    }));
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!feedbackRating) {
      window.alert("Please select a rating.");
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`${PYTHON_API_URL}/api/submit-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_email: context.candidate_email || "anonymous testing",
          rating: feedbackRating,
          comment: feedbackText,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback.");
      }
      setFeedbackSubmitted(true);
    } catch (submitError) {
      console.error(submitError);
      window.alert("Feedback submission failed.");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  if (!sessionId || questions.length === 0) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-gray-100 px-4">
        <div className="max-w-xl bg-white p-8 rounded-lg shadow-md text-center w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Interview Session Not Ready</h2>
          <p className="text-gray-600 mb-6">
            Generate the interview questions first so we can prepare your session.
          </p>
          <button
            type="button"
            onClick={() => navigate("/candidate/ai-mock-interview")}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Return To Interview Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center items-start bg-gray-100 px-4 py-8">
      <div className="bg-white max-w-5xl w-full p-8 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">AI Interview</h2>
            <p className="text-gray-600">
              Review the questions below, answer them in one recording, and then receive a full interview report.
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
            <p>
              <span className="font-semibold">Questions:</span> {questions.length}
            </p>
            <p>
              <span className="font-semibold">Time Limit:</span> {Math.floor(MAX_RECORDING_SECONDS / 60)} minutes
            </p>
            {sessionSummary && (
              <p>
                <span className="font-semibold">Status:</span> {sessionSummary.status}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <section className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Interview Questions</h3>
            <div className="space-y-3">
              {questions.map((item, index) => (
                <div key={`${item.question}-${index}`} className="bg-white border border-gray-200 rounded-md p-4">
                  <p className="text-sm font-semibold text-gray-500 mb-1">Question {index + 1}</p>
                  <p className="text-gray-800 font-medium">{item.question}</p>
                  {item.focus && <p className="text-sm text-gray-500 mt-2">Focus: {item.focus}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Before You Start</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-blue-900">
                <li>Take a moment to read all questions before recording.</li>
                <li>Answer in order and keep your examples specific to the role.</li>
                <li>Try to finish within the {Math.floor(MAX_RECORDING_SECONDS / 60)} minute limit.</li>
              </ul>
            </div>

            <div className="bg-black rounded-md overflow-hidden aspect-video flex justify-center items-center">
              {!isRecording && !recordedMedia && <div className="text-gray-400 text-sm">Camera preview will appear here</div>}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!isRecording && !recordedMedia ? "hidden" : isRecording ? "block" : "hidden"}`}
              />
              {recordedMedia && !isRecording && (
                <video controls src={URL.createObjectURL(recordedMedia)} className="w-full h-full object-contain" playsInline />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-center">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium border transition-colors ${
                  isRecording
                    ? "border-red-500 text-white bg-red-600 hover:bg-red-700"
                    : "border-blue-500 text-white bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isRecording ? "Stop Recording" : "Start Interview Recording"}
              </button>
              <span className="text-sm text-gray-600 font-mono">
                {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_SECONDS)}
              </span>
              <button
                type="button"
                onClick={handleAnalyzeClick}
                disabled={isLoading}
                className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${
                  isLoading ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Analyzing Interview..." : "Analyze Full Interview"}
              </button>
              {report && (
                <>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900"
                  >
                    Download Report
                  </button>
                  <button
                    type="button"
                    onClick={printCurrentPage}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                  >
                    Print Report
                  </button>
                </>
              )}
            </div>

            {recordedMedia && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-center">
                <p className="text-sm text-green-700">
                  Your interview recording is ready. Analyze it to generate the full report.
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Current file size: {(recordedMedia.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            )}
          </section>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-3" role="alert">
            {error}
          </p>
        )}

        {report && (
          <div className="mt-8 border-t border-gray-200 pt-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-gray-800">Interview Report</h3>
                <p className="text-gray-600 mt-1">{report.summary}</p>
              </div>
              <div className="text-center">
                <p className="text-sm uppercase tracking-wide text-gray-500">Overall Score</p>
                <div className={`text-5xl font-extrabold ${scoreColor(report.overall_score)}`}>{report.overall_score}</div>
                <div className="text-gray-400 text-lg">/100</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Transcript</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <p><span className="font-semibold">Transcript Summary:</span> {report.transcript?.summary}</p>
                  <div>
                    <p className="font-semibold mb-1">Transcript Text</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-wrap">
                      {report.transcript?.full_text || "Transcript not available."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Next-Step Guidance</h4>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Recommendations</p>
                    <ul className="space-y-2">
                      {(report.recommendations || []).map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 border-l-4 border-blue-500 pl-3">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Areas To Improve</p>
                    <ul className="space-y-2">
                      {(report.weaknesses || []).map((item, index) => (
                        <li key={index} className="text-sm text-gray-700 border-l-4 border-red-500 pl-3">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-lg p-6">
              <h4 className="text-xl font-bold text-indigo-900 mb-2">Help Us Improve AI Interviews</h4>
              <p className="text-indigo-700 mb-4 text-sm">
                Please share feedback on the overall interview experience and report quality before finishing.
              </p>
              {feedbackSubmitted ? (
                <div className="bg-green-100 text-green-800 p-4 rounded-md font-medium text-sm">
                  Thank you for your feedback! It has been saved successfully.
                </div>
              ) : (
                <form onSubmit={submitFeedback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-indigo-900 mb-1">Rating (1 - 5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`text-2xl outline-none focus:outline-none ${
                            feedbackRating >= star ? "text-yellow-500" : "text-gray-300"
                          } hover:text-yellow-400 transition-colors`}
                        >
                          *
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-indigo-900 mb-1">Comments</label>
                    <textarea
                      className="w-full border-blue-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 text-sm text-gray-800"
                      rows="3"
                      placeholder="How was the interview flow and report quality?"
                      value={feedbackText}
                      onChange={(event) => setFeedbackText(event.target.value)}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingFeedback || !feedbackRating}
                    className="bg-indigo-600 text-white px-5 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 transition-all font-medium"
                  >
                    {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </button>
                </form>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/candidate/history")}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium tracking-wide shadow-sm"
              >
                Finish Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterviewStart;
