const TOKEN_KEY = "portfolio_admin_token";

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? sessionStorage.setItem(TOKEN_KEY, token) : sessionStorage.removeItem(TOKEN_KEY);

function describeError(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) {
    return data.detail.map((d) => `${(d.loc || []).slice(1).join(".")}: ${d.msg}`).join("; ");
  }
  return `Request failed (${status})`;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    if (res.status === 401 && auth) {
      setToken(null);
      window.dispatchEvent(new Event("admin-unauthorized"));
    }
    const error = new Error(describeError(data, res.status));
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  portfolio: () => request("/portfolio"),
  contact: (body) => request("/contact", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: () => request("/auth/me", { auth: true }),
};

export const admin = {
  get: (path) => request(`/admin${path}`, { auth: true }),
  post: (path, body) => request(`/admin${path}`, { method: "POST", body, auth: true }),
  put: (path, body) => request(`/admin${path}`, { method: "PUT", body, auth: true }),
  del: (path) => request(`/admin${path}`, { method: "DELETE", auth: true }),
};
