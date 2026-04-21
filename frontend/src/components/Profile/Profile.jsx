// Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NODE_API_URL } from "../../config/api";
import { getAuthSession, setAuthSession } from "../../utility/auth";

const Profile = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Store the original email used to identify the user in the DB
  const [currentEmail, setCurrentEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = getAuthSession();
        if (!session.email) {
          navigate("/login-candidate");
          return;
        }

        setCurrentEmail(session.email);

        const response = await fetch(
          `${NODE_API_URL}/api/candidate/profile?email=${encodeURIComponent(session.email)}`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data = await response.json();
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.contact || "");
        } else {
          // If API fails, fall back to session data
          setName(session.name || "");
          setEmail(session.email || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Fall back to session data
        const session = getAuthSession();
        setName(session.name || "");
        setEmail(session.email || "");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${NODE_API_URL}/api/candidate/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentEmail,
          name,
          email,
          contact: phone,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the local auth session with the new values
        setAuthSession({
          role: "candidate",
          name: data.user.name,
          email: data.user.email,
        });
        // Update currentEmail in case email was changed
        setCurrentEmail(data.user.email);

        setMessage({ text: "Profile updated successfully!", type: "success" });
      } else {
        setMessage({ text: data.message || "Failed to update profile.", type: "error" });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ text: "Unable to connect to the server.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="flex-grow p-10 bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500 text-lg">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow p-10 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-4">Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Manage your profile information here. Keep your details up to date to get the most out of your experience.
      </p>

      <section className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Profile Information</h2>

        {/* Status Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <form className="space-y-6" onSubmit={handleSaveChanges}>
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-lg font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-lg font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Your Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Save Changes Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full text-white py-3 px-6 rounded-lg transition duration-200 mt-6 ${
              saving
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-primary-dark"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Profile;
