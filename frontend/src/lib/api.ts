const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function getAuthToken() {
  return localStorage.getItem("brite_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem("brite_token", token);
  } else {
    localStorage.removeItem("brite_token");
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch (error) {
      // ignore json parse errors
    }
    const err = new Error(message);
    (err as Error & { status?: number }).status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export async function apiJson<T>(path: string, method: string, body?: unknown) {
  return apiFetch<T>(path, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

export async function apiForm<T>(path: string, method: string, body: FormData) {
  return apiFetch<T>(path, {
    method,
    body
  });
}
