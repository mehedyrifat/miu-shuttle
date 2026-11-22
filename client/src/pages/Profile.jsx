
import {
  UserRound,
  Contact,
  Mail,
  Phone,
  SunMoon,
  CalendarDays,
  PenSquare,
  ChevronRight,
  Loader2,
  ChevronLeft,
  Camera,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../constext/AuthContext";
import instance from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";

// Profile Item
const ProfileItem = ({ icon, label, value }) => (
  <div className="flex items-center p-3 space-x-4 border-b">
    <div className="text-theme-green">{icon}</div>
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-base text-gray-900">{value || "N/A"}</div>
    </div>
  </div>
);

// Toggle Switch
const ToggleSwitch = ({ checked, onChange }) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />

      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  );
};

export default function Profile() {
  const { user, logout, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState(null);
  const [totalRides, setTotalRides] = useState(0);
  const [loading, setLoading] = useState(true);

  // Profile Image States
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageError, setImageError] = useState("");

  const fileInputRef = useRef(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  const navigate = useNavigate();

  // Apply Dark Mode and Save Setting
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Fetch Profile and History
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          instance.get("/secure/profile"),
          instance.get("/bookings/history"),
        ]);

        setProfile(profileRes.data);
        setTotalRides(historyRes.data.length);
      } catch (err) {
        console.error("Failed to fetch profile or history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [user, authLoading]);

  // Select Profile Picture
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageError("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setImageError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  // Upload Profile Picture
  const handleImageUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      setImageError("");

      const formData = new FormData();
      formData.append("profileImage", selectedFile);

      const response = await instance.post(
        "/secure/upload-profile-image",
        formData
      );

      setProfile((prev) => ({
        ...prev,
        profileImage: response.data.profileImage,
      }));

      setSelectedFile(null);

      setPreviewImage((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return "";
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      alert("Profile picture updated successfully!");
    } catch (err) {
      console.error("Profile picture upload error:", err);

      setImageError(
        err.response?.data?.message ||
          "Failed to upload profile picture. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Cancel Selected Image
  const handleCancelImage = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }

    setPreviewImage("");
    setSelectedFile(null);
    setImageError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clean Preview URL
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // Get Role Specific ID
  const getRoleSpecificId = () => {
    if (!profile || !profile.role || !profile.roleSpecific) {
      return { label: "ID", value: "N/A" };
    }

    switch (profile.role) {
      case "Student":
        return {
          label: "Student ID",
          value: profile.roleSpecific.studentId || "N/A",
        };

      case "Faculty":
        return {
          label: "Faculty ID",
          value: profile.roleSpecific.facultyId || "N/A",
        };

      case "Stuff":
        return {
          label: "Stuff ID",
          value: profile.roleSpecific.stuffId || "N/A",
        };

      default:
        return { label: "ID", value: "N/A" };
    }
  };

  // Loading UI
  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  // Profile Not Found
  if (!user || !profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Could not load profile.</p>

        <button
          onClick={logout}
          className="px-4 py-2 mt-4 text-white bg-red-500 rounded"
        >
          Log Out
        </button>
      </div>
    );
  }

  const roleId = getRoleSpecificId();

  return (
    <div className="bg-[#5A7C6A] min-h-screen pb-24">
      {/* Back Button */}
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Profile Image */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-28 h-28">
          <div className="flex items-center justify-center w-28 h-28 overflow-hidden bg-gray-300 border-4 border-white rounded-full shadow-lg">
            {previewImage || profile.profileImage ? (
              <img
                src={previewImage || profile.profileImage}
                alt="Profile"
                className="object-cover w-full h-full"
              />
            ) : (
              <UserRound size={80} className="text-gray-500" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="absolute bottom-0 right-0 p-2 text-white bg-green-700 border-2 border-white rounded-full shadow disabled:opacity-50"
            title="Change Profile Picture"
          >
            <Camera size={18} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageSelect}
        />

        <p className="mt-2 text-sm text-white">
          {profile.profileImage ? "Change Profile Picture" : "Add Profile Picture"}
        </p>

        {imageError && (
          <p className="px-3 py-2 mt-2 text-sm text-red-700 bg-white rounded-lg">
            {imageError}
          </p>
        )}

        {selectedFile && (
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={uploadingImage}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-700 rounded-lg disabled:opacity-60"
            >
              {uploadingImage ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Picture"
              )}
            </button>

            <button
              type="button"
              onClick={handleCancelImage}
              disabled={uploadingImage}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white rounded-lg disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-lg m-6 mt-[-20px] pt-8">
        <ProfileItem
          icon={<UserRound size={24} />}
          label="Name"
          value={profile.fullName}
        />

        <ProfileItem
          icon={<Contact size={24} />}
          label={roleId.label}
          value={roleId.value}
        />

        <ProfileItem
          icon={<Mail size={24} />}
          label="Email"
          value={profile.email}
        />

        <ProfileItem
          icon={<Phone size={24} />}
          label="Mobile"
          value={profile.mobile}
        />

        {/* Dark Mode */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center space-x-4">
            <div className="text-theme-green">
              <SunMoon size={24} />
            </div>

            <div>
              <div className="text-base text-gray-900">
                Dark Mood
              </div>
            </div>
          </div>

          <ToggleSwitch
            checked={darkMode}
            onChange={setDarkMode}
          />
        </div>

        {/* Total Rides */}
        <div className="flex items-center p-3 space-x-4 border-b">
          <div className="text-theme-green">
            <CalendarDays size={24} />
          </div>

          <div>
            <div className="text-base text-gray-900">
              Total Rides: {totalRides}
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <button
          onClick={() => navigate("/edit-profile", { state: { profile } })}
          className="flex items-center justify-between w-full p-3"
        >
          <div className="flex items-center space-x-4">
            <div className="text-theme-green">
              <PenSquare size={24} />
            </div>

            <div className="text-base text-gray-900">
              Edit Profile
            </div>
          </div>

          <ChevronRight size={24} className="text-gray-400" />
        </button>
      </div>

      {/* Log Out */}
      <div className="px-6">
        <button
          onClick={logout}
          className="w-full py-3 font-semibold text-red-500 bg-white rounded-lg shadow"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
