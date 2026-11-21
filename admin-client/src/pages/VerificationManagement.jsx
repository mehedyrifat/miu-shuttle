
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import instance from "../utils/axiosConfig";

export default function VerificationManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  // Fetch pending verification requests
  const fetchRequests = async () => {
    try {
      setLoading(true);

      const response = await instance.get("/admin/verifications");

      setRequests(response.data.requests || []);
    } catch (error) {
      console.error("Verification fetch error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load verification requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // View ID Card
  const handleViewIdCard = async (user) => {
    try {
      setSelectedUser(user);
      setImageUrl("");
      setImageLoading(true);
      setShowRejectBox(false);
      setRejectReason("");

      const response = await instance.get(
        `/admin/verifications/${user._id}/id-card`
      );

      setImageUrl(response.data.imageUrl);
    } catch (error) {
      console.error("ID Card viewing error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load University ID Card."
      );

      setSelectedUser(null);
    } finally {
      setImageLoading(false);
    }
  };

  // Approve Verification
  const handleApprove = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this University ID verification?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      const response = await instance.put(
        `/admin/verifications/${userId}/approve`
      );

      toast.success(response.data.message || "Verification approved.");

      setSelectedUser(null);
      setImageUrl("");

      await fetchRequests();
    } catch (error) {
      console.error("Approve error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to approve verification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Verification
  const handleReject = async (userId) => {
    if (!rejectReason.trim()) {
      return toast.error("Please enter a rejection reason.");
    }

    try {
      setActionLoading(true);

      const response = await instance.put(
        `/admin/verifications/${userId}/reject`,
        {
          reason: rejectReason,
        }
      );

      toast.success(response.data.message || "Verification rejected.");

      setSelectedUser(null);
      setImageUrl("");
      setRejectReason("");
      setShowRejectBox(false);

      await fetchRequests();
    } catch (error) {
      console.error("Reject error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to reject verification."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    if (actionLoading) return;

    setSelectedUser(null);
    setImageUrl("");
    setRejectReason("");
    setShowRejectBox(false);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-600" size={28} />

            <h1 className="text-2xl font-bold text-gray-800">
              ID Verification
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Review and approve university identity documents.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="p-5 mb-6 bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 text-yellow-600 bg-yellow-50 rounded-full">
            <Clock size={25} />
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Pending Requests
            </p>

            <h2 className="text-2xl font-bold text-gray-800">
              {requests.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2
            size={36}
            className="text-emerald-600 animate-spin"
          />
          <p className="mt-3 text-gray-500">
            Loading verification requests...
          </p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-10 text-center bg-white border border-gray-100 rounded-xl">
          <CheckCircle
            size={45}
            className="mx-auto text-emerald-500"
          />

          <h3 className="mt-4 text-lg font-bold text-gray-800">
            No Pending Requests
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            All verification requests have been reviewed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {requests.map((user) => (
            <div
              key={user._id}
              className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 text-emerald-700 bg-emerald-50 rounded-full">
                    <User size={22} />
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800">
                      {user.fullName}
                    </h3>

                    <span className="text-xs text-yellow-700">
                      Pending Review
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 rounded-full">
                  {user.role}
                </span>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} className="shrink-0" />
                  <span className="break-all">{user.email}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} className="shrink-0" />
                  <span>{user.mobile}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap size={17} className="shrink-0" />
                  <span>
                    University ID:{" "}
                    <strong className="text-gray-800">
                      {user.universityId || "Not available"}
                    </strong>
                  </span>
                </div>

                <div className="text-gray-600">
                  Department:{" "}
                  <strong className="text-gray-800">
                    {user.department || "Not available"}
                  </strong>
                </div>

                {user.batch && (
                  <div className="text-gray-600">
                    Batch:{" "}
                    <strong className="text-gray-800">
                      {user.batch}
                    </strong>
                  </div>
                )}

                {user.designation && (
                  <div className="text-gray-600">
                    Designation:{" "}
                    <strong className="text-gray-800">
                      {user.designation}
                    </strong>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-5 border-t border-gray-100">
                <button
                  onClick={() => handleViewIdCard(user)}
                  className="flex items-center justify-center w-full gap-2 py-3 font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                >
                  <Eye size={18} />
                  Review University ID Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ID Card Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 bg-white border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Review ID Card
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedUser.fullName}
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={actionLoading}
                className="p-2 text-gray-500 rounded-full hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5">
              {/* User Information */}
              <div className="grid grid-cols-1 gap-3 mb-5 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-gray-500">User Type</span>
                  <p className="font-semibold text-gray-800">
                    {selectedUser.role}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">
                    University ID
                  </span>
                  <p className="font-semibold text-gray-800">
                    {selectedUser.universityId}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">Department</span>
                  <p className="font-semibold text-gray-800">
                    {selectedUser.department || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-500">Email</span>
                  <p className="font-semibold text-gray-800 break-all">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              {/* ID Card Image */}
              <div className="p-3 bg-gray-50 border rounded-xl">
                <h3 className="mb-3 font-semibold text-gray-700">
                  Uploaded University ID Card
                </h3>

                {imageLoading ? (
                  <div className="flex flex-col items-center justify-center h-56">
                    <Loader2
                      size={35}
                      className="text-emerald-600 animate-spin"
                    />
                    <p className="mt-3 text-sm text-gray-500">
                      Loading ID Card...
                    </p>
                  </div>
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="University ID Card"
                    className="object-contain w-full max-h-[420px] mx-auto rounded-lg"
                  />
                ) : (
                  <p className="py-10 text-center text-sm text-red-500">
                    ID Card image could not be loaded.
                  </p>
                )}
              </div>

              {/* Rejection Reason */}
              {showRejectBox && (
                <div className="mt-5">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">
                    Rejection Reason
                  </label>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why this ID Card is rejected..."
                    rows={3}
                    maxLength={500}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-red-500"
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Maximum 500 characters.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-5 sm:flex-row">
                {!showRejectBox ? (
                  <>
                    <button
                      onClick={() =>
                        handleApprove(selectedUser._id)
                      }
                      disabled={
                        actionLoading ||
                        imageLoading ||
                        !imageUrl
                      }
                      className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      Approve
                    </button>

                    <button
                      onClick={() => setShowRejectBox(true)}
                      disabled={
                        actionLoading ||
                        imageLoading ||
                        !imageUrl
                      }
                      className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectBox(false);
                        setRejectReason("");
                      }}
                      disabled={actionLoading}
                      className="flex-1 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() =>
                        handleReject(selectedUser._id)
                      }
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold text-white bg-red-600 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <XCircle size={18} />
                      )}
                      Confirm Rejection
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
