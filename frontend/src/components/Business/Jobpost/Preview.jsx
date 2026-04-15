import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../../config/api";
import { getAuthSession } from "../../../utility/auth";

const safeParse = (key, fallback = {}) => {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Preview = () => {
  const navigate = useNavigate();
  const [jobData, setJobData] = useState({
    basicDetails: {},
    mcqTest: {},
    technicalInterview: {},
    hrInterview: {},
  });

  useEffect(() => {
    setJobData({
      basicDetails: safeParse("BasicDetails"),
      mcqTest: safeParse("Mcqs"),
      technicalInterview: safeParse("TechnicalInterview"),
      hrInterview: safeParse("HRInterview"),
    });
  }, []);

  const handleSubmit = async () => {
    const auth = getAuthSession();

    try {
      const response = await fetch(`${NODE_API_URL}/setjob`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: auth.name || jobData.basicDetails.company || "Business User",
          email: auth.email || "business@example.com",
          ...jobData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/business/home");
      } else {
        console.error("Failed to post job:", result.message);
      }
    } catch (error) {
      console.error("Error posting job:", error);
    }
  };

  const { basicDetails, mcqTest, technicalInterview, hrInterview } = jobData;

  return (
    <div className="preview-container mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold mb-6">Preview Job Posting</h1>

      <div className="preview-content bg-white shadow-md rounded-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Job Details</h2>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Basic Details</h3>
          <p>Job Title: {basicDetails.title || "Not provided"}</p>
          <p>Company: {basicDetails.company || "Not provided"}</p>
          <p>Location: {basicDetails.location || "Not provided"}</p>
          <p>Description: {basicDetails.description || "Not provided"}</p>
          <p>Responsibilities: {basicDetails.responsibilities || "Not provided"}</p>
          <p>Requirements: {basicDetails.requirements || "Not provided"}</p>
          <p>Preferred: {basicDetails.preferred || "Not provided"}</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">MCQ Test</h3>
          <p>Assessment Name: {mcqTest.assessmentName || "Skipped"}</p>
          <p>Number of Questions: {mcqTest.numberOfQuestions || 0}</p>
          <p>Cutoff: {mcqTest.cutOff || 0}%</p>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Technical Interview</h3>
          <p>Type: {technicalInterview.interviewType || "Skipped"}</p>
          <p>Level: {technicalInterview.level || "Not provided"}</p>
          <p>Number of Questions: {technicalInterview.numberOfQuestions || 0}</p>
          {technicalInterview.customQuestions?.length > 0 && (
            <div>
              <p>Custom Questions:</p>
              <ul className="list-disc pl-6">
                {technicalInterview.customQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">HR Interview</h3>
          <p>Language Tone: {hrInterview.languageTone || "Not provided"}</p>
          <p>Difficulty: {hrInterview.difficulty || "Not provided"}</p>
          <p>Question Count: {hrInterview.questionCount || 0}</p>
          <p>Video: {hrInterview.video ? "Yes" : "No"}</p>
          <p>Resume: {hrInterview.resume ? "Yes" : "No"}</p>
          <p>Screen Recording: {hrInterview.screenRecording ? "Yes" : "No"}</p>
        </div>
      </div>

      <div className="flex justify-end mt-6 gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Submit Job Posting
        </button>
      </div>
    </div>
  );
};

export default Preview;
