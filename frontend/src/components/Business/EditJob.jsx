import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";

const EditJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    responsibilities: "",
    requirements: "",
    preferred: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${NODE_API_URL}/jobs/${jobId}`);
        if (!response.ok) throw new Error("Failed to fetch job details");
        const data = await response.json();
        
        const basicDetails = data.basicDetails || {};
        setFormData({
          title: basicDetails.title || "",
          company: basicDetails.company || "",
          location: basicDetails.location || "",
          description: basicDetails.description || "",
          responsibilities: basicDetails.responsibilities || "",
          requirements: basicDetails.requirements || "",
          preferred: basicDetails.preferred || "",
        });
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${NODE_API_URL}/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ basicDetails: formData }),
      });
      if (!response.ok) throw new Error("Failed to update job");
      alert("Job updated successfully");
      navigate("/business/manage-jobs");
    } catch (error) {
      console.error("Error updating job:", error);
      alert("Error updating job");
    }
  };

  if (loading) {
    return <div className="p-8">Loading job data...</div>;
  }

  return (
    <div className="container mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Edit Job Post</h1>

      <form className="grid grid-cols-2 gap-8 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />

          <label className="block text-gray-700 font-semibold mb-2">Company</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />

          <label className="block text-gray-700 font-semibold mb-2">Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
            rows="4"
          />

          <label className="block text-gray-700 font-semibold mb-2">Responsibilities</label>
          <textarea
            name="responsibilities"
            value={formData.responsibilities}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
            rows="3"
          />

          <label className="block text-gray-700 font-semibold mb-2">Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
            rows="3"
          />

          <label className="block text-gray-700 font-semibold mb-2">Preferred</label>
          <textarea
            name="preferred"
            value={formData.preferred}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md p-2 mb-4"
            rows="3"
          />
        </div>
      </form>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={() => navigate("/business/manage-jobs")}
          className="bg-gray-400 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-500 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="bg-orange-500 text-white px-8 py-2 rounded-md font-semibold hover:bg-orange-600 transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditJob;
