
import { useEffect, useState } from "react";
import instance from "../utils/axiosConfig";
import { useAuth } from "../constext/AuthContext";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowRightLeft,
  UserRound,
  ChevronLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MiniSeatLayout from "../components/MiniSeatLayout";
import BusIcon from "../assets/icons and logo/Bus image.png";

// Ticket Card Component
const TicketCard = ({ booking, onCancel }) => {
  const {
    busId,
    seatNumber,
    journeyFrom,
    journeyTo,
    journeyDate,
    _id,
  } = booking;

  // Deleted bus হলে ticket দেখাবে না
  if (!busId) return null;

  // Actual scheduled departure time
  const departureTime = busId.departureTime || busId.time || "Not available";

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-lg rounded-2xl">
      {/* Green Ticket Header */}
      <div className="relative p-5 m-3 text-white bg-green-400 shadow-lg rounded-2xl">

        {/* Cancel Button */}
        <button
          onClick={() => onCancel(_id)}
          title="Cancel Booking"
          className="absolute p-2 text-red-400 top-2 right-2 hover:text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Bus Icon */}
        <div className="w-32 mx-auto mb-4">
          <img
            className="w-full"
            src={BusIcon}
            alt="Bus Icon"
          />
        </div>

        {/* Journey Route */}
        <div className="flex items-center justify-between">
          <span className="w-2/5 text-xl font-bold text-center">
            {journeyFrom}
          </span>

          <div className="flex items-center justify-center w-10 h-10 bg-gray-800 border-4 rounded-full border-theme-green">
            <ArrowRightLeft size={20} className="text-white" />
          </div>

          <span className="w-2/5 text-xl font-bold text-center">
            {journeyTo}
          </span>
        </div>

        {/* Journey Date and Departure Time */}
        <div className="pt-2 mt-4 text-center border-t border-green-500">
          <span className="font-semibold">
            {journeyDate || "Date unavailable"}
          </span>

          <p className="mt-1 font-semibold">
            Departure Time: {departureTime}
          </p>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-5">
        <div className="flex justify-between space-x-4">

          {/* Booking Information */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">
                Seat Number:
              </label>
              <p className="text-2xl font-bold text-gray-900">
                {seatNumber}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Bus Name:
              </label>
              <p className="font-semibold text-gray-800 text-md">
                {busId.busName || "Not available"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Driver name:
              </label>
              <p className="font-semibold text-gray-800 text-md">
                {busId.driverName || "Not available"}
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-500">
                Contact:
              </label>
              <p className="font-semibold text-gray-800 text-md">
                {busId.driverContact || "Not available"}
              </p>
            </div>
          </div>

          {/* Mini Seat Layout */}
          <div className="shrink-0">
            <MiniSeatLayout
              bookedSeat={seatNumber}
              totalSeats={busId.totalSeats || 40}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function MyBookings() {
  const { user, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await instance.get("/secure/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    if (user) fetchProfile();
  }, [user]);

  // Fetch Bookings
  const fetchBookings = async () => {
    try {
      const res = await instance.get("/bookings");
      setBookings(res.data);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Cancel Booking
  const handleCancel = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this booking?"
      )
    ) {
      return;
    }

    try {
      await instance.delete(`/bookings/${id}`);

      toast.success("Booking cancelled");

      fetchBookings();
    } catch (err) {
      toast.error(
        "Failed to cancel booking: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-theme-bg">

      {/* Header */}
      <header className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>

        <Link
          to="/profile"
          className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
        >
          <UserRound size={24} className="text-gray-500" />
        </Link>
      </header>

      {/* Page Content */}
      <div className="px-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-800">
          My Bookings
        </h1>

        {loading ? (
          <div className="flex justify-center mt-20">
            <Loader2
              className="animate-spin text-theme-green"
              size={40}
            />
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-gray-500">
              You have no active bookings.
            </p>

            <Link
              to="/home"
              className="mt-2 font-semibold text-theme-green"
            >
              Book a seat now
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <TicketCard
                key={booking._id}
                booking={booking}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
