// OAuthCallbackPage.jsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../context/authStore";
import api from "../services/api";
import toast from "react-hot-toast";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const error = searchParams.get("error");

    if (error) {
      toast.error("OAuth authentication failed. Access denied.");
      navigate("/login");
      return;
    }

    if (accessToken && refreshToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      api.get("/auth/me").then((res) => {
        setAuth(res.data.user, accessToken, refreshToken);
        navigate("/dashboard");
        toast.success(`Welcome, ${res.data.user.name}!`);
      }).catch(() => {
        toast.error("Authentication error. Please try again.");
        navigate("/login");
      });
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/60">Authenticating...</p>
      </div>
    </div>
  );
}
