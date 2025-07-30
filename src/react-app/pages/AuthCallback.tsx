import { useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        await exchangeCodeForSessionToken();
        // Redirect to home page after successful authentication
        navigate("/");
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
