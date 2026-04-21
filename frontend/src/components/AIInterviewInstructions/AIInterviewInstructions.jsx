import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PYTHON_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";

const baseInstructions = [
  "Enable your camera and microphone.",
  "Ensure good lighting and a clear background.",
  "Ensure a stable internet connection.",
  "Review all generated interview questions before you start recording.",
  "Answer clearly and stay focused on the role.",
  "Maintain eye contact with the camera while answering.",
];

const AIInterviewInstructions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = getAuthSession();
  const storedContext = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("candidateInterviewContext") || "{}");
    } catch {
      return {};
    }
  }, []);
  const pageContext = location.state || storedContext;
  const job = pageContext.job || null;
  const jobDetails = pageContext.jobDetails || job?.basicDetails || {};
  const resumeData = pageContext.resumeData || storedContext.resumeData || null;
  const atsReport = pageContext.atsReport || storedContext.atsReport || null;

  const [checked, setChecked] = useState(new Array(baseInstructions.length).fill(false));
  const [cameraStream, setCameraStream] = useState(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [interviewType, setInterviewType] = useState("technical");
  const [difficulty, setDifficulty] = useState("mid");
  const fixedQuestionCount = 3;
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);

  const allInstructionsFollowed = checked.every(Boolean);
  const isCameraAndMicEnabled = cameraActive && !micMuted;

  const handleCheckboxChange = (index) => {
    setChecked((previous) => previous.map((value, position) => (position === index ? !value : value)));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError("Unable to access the camera or microphone. Please check your permissions.");
    }
  };

  const toggleCamera = () => {
    if (!cameraStream) return;
    const videoTrack = cameraStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !cameraActive;
    }
    setCameraActive((value) => !value);
  };

  const toggleMic = () => {
    if (!cameraStream) return;
    const audioTrack = cameraStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = micMuted;
    }
    setMicMuted((value) => !value);
  };

  const handleNext = async () => {
    if (!allInstructionsFollowed || !isCameraAndMicEnabled) {
      return;
    }

    setIsPreparing(true);
    setError("");

    try {
      const payload = {
        candidate_name: auth.name || "Candidate",
        candidate_email: auth.email || "",
        job_title: jobDetails.title || "General Role",
        job_description: [jobDetails.description, jobDetails.requirements, jobDetails.responsibilities]
          .filter(Boolean)
          .join("\n"),
        company_name: job?.name || jobDetails.company || "Interview Genius",
        business_email: job?.email || "",
        interview_type: interviewType,
        difficulty,
        question_count: fixedQuestionCount,
        response_mode: "single_video",
        ats_score: atsReport?.overall_score || 0,
        ats_report: atsReport || {},
        candidate_resume: JSON.stringify(resumeData || {}, null, 2),
        ats_report_summary: atsReport?.summary || "",
      };

      const response = await fetch(`${PYTHON_API_URL}/api/interview-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate interview questions.");
      }

      const sessionContext = {
        job,
        jobDetails,
        resumeData,
        atsReport,
        sessionId: data.session_id,
        questions: data.questions,
        interviewType,
        difficulty,
      };
      sessionStorage.setItem("candidateInterviewContext", JSON.stringify(sessionContext));
      navigate("/candidate/ai-mock-interview/start", {
        state: sessionContext,
      });
    } catch (err) {
      setError(err.message || "Failed to prepare interview.");
    } finally {
      setIsPreparing(false);
    }
  };

  useEffect(() => {
    startCamera();
    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        currentVideo.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col p-10 bg-gray-100">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Real-Time AI Interview Setup</h1>
      <p className="text-gray-600 mb-8">
        Confirm your setup, choose the interview configuration, and we will generate a short interview question set for
        one recorded response.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Role Context</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Role:</span> {jobDetails.title || "General role"}
              </p>
              <p>
                <span className="font-semibold">Company:</span> {job?.name || jobDetails.company || "Interview Genius"}
              </p>
              <p>
                <span className="font-semibold">ATS Summary:</span> {atsReport?.summary || "ATS report not loaded yet."}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Checklist</h2>
            <ul className="space-y-4">
              {baseInstructions.map((instruction, index) => (
                <li key={instruction} className="p-4 bg-gray-50 rounded-md shadow-sm">
                  <label className="flex items-center text-gray-800">
                    <input
                      type="checkbox"
                      checked={checked[index]}
                      onChange={() => handleCheckboxChange(index)}
                      className="mr-2"
                    />
                    {instruction}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Interview Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="text-sm text-gray-700">
                <span className="block font-medium mb-2">Interview Type</span>
                <select
                  value={interviewType}
                  onChange={(event) => setInterviewType(event.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                <span className="block font-medium mb-2">Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </label>
              <label className="text-sm text-gray-700">
                <span className="block font-medium mb-2">Question Count</span>
                <input
                  type="number"
                  value={fixedQuestionCount}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-md shadow-md flex flex-col items-center space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Camera and Microphone</h2>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="border-2 border-gray-300 rounded-md w-full h-auto"
            ></video>
            <div className="flex space-x-4">
              <button
                onClick={toggleCamera}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {cameraActive ? "Turn Off Camera" : "Turn On Camera"}
              </button>
              <button
                onClick={toggleMic}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                {micMuted ? "Unmute Microphone" : "Mute Microphone"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-2">What happens next</p>
            <ul className="space-y-2 list-disc pl-5">
              <li>We will generate a short set of interview questions from the job details and your resume.</li>
              <li>You will answer all questions in one recording with a clear time limit.</li>
              <li>You will receive one full interview report with transcript, communication feedback, and overall recommendations.</li>
            </ul>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-6" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6">
        <button
          onClick={handleNext}
          disabled={!allInstructionsFollowed || !isCameraAndMicEnabled || isPreparing}
          className={`w-full bg-blue-600 text-white py-3 rounded-md shadow-md hover:bg-blue-700 ${
            !allInstructionsFollowed || !isCameraAndMicEnabled || isPreparing ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isPreparing ? "Preparing Interview..." : "Continue To Interview"}
        </button>
      </div>
    </div>
  );
};

export default AIInterviewInstructions;
