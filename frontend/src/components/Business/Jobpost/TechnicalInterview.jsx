import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const TechnicalInterview = () => {
  const navigate = useNavigate();

  const [interviewType, setInterviewType] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [level, setLevel] = useState("");
  const [customQuestions, setCustomQuestions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

 const handleNext = () => {
  const formData = {
    interviewType,
    numberOfQuestions: Number(numberOfQuestions),
    level,
    customQuestions,
  };

  sessionStorage.setItem("TechnicalInterview", JSON.stringify(formData));
  navigate("/business/hr-interview");
};


  const handleBack = () => {
    navigate("/business/mcqs");
  };

  const handleSkip = () => {
    navigate("/business/hr-interview");
  };

  const handleAddCustomQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion(""); // Clear the input field
      setShowPopup(false); // Close the popup
    }
  };

  return (
    <div className="technical-interview-page container mx-auto p-8">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-6 text-orange-500">
        Create new job post
      </h1>

      {/* Progress Bar */}
      <div className="progress-bar flex items-center mb-8">
        {/* Progress Steps */}
        {/* Other steps omitted for brevity */}
      </div>

      {/* Form Section */}
      <h2 className="text-2xl font-bold mb-6">Add Technical Interview</h2>
      <button
        onClick={handleSkip}
        className="text-orange-500 font-semibold float-right mb-6"
      >
        Skip Section
      </button>

      <form className="grid grid-cols-2 gap-8">
        {/* Left Column */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Interview type
          </label>
          <input
            type="text"
            placeholder="Interview type"
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />

          <label className="block text-gray-700 font-semibold mb-2">
            Number of questions
          </label>
          <input
            type="number"
            placeholder="Number of questions"
            value={numberOfQuestions}
            onChange={(e) => setNumberOfQuestions(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />
        </div>

        {/* Right Column */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Select level
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          >
            <option value="">Level</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
          </select>

          <p
            onClick={() => setShowPopup(true)}
            className="text-orange-500 mt-4 cursor-pointer"
          >
            + Add your custom questions
          </p>
        </div>
      </form>

      {/* List of Custom Questions */}
      {customQuestions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Custom Questions:</h3>
          <ul className="list-disc pl-6">
            {customQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Popup for Adding Custom Question */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-md shadow-md">
            <h2 className="text-xl font-semibold mb-4">Add Custom Question</h2>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Enter your question"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowPopup(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomQuestion}
                className="bg-orange-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}

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

export default TechnicalInterview;
