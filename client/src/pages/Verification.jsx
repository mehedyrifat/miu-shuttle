
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Upload,
  ImagePlus,
  Clock,
  XCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import instance from "../utils/axiosConfig";

export default function Verification() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await instance.get("/secure/profile");

      setUser(response.data);
    } catch (error) {
      console.error("Profile loading error:", error);

      toast.error(
        error.response?.data?.message || "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Cleanup image preview
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Get existing University ID Number
  const getUniversityId = () => {
    if (!user) return "";

    const role = user.role;
    const details = user.roleSpecific || {};

    if (role === "Student") return details.studentId || "";
    if (role === "Faculty") return details.facultyId || "";
    if (role === "Stuff") return details.stuffId || "";

    return "";
  };

  // Handle image selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setFile(selectedFile);

    const imageUrl = URL.createObjectURL(selectedFile);
    setPreview(imageUrl);
  };

  // Upload University ID Card
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      return toast.error("Please select your University ID Card image.");
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("idCard", file);

      const response = await instance.post(
        "/secure/upload-id-card",
        formData
      );

      toast.success(response.data.message);

      setFile(null);
      setPreview("");

      await fetchProfile();
    } catch (error) {
      console.error("ID Card upload error:", error);

      toast.error(
        error.response?.data?.message || "ID Card upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  const status = user?.verification?.status || "Not Submitted";

  const getStatusStyle = () => {
    switch (status) {
      case "Approved":
        return {
          color: "text-green-700",
          bg: "bg-green-50",
          border: "border-green-200",
        };

      case "Pending":
        return {
          color: "text-yellow-700",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
        };

      case "Rejected":
        return {
          color: "text-red-700",
          bg: "bg-red-50",
          border: "border-red-200",
        };

      default:
        return {
          color: "text-gray-700",
          bg: "bg-gray-50",
          border: "border-gray-200",
        };
    }
  };

  const statusStyle = getStatusStyle();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-theme-bg">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="mt-4 text-gray-600">
          Loading verification details...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-theme-bg">
        <XCircle size={48} className="text-red-500" />

        <h2 className="mt-4 text-xl font-bold">
          Unable to load profile
        </h2>

        <button
          onClick={fetchProfile}
          className="px-6 py-3 mt-5 text-white bg-emerald-600 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5 bg-theme-bg">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 text-emerald-700 bg-emerald-100 rounded-full">
          <ShieldCheck size={28} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-gray-800">
            University ID Verification
          </h1>

          <p className="text-sm text-gray-500">
            MIU Shuttle Account Verification
          </p>
        </div>
      </div>

      {/* Introduction */}
      <div className="p-5 mb-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <h2 className="text-lg font-bold text-gray-800">
          Verify Your Identity
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Please upload a clear picture of your Manarat International
          University ID Card. Our admin team will review your
          information before activating your account.
        </p>
      </div>

      {/* User Information */}
      <div className="p-5 mb-5 bg-white border border-gray-100 shadow-sm rounded-2xl">

        <h3 className="mb-4 font-bold text-gray-800">
          Your Registration Information
        </h3>

        <div className="space-y-3 text-sm">

          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Full Name</span>
            <span className="font-semibold text-right text-gray-800">
              {user.fullName}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-gray-500">Email</span>
            <span className="font-semibold text-right text-gray-800 break-all">
              {user.email}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-gray-500">User Type</span>
            <span className="font-semibold text-gray-800">
              {user.role}
            </span>
          </div>

          <div className="flex justify-between gap-3">
            <span className="text-gray-500">
              University ID Number
            </span>

            <span className="font-bold text-emerald-700">
              {getUniversityId() || "Not Available"}
            </span>
          </div>

          {user.roleSpecific?.department && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-500">Department</span>
              <span className="font-semibold text-gray-800">
                {user.roleSpecific.department}
              </span>
            </div>
          )}
        </div>

        <p className="pt-3 mt-4 text-xs text-gray-500 border-t">
          Your registration information is already saved.
          You do not need to enter your ID number again.
        </p>
      </div>

      {/* Verification Status */}
      <div className={`p-4 mb-5 border rounded-2xl ${statusStyle.bg} ${statusStyle.border}`}>

        <div className="flex items-center gap-3">

          {status === "Approved" ? (
            <CheckCircle className="text-green-600" size={26} />
          ) : status === "Pending" ? (
            <Clock className="text-yellow-600" size={26} />
          ) : status === "Rejected" ? (
            <XCircle className="text-red-600" size={26} />
          ) : (
            <ShieldCheck className="text-gray-600" size={26} />
          )}

          <div>
            <p className={`font-bold ${statusStyle.color}`}>
              {status === "Not Submitted"
                ? "Verification Required"
                : status === "Pending"
                ? "Verification Pending"
                : status === "Approved"
                ? "Verification Approved"
                : "Verification Rejected"}
            </p>

            <p className={`mt-1 text-xs ${statusStyle.color}`}>
              {status === "Not Submitted"
                ? "Please submit your University ID Card."
                : status === "Pending"
                ? "Your ID Card is waiting for admin review."
                : status === "Approved"
                ? "Your university identity has been verified."
                : "Your previous submission was rejected."}
            </p>
          </div>
        </div>

        {status === "Rejected" &&
          user.verification?.rejectionReason && (
            <div className="p-3 mt-3 text-sm text-red-700 bg-white rounded-lg">
              <strong>Admin's Reason:</strong>
              <p className="mt-1">
                {user.verification.rejectionReason}
              </p>
            </div>
          )}
      </div>

      {/* Approved Account */}
      {status === "Approved" && (
        <button
          onClick={() => navigate("/home")}
          className="flex items-center justify-center w-full gap-2 py-4 font-semibold text-white bg-emerald-600 rounded-xl"
        >
          Continue to MIU Shuttle
          <ArrowRight size={20} />
        </button>
      )}

      {/* Pending Information */}
      {status === "Pending" && (
        <div className="p-5 text-center bg-white shadow-sm rounded-2xl">
          <Clock size={38} className="mx-auto text-yellow-500" />

          <h3 className="mt-3 font-bold text-gray-800">
            Thank You for Your Submission!
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Your University ID Card has been submitted successfully.
            Please wait until the admin team completes verification.
          </p>

          <button
            onClick={fetchProfile}
            className="flex items-center justify-center gap-2 px-5 py-3 mx-auto mt-4 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
          >
            <RefreshCw size={16} />
            Refresh Status
          </button>
        </div>
      )}

      {/* Upload Form: Not Submitted or Rejected */}
      {(status === "Not Submitted" || status === "Rejected") && (
        <form
          onSubmit={handleUpload}
          className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl"
        >
          <h3 className="mb-2 font-bold text-gray-800">
            Upload University ID Card
          </h3>

          <p className="mb-4 text-sm text-gray-500">
            Select a clear image of your original university ID card.
          </p>

          {/* Image Preview */}
          {preview ? (
            <div className="relative mb-4 overflow-hidden border rounded-xl">
              <img
                src={preview}
                alt="University ID Card Preview"
                className="object-contain w-full max-h-64 bg-gray-50"
              />

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview("");
                }}
                className="absolute p-2 text-white bg-red-500 rounded-full top-2 right-2"
              >
                <XCircle size={20} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed cursor-pointer border-emerald-300 bg-emerald-50 rounded-xl">

              <ImagePlus size={42} className="mb-3 text-emerald-600" />

              <span className="font-semibold text-gray-700">
                Choose University ID Card
              </span>

              <span className="mt-2 text-xs text-gray-500">
                JPG, PNG or WEBP (Maximum 5 MB)
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          {preview && (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview("");
              }}
              className="flex items-center justify-center w-full gap-2 py-3 mb-3 text-sm font-semibold text-red-600 bg-red-50 rounded-lg"
            >
              <XCircle size={17} />
              Remove Image
            </button>
          )}

          {preview && (
            <label className="flex items-center justify-center w-full gap-2 py-3 mb-3 text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-lg cursor-pointer">
              <Upload size={17} />
              Change Image

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={!file || uploading}
            className="flex items-center justify-center w-full gap-2 py-4 mt-2 font-semibold text-white bg-emerald-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Submit for Verification
              </>
            )}
          </button>

          <p className="mt-3 text-xs leading-5 text-center text-gray-500">
            Your ID Card will be securely submitted for admin review.
          </p>
        </form>
      )}

      {/* Footer */}
      <p className="py-6 text-xs text-center text-gray-400">
        MIU Shuttle • Secure University Identity Verification
      </p>

    </div>
  );
}
