import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Overview = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  // Form state
  const [overview, setOverview] = useState("");

  // Load initial data from session storage (if available)
  useEffect(() => {
    const savedData = sessionStorage.getItem("jobOverview");
    if (savedData) {
      setOverview(savedData);
    }
  }, []);

  // Update session storage whenever overview changes
  useEffect(() => {
    sessionStorage.setItem("jobOverview", overview);
  }, [overview]);

  // Modal toggle handler
  const toggleModal = () => {
    setIsModalOpen(false);
  };

  // Next button handler
  const handleNext = () => {
    navigate("/business/preview");
  };

  const handleChange = (e) => {
    setOverview(e.target.value);
  };

  return (
    <div className="job-post-page">
      {/* Modal for enabling job posting */}
      {isModalOpen && (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="modal bg-white p-8 rounded-md shadow-md w-96 text-center">
            <h2 className="text-2xl font-bold mb-4">Create a Job Post</h2>
            <p className="text-gray-700 mb-6">
              Enable job posting to proceed with creating a new job post.
            </p>
            <button
              onClick={toggleModal}
              className="bg-orange-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
            >
              Let's Start
            </button>
          </div>
        </div>
      )}

      {/* Job Overview Form */}
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-orange-500">
          Job Overview
        </h1>

        {/* Progress Bar */}
        <div className="progress-bar flex items-center mb-8">
          {/* You can add progress bar steps here */}
        </div>

        {/* Job Overview Form */}
        <form className="max-w-2xl mx-auto">
          <label className="block text-gray-700 font-semibold mb-2">
            Job Overview / Summary
          </label>
          <textarea
            name="overview"
            value={overview}
            onChange={handleChange}
            placeholder="Enter job overview or summary"
            className="w-full border border-gray-300 rounded-md p-3 h-32"
          ></textarea>

          <p className="text-orange-500 mt-1 text-right cursor-pointer">
            Auto generate
          </p>
        </form>

        {/* Next Button */}
        <div className="text-right mt-6">
          <button
            type="button"
            onClick={handleNext}
            className="bg-orange-500 text-white px-8 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
