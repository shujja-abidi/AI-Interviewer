const STORAGE_KEYS = {
  role: "authRole",
  name: "authName",
  email: "authEmail",
};

export const setAuthSession = ({ role, name, email }) => {
  localStorage.setItem(STORAGE_KEYS.role, role);
  localStorage.setItem(STORAGE_KEYS.name, name);
  localStorage.setItem(STORAGE_KEYS.email, email);
};

export const clearAuthSession = () => {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("username");
  localStorage.removeItem("email");
  localStorage.removeItem("businessName");
  localStorage.removeItem("businessEmail");
};

export const getAuthSession = () => ({
  role: localStorage.getItem(STORAGE_KEYS.role),
  name: localStorage.getItem(STORAGE_KEYS.name),
  email: localStorage.getItem(STORAGE_KEYS.email),
});
