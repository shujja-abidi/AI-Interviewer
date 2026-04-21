import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HRInterview = () => {
  const navigate = useNavigate();
  const FIXED_QUESTION_COUNT = 3;

  const [languageTone, setLanguageTone] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [questionCount] = useState(FIXED_QUESTION_COUNT);

const handleNext = () => {
  const formData = {
    languageTone,
    difficulty,
    questionCount,
    // Additional settings can also be included if you decide to manage them in state
  };

  sessionStorage.setItem("HRInterview", JSON.stringify(formData));
  navigate("/business/preview"); // Or your next intended route
};

  const handleBack = () => {
    // Go back to the Technical Interview page
    navigate("/business/technical-interview");
  };

  return (
    <div className="hr-interview-page container mx-auto p-8">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-orange-500">
        Create new job post
      </h1>

      {/* Progress Bar */}
      <div className="progress-bar flex items-center mb-8">
        <div className="step flex items-center gap-2">
          <div className="step-circle bg-orange-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-semibold">
            ✓
          </div>
          <span className="text-gray-700 font-semibold">Basic job details</span>
        </div>
        <div className="divider flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="step flex items-center gap-2">
          <div className="step-circle bg-orange-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-semibold">
            ✓
          </div>
          <span className="text-gray-700 font-semibold">MCQ test</span>
        </div>
        <div className="divider flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="step flex items-center gap-2">
          <div className="step-circle bg-orange-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-semibold">
            ✓
          </div>
          <span className="text-gray-700 font-semibold">Technical Interview</span>
        </div>
        <div className="divider flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="step flex items-center gap-2">
          <div className="step-circle bg-orange-500 text-white w-8 h-8 rounded-full flex justify-center items-center font-semibold">
            ✓
          </div>
          <span className="text-gray-700 font-semibold">HR Interview</span>
        </div>
        <div className="divider flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="step flex items-center gap-2">
          <div className="step-circle bg-gray-300 text-gray-500 w-8 h-8 rounded-full flex justify-center items-center font-semibold">
            5
          </div>
          <span className="text-gray-400">Preview</span>
        </div>
      </div>

      {/* Form Section */}
      <h2 className="text-2xl font-bold mb-6">Add HR Interview</h2>

      <form className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Select language tone
          </label>
          <select
            value={languageTone}
            onChange={(e) => setLanguageTone(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Select tone</option>
            <option value="formal">Formal</option>
            <option value="informal">Informal</option>
            <option value="neutral">Neutral</option>
          </select>

          <label className="block text-gray-700 font-semibold mb-2">
            Difficulty of questions
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Select difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Right Column */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Number of questions
          </label>
          <input
            type="number"
            value={questionCount}
            readOnly
            className="w-full border border-gray-300 rounded-md p-2 mb-2 bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="text-sm text-gray-500 mb-4">
            HR interviews are currently fixed at {FIXED_QUESTION_COUNT} generated questions for stable real-time evaluation.
          </p>

          <div className="additional-settings mt-4 p-4 border border-orange-500 rounded-md">
            <h3 className="text-orange-500 font-bold mb-2">Additional settings</h3>
            <div className="flex items-center justify-between mb-2">
              <span>Video</span>
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Resume</span>
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Screen recording</span>
              <input type="checkbox" defaultChecked className="toggle-checkbox" />
            </div>
          </div>
        </div>
      </form>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={handleBack}
          className="bg-gray-300 text-gray-700 px-8 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-orange-500 text-white px-8 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HRInterview;
