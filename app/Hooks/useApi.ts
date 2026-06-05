import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export const useApi = () => {
  const { token } = useAuth();

  const api = useCallback(async (path: string, opts?: RequestInit) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${path}`,
      {
        ...opts,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...opts?.headers,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  }, [token]);

  return api;
};