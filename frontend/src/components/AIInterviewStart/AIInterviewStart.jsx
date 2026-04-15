import React, { useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PYTHON_API_URL } from "../../config/api";
import { downloadJsonReport, printCurrentPage } from "../../utility/reportActions";

const scoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const reportCard = (title, score, description) => (
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
    <div className="flex items-center justify-between gap-4">
      <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
    </div>
    <p className="text-sm text-gray-600 mt-2">{description}</p>
  </div>
);

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [report, setReport] = useState(null);
  const [sessionSummary, setSessionSummary] = useState(context.sessionSummary || null);
  const [rawAnalysis, setRawAnalysis] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMedia, setRecordedMedia] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [completedReports, setCompletedReports] = useState([]);
  const mediaRecorderRef = useRef(null);
  const mediaChunksRef = useRef([]);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const activeQuestion = questions[currentIndex]?.question || "No interview question is available.";
  const isLastQuestion = currentIndex >= questions.length - 1;

  const resetRecordingState = () => {
    setRecordedMedia(null);
    setRecordingTime(0);
    mediaChunksRef.current = [];
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = async () => {
    setError("");
    setReport(null);
    setRawAnalysis("");
    setRawTranscript("");
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
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((previous) => previous + 1);
      }, 1000);
    } catch {
      setError("Could not access camera or microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
      setError("Please record your answer first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setReport(null);
    setRawAnalysis("");
    setRawTranscript("");

    try {
      const formData = new FormData();
      formData.append("video", recordedMedia, `interview-answer-${currentIndex + 1}.webm`);
      formData.append("question", activeQuestion);
      formData.append("session_id", sessionId);
      formData.append("question_index", String(currentIndex));

      const response = await fetch(`${PYTHON_API_URL}/api/interview-analysis`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze interview answer.");
      }

      setRawAnalysis(data.analysis || "");
      setRawTranscript(data.transcript_raw || "");
      setReport(data.report || null);
      setSessionSummary(data.session || null);
      const updatedReports = [...completedReports];
      updatedReports[currentIndex] = data.report;
      setCompletedReports(updatedReports);
      persistContext({
        sessionSummary: data.session,
        completedReports: updatedReports,
      });
    } catch (err) {
      setError(err.message || "Something went wrong while analyzing your answer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      navigate("/candidate/history");
      return;
    }
    setCurrentIndex((value) => value + 1);
    setReport(null);
    setRawAnalysis("");
    setRawTranscript("");
    setError("");
    resetRecordingState();
  };

  const handleDownload = () => {
    if (!report) return;
    downloadJsonReport(`interview-report-question-${currentIndex + 1}.json`, {
      generatedAt: new Date().toISOString(),
      sessionId,
      question: activeQuestion,
      report,
      sessionSummary,
    });
  };

  if (!sessionId || questions.length === 0) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-gray-100 px-4">
        <div className="max-w-xl bg-white p-8 rounded-lg shadow-md text-center w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Interview Session Not Ready</h2>
          <p className="text-gray-600 mb-6">
            Generate the interview questions first so we can save your responses into a tracked session.
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
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Real-Time AI Interview Session</h2>
            <p className="text-gray-600">
              Question {currentIndex + 1} of {questions.length}. Each analyzed answer is saved to MongoDB with its
              transcript and report.
            </p>
          </div>
          {sessionSummary && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Session Score:</span> {sessionSummary.overall_score}
              </p>
              <p>
                <span className="font-semibold">Completed:</span> {sessionSummary.responses_completed}/
                {sessionSummary.question_count}
              </p>
              <p>
                <span className="font-semibold">Status:</span> {sessionSummary.status}
              </p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Question</h3>
          <p className="text-gray-800 bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">{activeQuestion}</p>
          {questions[currentIndex]?.focus && (
            <p className="text-sm text-gray-500 mt-2">Focus: {questions[currentIndex].focus}</p>
          )}
        </div>

        <div className="mb-4">
          <div className="mb-4 bg-black rounded-md overflow-hidden relative aspect-video flex justify-center items-center">
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

          <div className="flex flex-wrap items-center gap-3 mb-2 justify-center">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium border transition-colors ${
                isRecording
                  ? "border-red-500 text-white bg-red-600 hover:bg-red-700"
                  : "border-blue-500 text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isRecording ? "Stop Recording" : "Start Video Recording"}
            </button>
            {isRecording && (
              <span className="text-sm text-gray-600 font-mono">
                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}
              </span>
            )}
            <button
              type="button"
              onClick={handleAnalyzeClick}
              disabled={isLoading}
              className={`bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors ${
                isLoading ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Analyzing..." : "Analyze Answer"}
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
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="text-sm text-green-700">Video recorded. Run analysis to save this answer into your session.</p>
            </div>
          )}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reportCard("Relevance", report.verbal_analysis?.relevance_score || 0, "How directly the answer addressed the interview question.")}
              {reportCard("Clarity", report.verbal_analysis?.clarity_score || 0, "How clearly and coherently the answer was delivered.")}
              {reportCard("Confidence", report.verbal_analysis?.confidence_score || 0, "How confident and assured the overall response appeared.")}
              {reportCard("Structure", report.content_analysis?.structure_score || 0, "How well the answer was organized from opening to conclusion.")}
              {reportCard("Specificity", report.content_analysis?.specificity_score || 0, "How concrete and evidence-based the answer was.")}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Transcript</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <p><span className="font-semibold">Transcript Summary:</span> {report.transcript?.summary}</p>
                  <p><span className="font-semibold">Estimated Answer Quality:</span> {report.transcript?.estimated_answer_quality}</p>
                  {report.transcript?.metrics && (
                    <>
                      <p><span className="font-semibold">Word Count:</span> {report.transcript.metrics.word_count}</p>
                      <p><span className="font-semibold">Sentence Count:</span> {report.transcript.metrics.sentence_count}</p>
                      <p><span className="font-semibold">Filler Count:</span> {report.transcript.metrics.filler_count}</p>
                      <p><span className="font-semibold">Filler Ratio:</span> {report.transcript.metrics.filler_ratio}%</p>
                      <p><span className="font-semibold">Question Keyword Hits:</span> {(report.transcript.metrics.keyword_hits || []).join(", ") || "None detected"}</p>
                    </>
                  )}
                  <div>
                    <p className="font-semibold mb-1">Transcript Text</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 whitespace-pre-wrap">
                      {report.transcript?.full_text || "Transcript not available."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Verbal Analysis</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Sentiment:</span> {report.verbal_analysis?.sentiment}</p>
                  <p><span className="font-semibold">Pace:</span> {report.verbal_analysis?.pace}</p>
                  <p><span className="font-semibold">Observations:</span> {report.verbal_analysis?.observations}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Content Analysis</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Observations:</span> {report.content_analysis?.content_observations}</p>
                  <div>
                    <p className="font-semibold mb-1">Key Points Covered</p>
                    <ul className="space-y-2">
                      {(report.content_analysis?.key_points_covered || []).map((item, index) => (
                        <li key={index} className="border-l-4 border-indigo-500 pl-3">{item}</li>
                      ))}
                      {(report.content_analysis?.key_points_covered || []).length === 0 && (
                        <li className="text-gray-500">No key points were extracted.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Non-Verbal Analysis</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><span className="font-semibold">Eye Contact:</span> {report.non_verbal_analysis?.eye_contact}</p>
                  <p><span className="font-semibold">Body Language:</span> {report.non_verbal_analysis?.body_language}</p>
                  <p><span className="font-semibold">Facial Expression:</span> {report.non_verbal_analysis?.facial_expression}</p>
                  <p><span className="font-semibold">Presence:</span> {report.non_verbal_analysis?.presence}</p>
                  <p><span className="font-semibold">Distraction:</span> {report.non_verbal_analysis?.distraction}</p>
                  {report.non_verbal_analysis?.local_video_metrics?.available && (
                    <div className="mt-3 border-t border-gray-200 pt-3 space-y-1">
                      <p><span className="font-semibold">Face Presence Rate:</span> {report.non_verbal_analysis.local_video_metrics.face_presence_rate}%</p>
                      <p><span className="font-semibold">Centered Framing Rate:</span> {report.non_verbal_analysis.local_video_metrics.centered_face_rate}%</p>
                      <p><span className="font-semibold">Stability Rate:</span> {report.non_verbal_analysis.local_video_metrics.posture_stability_rate}%</p>
                      <p><span className="font-semibold">Smile Detection Rate:</span> {report.non_verbal_analysis.local_video_metrics.smile_detection_rate}%</p>
                      <p><span className="font-semibold">Movement/Distraction Rate:</span> {report.non_verbal_analysis.local_video_metrics.movement_distraction_rate}%</p>
                      <p><span className="font-semibold">Multiple Face Rate:</span> {report.non_verbal_analysis.local_video_metrics.multi_face_rate}%</p>
                      <p className="text-gray-500">{report.non_verbal_analysis.local_video_metrics.note}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Strengths</h4>
                <ul className="space-y-2">
                  {(report.strengths || []).map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 border-l-4 border-green-500 pl-3">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Weaknesses</h4>
                <ul className="space-y-2">
                  {(report.weaknesses || []).map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 border-l-4 border-red-500 pl-3">{item}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {(report.recommendations || []).map((item, index) => (
                    <li key={index} className="text-sm text-gray-700 border-l-4 border-blue-500 pl-3">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">Overall Recommendation</h4>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Decision:</span> {report.recommended_decision}
              </p>
            </div>

            {rawAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {rawTranscript && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Raw Transcript Output</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">{rawTranscript}</pre>
                  </div>
                )}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Raw Analysis Output</h4>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">{rawAnalysis}</pre>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                {isLastQuestion ? "Finish Session" : "Next Question"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInterviewStart;
