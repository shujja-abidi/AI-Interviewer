import React, { useState } from "react";
import { NODE_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";

const ContactCandidate = ({ candidateEmail, onClose }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuthSession();

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${NODE_API_URL}/contact-candidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateEmail,
          businessEmail: auth.email,
          subject,
          message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      alert("Message sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Contact Candidate</h2>
        <form onSubmit={handleSend}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">To</label>
            <input
              type="email"
              value={candidateEmail}
              disabled
              className="w-full border border-gray-300 rounded p-2 bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border border-gray-300 rounded p-2"
              placeholder="e.g. Interview Follow-up"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows="5"
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Type your message here..."
            />
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactCandidate;
