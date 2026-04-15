import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PYTHON_API_URL } from "../../config/api";

const Resume = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const job = location.state?.job || null;
  const jobDetails = location.state?.jobDetails || job?.basicDetails || null;

  const [resumeData, setResumeData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a PDF resume first.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      const response = await fetch(`${PYTHON_API_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setResumeData(data);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    sessionStorage.setItem(
      "candidateInterviewContext",
      JSON.stringify({
        job,
        jobDetails,
        resumeData,
      })
    );
    navigate("/candidate/ats", {
      state: {
        resumeData,
        jobDetails,
        job,
      },
    });
  };

  const renderList = (title, items, borderClass) => {
    if (!items?.length) return null;

    return (
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        <div className={`border-l-4 ${borderClass} pl-4 mt-2`}>
          {items.map((item, index) => (
            <p key={`${title}-${index}`} className="text-gray-700 mt-1">
              - {item}
            </p>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {jobDetails && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Job Details</h2>
            <div className="text-gray-700 space-y-2">
              <p><strong>Job Title:</strong> {jobDetails.title}</p>
              <p><strong>Company:</strong> {jobDetails.company || "Not provided"}</p>
              <p><strong>Work Mode:</strong> {jobDetails.location || "Not provided"}</p>
              <p><strong>Description:</strong> {jobDetails.description || "Not provided"}</p>
              <p><strong>Responsibilities:</strong> {jobDetails.responsibilities || "Not provided"}</p>
              <p><strong>Requirements:</strong> {jobDetails.requirements || "Not provided"}</p>
            </div>
          </div>
        )}

        {resumeData && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Extracted Resume Information</h3>
            {renderList("Education", resumeData.Education, "border-blue-500")}
            {renderList("Experience", resumeData.Experience, "border-green-500")}
            {renderList("Projects", resumeData.Projects, "border-yellow-500")}

            {resumeData.Skills?.length > 0 && (
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Skills</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {resumeData.Skills.map((skill, index) => (
                    <span key={`skill-${index}`} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!jobDetails && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Warning: No Job Selected</p>
            <p>
              Navigate here from a job listing to calculate ATS score against a specific job description.
            </p>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Upload Resume</h2>
        <div className="mb-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="border border-gray-300 p-2 rounded-lg w-full"
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Processing..." : "Upload"}
          </button>

          {resumeData && (
            <button
              onClick={handleProceed}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Resume;
