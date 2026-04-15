import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddMcqTest = () => {
  const navigate = useNavigate();
  const [showPrompt, setShowPrompt] = useState(true); // State to handle the prompt display
  const [formData, setFormData] = useState({
    assessmentName: "",
    numberOfQuestions: "",
    cutOff: "",
    aptitude: 10,
    reasoning: 10,
    verbal: 10,
    technical: 10,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSkip = () => {
    // Set session storage key "Mcqs" to null when skipped
    sessionStorage.setItem("Mcqs", null);
    navigate("/business/technical-interview"); // Navigate to the next step
  };

  const handleNext = () => {
    // Save formData to session storage under the key "Mcqs"
    sessionStorage.setItem("Mcqs", JSON.stringify(formData));
    navigate("/business/technical-interview"); // Navigate to the next step
  };

  const handleBack = () => {
    navigate("/business/basic-details"); // Navigate to the previous step
  };

  return (
    <div className="mcq-test-container mx-auto max-w-4xl p-6 bg-white shadow-md rounded-md">
      {showPrompt && (
        <div className="prompt-container text-center mb-6">
          <p className="text-lg font-semibold">
            Please fill in the details to move to the next section or click on Skip Section.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => setShowPrompt(false)}
              className="px-6 py-2 bg-blue-500 text-white font-medium rounded hover:bg-blue-600"
            >
              Fill Details
            </button>
            <button
              onClick={handleSkip}
              className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400"
            >
              Skip Section
            </button>
          </div>
        </div>
      )}

      {!showPrompt && (
        <div className="form-section">
          <h2 className="text-xl font-bold mb-4">Add MCQ Test</h2>
          <form>
            <div className="mb-4">
              <label className="block font-medium mb-2">Name of the Assessment</label>
              <select
                name="assessmentName"
                value={formData.assessmentName}
                onChange={handleInputChange}
                className="w-full border rounded-md p-2"
              >
                <option value="" disabled>
                  Select assessment
                </option>
                <option value="Assessment 1">Assessment 1</option>
                <option value="Assessment 2">Assessment 2</option>
              </select>
            </div>

            <div className="mb-4 flex gap-4">
              <div className="flex-1">
                <label className="block font-medium mb-2">Number of Questions</label>
                <input
                  type="number"
                  name="numberOfQuestions"
                  value={formData.numberOfQuestions}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 40"
                />
              </div>
              <div className="flex-1">
                <label className="block font-medium mb-2">Cut off (%)</label>
                <input
                  type="number"
                  name="cutOff"
                  value={formData.cutOff}
                  onChange={handleInputChange}
                  className="w-full border rounded-md p-2"
                  placeholder="e.g., 70"
                />
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              The candidates who will score above {formData.cutOff || "70"}% will be listed to you.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {["aptitude", "reasoning", "verbal", "technical"].map((category) => (
                <div key={category}>
                  <label className="block font-medium capitalize mb-2">{category}</label>
                  <input
                    type="number"
                    name={category}
                    value={formData[category]}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-2 bg-gray-300 text-gray-700 font-medium rounded hover:bg-gray-400"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-orange-500 text-white font-medium rounded hover:bg-orange-600"
              >
                Next
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AddMcqTest;
