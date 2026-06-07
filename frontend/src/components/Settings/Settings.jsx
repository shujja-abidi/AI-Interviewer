import React, { useState, useEffect } from "react";
import {
  MdSave,
  MdLock,
  MdBrightness4,
  MdBrightness7,
} from "react-icons/md";
import { toast } from "react-toastify";
import { NODE_API_URL } from "../../config/api";
import { getAuthSession } from "../../utility/auth";

const Settings = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const auth = getAuthSession();

  useEffect(() => {
    const savedDarkMode = JSON.parse(localStorage.getItem("darkMode"));
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode);
    }
    if (auth.name && auth.email) {
      setUserInfo({ name: auth.name, email: auth.email });
    }
  }, [auth.name, auth.email]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = () => {
    // In a real app, send profile update request
    toast.success("Changes Saved!");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    setPasswordLoading(true);
    try {
      const response = await fetch(`${NODE_API_URL}/api/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: auth.email,
          role: auth.role, // "candidate" or "business"
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen p-8 bg-gray-100 dark:bg-gray-900 ${
        darkMode ? "dark" : "light"
      }`}
    >
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 relative">
        <h1 className="text-3xl font-semibold text-center text-gray-800 dark:text-white mb-6">
          Settings
        </h1>

        {/* Profile Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Profile Preferences
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
                disabled
                value={userInfo.email}
                className="w-full p-3 rounded-md border focus:ring focus:outline-none bg-gray-100 cursor-not-allowed dark:bg-gray-600 dark:text-gray-300"
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-200 mb-4">
            Account Security
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full p-3 bg-blue-600 text-white rounded-md flex items-center justify-center hover:bg-blue-700 transition"
            >
              <MdLock className="mr-2 text-xl" />
              Change Password
            </button>
            <button className="w-full p-3 bg-gray-400 text-white rounded-md flex items-center justify-center cursor-not-allowed">
              <MdLock className="mr-2 text-xl" />
              Enable 2FA (Coming Soon)
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
            className="flex items-center gap-3 bg-gray-600 text-white p-3 rounded-md hover:bg-gray-700 transition"
          >
            {darkMode ? <MdBrightness7 /> : <MdBrightness4 />}
            {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </section>

        {/* Save Changes Button */}
        <div className="text-center mt-6">
          <button
            onClick={handleSaveChanges}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-500 transition"
          >
            <MdSave className="inline-block mr-2 text-xl" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm relative">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Change Password</h2>
            <form onSubmit={handleChangePassword}>
              <input
                type="password"
                required
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full mb-3 p-3 rounded-md border focus:ring focus:outline-none dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                required
                placeholder="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full mb-3 p-3 rounded-md border focus:ring focus:outline-none dark:bg-gray-700 dark:text-white"
              />
              <input
                type="password"
                required
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full mb-4 p-3 rounded-md border focus:ring focus:outline-none dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:bg-blue-400"
                >
                  {passwordLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
