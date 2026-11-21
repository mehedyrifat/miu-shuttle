
import { useEffect, useState } from "react";
import instance from "../utils/axiosConfig";
import toast from "react-hot-toast";
import { RefreshCw, ClipboardList } from "lucide-react";

export default function ExtraBusRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date format: 25 November 2026
  const formatJourneyDate = (date) => {
    if (!date) return "Not Set";

    const [year, month, day] = date.substring(0, 10)
      .split("-")
      .map(Number);

    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    );
  };

  // Requested timestamp
  const formatSubmittedDate = (date) => {
    if (!date) return "Not Available";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch all requests
  const fetchRequests = async () => {
    try {
      setLoading(true);

      const res = await instance.get("/admin/extra-bus-requests");

      const data = res.data;

      setRequests(
        Array.isArray(data)
          ? data
          : Array.isArray(data.requests)
          ? data.requests
          : []
      );
    } catch (err) {
      console.error("Failed to fetch extra bus requests:", err);
      toast.error(
        err.response?.data?.message || "Failed to load extra bus requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Extra Bus Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View additional bus requests submitted by students.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 font-medium text-white rounded-lg bg-theme-green hover:bg-green-700 disabled:opacity-60"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Request Summary */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="flex items-center gap-3">
          <div className="p-3 text-green-700 bg-green-100 rounded-lg">
            <ClipboardList size={24} />
          </div>

          <div>
            <p className="text-sm text-gray-500">Total Requests</p>
            <h2 className="text-2xl font-bold text-gray-800">
              {requests.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList
              size={42}
              className="mx-auto mb-3 text-gray-300"
            />
            <h3 className="text-lg font-semibold text-gray-700">
              No Extra Bus Requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Student requests will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[1100px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Journey Type</th>
                <th className="p-3 text-left">Route</th>
                <th className="p-3 text-left">Journey Date</th>
                <th className="p-3 text-left">Day</th>
                <th className="p-3 text-left">Preferred Time</th>
                <th className="p-3 text-left">Message</th>
                <th className="p-3 text-left">Submitted At</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className="border-b hover:bg-gray-50">
                  {/* Student Information */}
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">
                      {request.studentName}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {request.studentId}
                    </p>
                    {request.department && (
                      <p className="text-xs text-gray-500">
                        {request.department}
                      </p>
                    )}
                  </td>

                  {/* Journey Type */}
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        request.journeyType === "Arrive"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {request.journeyType}
                    </span>
                  </td>

                  {/* Route */}
                  <td className="p-3 font-medium text-gray-700">
                    {request.from} → {request.to}
                  </td>

                  {/* Journey Date */}
                  <td className="p-3 whitespace-nowrap">
                    {formatJourneyDate(request.journeyDate)}
                  </td>

                  {/* Journey Day */}
                  <td className="p-3">{request.journeyDay || "Not Set"}</td>

                  {/* Preferred Time */}
                  <td className="p-3 whitespace-nowrap">
                    {request.preferredTime}
                  </td>

                  {/* Additional Message */}
                  <td className="p-3">
                    <div className="max-w-[200px] whitespace-normal break-words text-sm text-gray-600">
                      {request.message || "—"}
                    </div>
                  </td>

                  {/* Submitted At */}
                  <td className="p-3 whitespace-nowrap text-sm text-gray-600">
                    {formatSubmittedDate(request.createdAt)}
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <span className="px-3 py-1 text-xs font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                      {request.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
