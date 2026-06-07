import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";

const CandidateHome = () => {
  const navigate = useNavigate();
  const [jobPosts, setJobPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchJobs = async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page;
      const queryParams = new URLSearchParams({
        search,
        location,
        type,
        page: currentPage,
        limit,
      }).toString();
      
      const response = await fetch(`${NODE_API_URL}/getjobs?${queryParams}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job posts");
      }
      const data = await response.json();
      
      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (reset) {
        setJobPosts(data);
        setPage(2);
      } else {
        setJobPosts((prev) => [...prev, ...data]);
        setPage((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  useEffect(() => {
    fetchJobs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location, type]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-grow p-6 max-w-6xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, Candidate!</h1>
        <p className="text-xl text-gray-600 mb-8">Explore job opportunities and prepare for AI interviews.</p>

        {/* Search & Filter Panel */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by title, company, or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border p-3 rounded flex-grow"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border p-3 rounded md:w-1/4"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border p-3 rounded md:w-1/4 bg-white"
            >
              <option value="">Any Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </form>
        </div>

        {/* Job Listings */}
        <div className="space-y-4">
          {jobPosts.map((job) => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {job.basicDetails?.title || "Job Title"}
                </h2>
                <p className="text-lg text-gray-500 mb-2">{job.name || "Unknown Company"}</p>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="bg-gray-100 px-3 py-1 rounded-full">{job.basicDetails?.location || "Location not specified"}</span>
                  <span className="bg-gray-100 px-3 py-1 rounded-full">{job.basicDetails?.jobType || "Type not specified"}</span>
                  {job.createdAt && (
                    <span className="bg-gray-100 px-3 py-1 rounded-full">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0">
                <button
                  onClick={() => navigate(`/candidate/job/${job._id}`)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full md:w-auto"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
          {jobPosts.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No jobs found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination */}
        {jobPosts.length > 0 && hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => fetchJobs(false)}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateHome;
