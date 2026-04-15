// Profile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const Profile = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@example.com");
  const [phone, setPhone] = useState("+123 456 7890");

  useEffect(() => {
    // const username = Cookies.get("username");
    // const email = Cookies.get("email");

    // if (!username || !email) {
    //   navigate("/"); // Redirect to home page if cookies are missing
    // }
  }, [navigate]);

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Implement save logic here (e.g., API call)
    alert("Profile updated!");
  };

  return (
    <main className="flex-grow p-10 bg-gray-50">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-4">Your Profile</h1>
      <p className="text-gray-600 mb-8">
        Manage your profile information here. Keep your details up to date to get the most out of your experience.
      </p>

      <section className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">Profile Information</h2>

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
            className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary-dark transition duration-200 mt-6"
          >
            Save Changes
          </button>
        </form>
      </section>
    </main>
  );
};

export default Profile;
  
