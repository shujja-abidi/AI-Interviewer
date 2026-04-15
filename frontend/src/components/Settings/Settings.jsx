import React, { useState, useEffect } from "react";
import {
  MdSave,
  MdLock,
  MdBrightness4,
  MdBrightness7,
} from "react-icons/md";
import { toast } from "react-toastify";

const Settings = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const savedDarkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = () => {
    toast.success("Changes Saved!");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };

  return (
    <div
      className={`min-h-screen p-8 bg-gray-100 dark:bg-gray-900 ${
        darkMode ? "dark" : "light"
      }`}
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          Settings
        </h1>

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Profile
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={profileImage || "/default-avatar.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-grow">
              <input
                type="text"
                placeholder="Full Name"
                value={userInfo.name}
                onChange={(e) =>
                  setUserInfo({ ...userInfo, name: e.target.value })
                }
                className="w-full mb-3 p-3 rounded-md border focus:ring focus:outline-none dark:bg-gray-700 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={userInfo.email}
                onChange={(e) =>
                  setUserInfo({ ...userInfo, email: e.target.value })
                }
                className="w-full p-3 rounded-md border focus:ring focus:outline-none dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Account
          </h2>
          <div className="flex gap-4">
            <button className="w-full p-3 bg-blue-600 text-white rounded-md flex items-center justify-center">
              <MdLock className="mr-2 text-xl" />
              Change Password
            </button>
            <button className="w-full p-3 bg-blue-600 text-white rounded-md flex items-center justify-center">
              <MdLock className="mr-2 text-xl" />
              Enable 2FA
            </button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Notifications
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={() => setNotificationsEnabled(!notificationsEnabled)}
              className="w-5 h-5 accent-blue-600"
            />
            <span className="text-gray-700 dark:text-gray-200">
              Enable Email Notifications
            </span>
          </label>
        </section>

        {/* Theme Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Appearance
          </h2>
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-3 bg-gray-600 text-white p-3 rounded-md"
          >
            {darkMode ? <MdBrightness7 /> : <MdBrightness4 />}
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </section>

        {/* Save Changes Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleSaveChanges}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-500"
          >
            <MdSave className="inline-block mr-2 text-xl" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
