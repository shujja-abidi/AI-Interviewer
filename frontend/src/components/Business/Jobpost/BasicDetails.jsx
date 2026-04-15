import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const BasicDetails = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const navigate = useNavigate();

  // Updated form state
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    responsibilities: "",
    requirements: "",
    preferred: "",
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleNext = () => {
    // Save formData to session storage under the key "BasicDetails"
    sessionStorage.setItem("BasicDetails", JSON.stringify(formData));
    navigate("/business/mcqs"); // Navigate to the next step
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <div className="job-post-page">
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

      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6 text-orange-500">
          Create new job post
        </h1>

        <form className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Junior Software Engineer - Backend"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
            />

            <label className="block text-gray-700 font-semibold mb-2">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Disrupt.com"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
            />

            <label className="block text-gray-700 font-semibold mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Remote"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
            />
          </div>

          {/* Right Column */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Job description goes here..."
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows="4"
            />

            <label className="block text-gray-700 font-semibold mb-2">
              Responsibilities (comma-separated)
            </label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              placeholder="e.g. Design APIs, Collaborate with team, etc."
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows="3"
            />

            <label className="block text-gray-700 font-semibold mb-2">
              Requirements (comma-separated)
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="e.g. Java, Node.js, MongoDB"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows="3"
            />

            <label className="block text-gray-700 font-semibold mb-2">
              Preferred (comma-separated)
            </label>
            <textarea
              name="preferred"
              value={formData.preferred}
              onChange={handleChange}
              placeholder="e.g. Docker, RabbitMQ"
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              rows="3"
            />
          </div>
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

export default BasicDetails;
