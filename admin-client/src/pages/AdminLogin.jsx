
import { useState } from "react";
import {
  signInWithEmailAndPassword,
  getIdTokenResult,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Bus } from "lucide-react";

const ADMIN_EMAIL = "mehidyrifat794@gmail.com";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // নির্দিষ্ট Admin Email যাচাই
      const normalizedEmail = email.trim().toLowerCase();

      if (normalizedEmail !== ADMIN_EMAIL) {
        toast.error("Admin access denied!");
        return;
      }

      // Firebase Login
      const credential = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      // Firebase Custom Claim যাচাই
      const tokenResult = await getIdTokenResult(credential.user, true);

      if (
        credential.user.email?.toLowerCase() !== ADMIN_EMAIL ||
        tokenResult.claims.admin !== true
      ) {
        await signOut(auth);
        toast.error("You are not authorized as an admin!");
        return;
      }

      toast.success("Admin login successful!");
      navigate("/");
    } catch (err) {
      toast.error("Invalid login credentials or admin access denied!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-green">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <Bus size={32} className="text-theme-green" />
            <span className="text-2xl font-bold text-gray-800">
              Admin Panel
            </span>
          </div>
        </div>

        <h2 className="text-center text-xl font-semibold text-gray-700">
          MIU Shuttle Service
        </h2>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full rounded-md border p-3"
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-md border p-3"
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="w-full rounded-md bg-theme-green p-3 text-lg font-semibold text-white shadow-lg hover:bg-green-700">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
