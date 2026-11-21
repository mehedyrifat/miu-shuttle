
import { useState, useEffect } from "react";
import { useAuth } from "../constext/AuthContext";
import instance from "../utils/axiosConfig";
import { useNavigate, Link } from "react-router-dom";
import {
  UserRound,
  Bus,
  MapPin,
  ArrowRightLeft,
  Loader2,
  ChevronDown,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { socket } from "../utils/socket";
import logo from "../assets/icons and logo/logo.png";

export default function Home() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Search State
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tripType, setTripType] = useState("Arrive");
  const [searchDate, setSearchDate] = useState(new Date());

  const [allRoutes, setAllRoutes] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const [latestNotice, setLatestNotice] = useState(null);
  const [loadingNotice, setLoadingNotice] = useState(true);

  // Extra Bus Request State
  const [showExtraBusModal, setShowExtraBusModal] = useState(false);
  const [requestTripType, setRequestTripType] = useState("Arrive");
  const [requestRoute, setRequestRoute] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestTime, setRequestTime] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Fetch all available routes
  useEffect(() => {
    const fetchAllRoutes = async () => {
      try {
        const res = await instance.get("/buses/routes");

        setAllRoutes(
          res.data.filter(
            (route) => route && route.toLowerCase() !== "campus"
          )
        );
      } catch (err) {
        console.error("Failed to fetch routes", err);
      }
    };

    fetchAllRoutes();
  }, []);

  // Fetch latest notice
  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        const res = await instance.get("/notices/latest");
        setLatestNotice(res.data);
      } catch (err) {
        console.error("Failed to fetch latest notice", err);
      } finally {
        setLoadingNotice(false);
      }
    };

    fetchLatestNotice();

    socket.on("newNotice", (newNotice) => {
      setLatestNotice(newNotice);
    });

    return () => {
      socket.off("newNotice");
    };
  }, []);

  // Format Date
  function getFormattedDate(dateObj) {
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "long",
    };

    const dateStr = dateObj.toLocaleDateString("en-GB", options);

    return dateStr
      .replace(",", " |")
      .replace(/ (\w{3}) /g, " - $1 - ");
  }

  // Format selected request date with weekday
  const getRequestDateWithDay = (dateValue) => {
    if (!dateValue) return "";

    const [year, month, day] = dateValue.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const formattedDay = date.toLocaleDateString("en-US", {
      weekday: "long",
    });

    return `${formattedDate} | ${formattedDay}`;
  };

  // Find Buses
  const handleFindBuses = () => {
    const selectedRoute = tripType === "Arrive" ? from : to;

    if (!selectedRoute) {
      alert("Please select your location first.");
      return;
    }

    const searchParams = {
      from: tripType === "Leave" ? "Campus" : from.trim(),
      to: tripType === "Leave" ? to.trim() : "Campus",
      dateString: getFormattedDate(searchDate),
      dateObject: searchDate,
    };

    navigate("/available-buses", { state: searchParams });
  };

  // Change Trip Type
  const handleTripTypeChange = (type) => {
    setTripType(type);

    setFrom(type === "Leave" ? "Campus" : "");
    setTo(type === "Arrive" ? "Campus" : "");

    setShowFromSuggestions(false);
    setShowToSuggestions(false);
  };

  // Select From Location
  const handleFromSelect = (route) => {
    setFrom(route);
    setShowFromSuggestions(false);
  };

  // Select To Location
  const handleToSelect = (route) => {
    setTo(route);
    setShowToSuggestions(false);
  };

  // Open Extra Bus Request Form
  const handleOpenExtraBusModal = () => {
    setRequestTripType(tripType);
    setRequestRoute("");
    setRequestDate("");
    setRequestTime("");
    setRequestMessage("");
    setShowExtraBusModal(true);
  };

  // Change Extra Bus Request Journey Type
  const handleRequestTripTypeChange = (type) => {
    setRequestTripType(type);
    setRequestRoute("");
    setRequestTime("");
  };

  // Submit Extra Bus Request
  const handleSubmitExtraBusRequest = async (e) => {
    e.preventDefault();

    if (!requestRoute) {
      toast.error("Please select your route.");
      return;
    }

    if (!requestDate) {
      toast.error("Please select your journey date.");
      return;
    }

    if (!requestTime) {
      toast.error("Please select your preferred bus time.");
      return;
    }

    const requestFrom =
      requestTripType === "Arrive" ? requestRoute : "Campus";

    const requestTo =
      requestTripType === "Arrive" ? "Campus" : requestRoute;

    const [year, month, day] = requestDate.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    const journeyDay = selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    });

    try {
      setSubmittingRequest(true);

      await instance.post("/extra-bus-requests", {
        journeyType: requestTripType,
        from: requestFrom,
        to: requestTo,
        journeyDate: requestDate,
        journeyDay,
        preferredTime: requestTime,
        message: requestMessage.trim(),
      });

      toast.success("Extra Bus Request submitted successfully!");

      setShowExtraBusModal(false);
      setRequestRoute("");
      setRequestDate("");
      setRequestTime("");
      setRequestMessage("");
    } catch (err) {
      console.error("Extra Bus Request Error:", err);

      toast.error(
        err.response?.data?.message ||
          "Failed to submit Extra Bus Request."
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const requestTimeOptions =
    requestTripType === "Arrive"
      ? ["8:00 AM", "10:00 AM"]
      : ["1:45 PM", "5:00 PM"];

  return (
    <div className="min-h-screen p-6 pb-24 bg-theme-bg">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="w-20 h-20">
          <img src={logo} alt="Logo" className="w-full" />
        </div>

        <Link
          to="/profile"
          className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full"
        >
          <UserRound size={32} className="text-gray-500" />
        </Link>
      </header>

      {/* Search Card */}
      <div className="p-6 text-white shadow-lg bg-[#63bd67] rounded-2xl">
        <h2 className="mb-4 text-2xl font-semibold">
          Welcome, {profile?.fullName?.split(" ")[0] || "User"}
        </h2>

        <div className="relative space-y-4 hide-scrollbar">
          {/* Boarding From */}
          <div className="relative">
            <MapPin
              size={20}
              className="absolute text-white -translate-y-1/2 left-3 top-1/2"
            />

            <input
              type="text"
              placeholder="Select Boarding Location"
              value={tripType === "Leave" ? "Campus" : from}
              readOnly
              onClick={() => {
                if (tripType === "Arrive") {
                  setShowFromSuggestions(!showFromSuggestions);
                  setShowToSuggestions(false);
                }
              }}
              disabled={tripType === "Leave"}
              className="w-full py-3 pl-10 pr-10 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed"
            />

            {tripType === "Arrive" && (
              <ChevronDown
                size={20}
                className="absolute text-white -translate-y-1/2 right-3 top-1/2 pointer-events-none"
              />
            )}

            {showFromSuggestions && tripType === "Arrive" && (
              <div className="absolute z-20 w-full overflow-y-auto bg-white rounded-b-lg shadow-lg max-h-48">
                {allRoutes.length > 0 ? (
                  allRoutes.map((route) => (
                    <div
                      key={route}
                      onClick={() => handleFromSelect(route)}
                      className="p-3 text-gray-800 cursor-pointer hover:bg-gray-100"
                    >
                      {route}
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-gray-500">
                    No routes available yet.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            <MapPin
              size={20}
              className="absolute text-white -translate-y-1/2 left-3 top-1/2"
            />

            <input
              type="text"
              placeholder="Select Destination"
              value={tripType === "Arrive" ? "Campus" : to}
              readOnly
              onClick={() => {
                if (tripType === "Leave") {
                  setShowToSuggestions(!showToSuggestions);
                  setShowFromSuggestions(false);
                }
              }}
              disabled={tripType === "Arrive"}
              className="w-full py-3 pl-10 pr-10 text-white rounded-lg cursor-pointer disabled:cursor-not-allowed"
            />

            {tripType === "Leave" && (
              <ChevronDown
                size={20}
                className="absolute text-white -translate-y-1/2 right-3 top-1/2 pointer-events-none"
              />
            )}

            {showToSuggestions && tripType === "Leave" && (
              <div className="absolute z-20 w-full overflow-y-auto bg-white rounded-b-lg shadow-lg max-h-48">
                {allRoutes.length > 0 ? (
                  allRoutes.map((route) => (
                    <div
                      key={route}
                      onClick={() => handleToSelect(route)}
                      className="p-3 text-gray-800 cursor-pointer hover:bg-gray-100"
                    >
                      {route}
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-gray-500">
                    No routes available yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="absolute flex items-center justify-center w-10 h-10 -translate-y-1/2 bg-gray-800 border-4 rounded-full right-4 top-1/2 border-theme-green"
          >
            <ArrowRightLeft size={20} className="text-white" />
          </button>
        </div>

        {/* Arrive / Leave */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => handleTripTypeChange("Arrive")}
            className={`py-3 rounded-lg font-semibold ${
              tripType === "Arrive"
                ? "bg-[#d0e9ea] text-[#3c3c43b3]"
                : "bg-green-700 text-white"
            }`}
          >
            Arrive
          </button>

          <button
            onClick={() => handleTripTypeChange("Leave")}
            className={`py-3 rounded-lg font-semibold ${
              tripType === "Leave"
                ? "bg-[#d0e9ea] text-[#3c3c43b3]"
                : "bg-green-700 text-white"
            }`}
          >
            Leave
          </button>
        </div>

        <button
          onClick={handleFindBuses}
          className="w-full py-3 mt-6 text-lg font-bold text-gray-900 bg-[#facc15] rounded-lg shadow"
        >
          Find Buses
        </button>
      </div>

      {/* Extra Buttons */}
      <div className="grid grid-cols-2 gap-4 my-6">
        <button
          onClick={handleOpenExtraBusModal}
          className="flex items-center justify-center p-4 space-x-2 font-semibold text-green-800 bg-green-100 rounded-lg"
        >
          <Bus size={24} />
          <span>Request for Extra Bus</span>
        </button>

        <button className="p-4 font-semibold text-green-800 bg-green-100 rounded-lg">
          Track My Bus
        </button>
      </div>

      {/* University Announcement */}
      <div>
        <h3 className="mb-3 text-xl font-semibold text-gray-800">
          University Announcement
        </h3>

        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 min-h-[100px]">
          {loadingNotice ? (
            <div className="flex justify-center items-center h-[100px]">
              <Loader2 className="animate-spin text-theme-green" />
            </div>
          ) : latestNotice ? (
            <>
              <h4 className="mb-2 font-bold text-theme-green">
                {latestNotice.title}
              </h4>

              <p className="text-sm text-gray-600">
                {latestNotice.content}
              </p>

              <small className="block mt-2 text-gray-400">
                {new Date(latestNotice.createdAt).toLocaleString()}
              </small>
            </>
          ) : (
            <p className="pt-8 text-center text-gray-500">
              No recent announcements.
            </p>
          )}
        </div>
      </div>

      {/* Extra Bus Request Modal */}
      {showExtraBusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-md max-h-[90vh] p-6 overflow-y-auto bg-white shadow-2xl rounded-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                Request for Extra Bus
              </h2>

              <button
                type="button"
                onClick={() => setShowExtraBusModal(false)}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmitExtraBusRequest} className="space-y-4">
              {/* Journey Type */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Journey Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {["Arrive", "Leave"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleRequestTripTypeChange(type)}
                      className={`py-3 font-semibold rounded-lg ${
                        requestTripType === type
                          ? "bg-[#d0e9ea] text-gray-800 border-2 border-green-600"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* From */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  From
                </label>

                {requestTripType === "Leave" ? (
                  <div className="w-full px-4 py-3 text-gray-700 bg-gray-100 border rounded-lg">
                    Campus
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={requestRoute}
                      onChange={(e) => setRequestRoute(e.target.value)}
                      className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Choose Location</option>
                      {allRoutes.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={20}
                      className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>
                )}
              </div>

              {/* To */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  To
                </label>

                {requestTripType === "Arrive" ? (
                  <div className="w-full px-4 py-3 text-gray-700 bg-gray-100 border rounded-lg">
                    Campus
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={requestRoute}
                      onChange={(e) => setRequestRoute(e.target.value)}
                      className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Choose Location</option>
                      {allRoutes.map((route) => (
                        <option key={route} value={route}>
                          {route}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={20}
                      className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                    />
                  </div>
                )}
              </div>

              {/* Journey Date */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Journey Date
                </label>

                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                {requestDate && (
                  <p className="mt-2 text-sm font-medium text-green-700">
                    {getRequestDateWithDay(requestDate)}
                  </p>
                )}
              </div>

              {/* Preferred Bus Time */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Preferred Bus Time
                </label>

                <div className="relative">
                  <select
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                    className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Time</option>

                    {requestTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={20}
                    className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2"
                  />
                </div>
              </div>

              {/* Additional Message */}
              <div>
                <label className="block mb-2 font-semibold text-gray-700">
                  Additional Message (Optional)
                </label>

                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={3}
                  placeholder="কোনো অতিরিক্ত তথ্য থাকলে লিখবে।"
                  className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingRequest}
                className="flex items-center justify-center w-full gap-2 py-3 font-bold text-gray-900 bg-[#facc15] rounded-lg shadow disabled:opacity-60"
              >
                {submittingRequest ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
