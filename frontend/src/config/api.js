const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const NODE_API_URL = trimTrailingSlash(
  import.meta.env.VITE_NODE_API_URL || "http://localhost:5000"
);

export const PYTHON_API_URL = trimTrailingSlash(
  import.meta.env.VITE_PYTHON_API_URL || "http://localhost:5500"
);
