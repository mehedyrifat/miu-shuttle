
import { Link, useLocation, useNavigate } from "react-router-dom";
import { UserRound, ChevronLeft, ArrowRightLeft } from "lucide-react";
import { useEffect, useState } from "react";
import instance from "../utils/axiosConfig";
import { useAuth } from "../constext/AuthContext";
import toast from "react-hot-toast";
import { socket } from "../utils/socket";
import BusIcon from "../assets/icons and logo/Bus image.png";

const RESERVED_SEATS = [1, 2, 3, 4];

// Get the actual journey date from the Bus schedule
const getJourneyDateDetails = (bus) => {
  if (!bus?.journeyDate) {
    return {
      dateKey: "",
      displayDate: "Date unavailable",
      day: bus?.journeyDay || "",
    };
  }

  const date = new Date(bus.journeyDate);

  if (Number.isNaN(date.getTime())) {
    return {
      dateKey: "",
      displayDate: "Date unavailable",
      day: bus?.journeyDay || "",
    };
  }

  const dateKey = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");

  const displayDate = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  const day =
    bus.journeyDay ||
    date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });

  return {
    dateKey,
    displayDate,
    day,
  };
};

export default function SeatSelection() {
  const { profile } = useAuth();
  const [seats, setSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { bus, journeyInfo } = location.state || {};

  const journeyDetails = getJourneyDateDetails(bus);

  useEffect(() => {
    if (!bus) return;

    setSeats(
      Array.from({ length: bus.totalSeats || 40 }, (_, i) => i + 1)
    );

    setSelectedSeat(null);

    const fetchBooked = async () => {
      try {
        const res = await instance.get(`/bookings/bus/${bus._id}`);
        setBookedSeats(res.data);
      } catch (error) {
        toast.error("Failed to load seats.");
        console.error(error);
      }
    };

    fetchBooked();

    socket.emit("joinBusRoom", bus._id);

    const handleSeatStatusUpdate = (data) => {
      if (data.busId === bus._id) {
        setBookedSeats((prev) =>
          prev.includes(data.seatNumber)
            ? prev
            : [...prev, data.seatNumber]
        );
      }
    };

    const handleSeatCancelledUpdate = (data) => {
      if (data.busId === bus._id) {
        setBookedSeats((prev) =>
          prev.filter((seat) => seat !== data.seatNumber)
        );
      }
    };

    socket.on("seatStatusUpdate", handleSeatStatusUpdate);
    socket.on("seatCancelledUpdate", handleSeatCancelledUpdate);

    return () => {
      socket.off("seatStatusUpdate", handleSeatStatusUpdate);
      socket.off("seatCancelledUpdate", handleSeatCancelledUpdate);
    };
  }, [bus]);

  const isSeatDisabled = (seatNumber) => {
    if (bookedSeats.includes(seatNumber)) return true;
    if (!profile) return true;

    const userRole = profile.role;
    const isReserved = RESERVED_SEATS.includes(seatNumber);

    if (userRole === "Student" && isReserved) {
      return true;
    }

    return false;
  };

  // Booking handler
  const handleBooking = async () => {
    if (!selectedSeat) {
      return toast.error("Please select a seat");
    }

    if (!journeyDetails.dateKey || !bus.departureTime) {
      return toast.error("Journey date or departure time is missing.");
    }

    // Build the journey timestamp using the Bus schedule.
    // Bangladesh timezone is UTC+6.
    const journeyTimestamp = new Date(
      `${journeyDetails.dateKey}T${bus.departureTime}:00+06:00`
    );

    if (Number.isNaN(journeyTimestamp.getTime())) {
      return toast.error("Invalid journey date or departure time.");
    }

    // Display date and day from the actual Bus schedule
    const journeyDateString =
      `${journeyDetails.displayDate} | ${journeyDetails.day}`;

    try {
      await instance.post("/bookings", {
        busId: bus._id,
        seatNumber: selectedSeat,
        journeyFrom: journeyInfo.from,
        journeyTo: journeyInfo.to,
        journeyDate: journeyDateString,
        journeyTimestamp: journeyTimestamp.toISOString(),
      });

      toast.success("Seat booked!");
      navigate("/booking-confirmed");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Booking failed"
      );
    }
  };

  if (!bus || !journeyInfo) {
    return (
      <div className="min-h-screen p-6 pb-24 bg-theme-bg">
        <p>No bus selected.</p>
        <Link to="/home">Go back to Home</Link>
      </div>
    );
  }

  const availableSeatsLeft =
    (bus.totalSeats || 40) - bookedSeats.length;

  const isStudentBus = bus.busType !== "Faculty";

  return (
    <div className="min-h-screen p-6 pb-24 bg-[#FFFCEF]">
      <header className="flex items-center justify-between mb-6">
        <Link
          to="/available-buses"
          className="z-20 p-2 bg-white rounded-full shadow-lg"
        >
          <ChevronLeft size={24} />
        </Link>

        <h1 className="text-xl font-semibold">
          Hello, {profile?.fullName?.split(" ")[0] || "User"}!
        </h1>

        <Link
          to="/profile"
          className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
        >
          <UserRound size={24} className="text-gray-500" />
        </Link>
      </header>

      <p className="mb-4 -mt-4 text-center text-gray-600">
        Choose your seat!
      </p>

      {/* Journey Details Card */}
      <div className="p-5 mb-6 text-white bg-green-400 shadow-lg rounded-2xl">
        <div className="mb-3 font-semibold">
          Bus Name: {bus.busName}
        </div>

        <div className="mx-auto mb-3 w-28">
          <img
            className="w-full"
            src={BusIcon}
            alt="Bus Icon"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {journeyInfo.from}
          </span>

          <div className="flex items-center justify-center w-10 h-10 bg-gray-800 border-4 rounded-full border-theme-green">
            <ArrowRightLeft size={20} className="text-white" />
          </div>

          <span className="text-2xl font-bold">
            {journeyInfo.to}
          </span>
        </div>

        <div className="pt-2 mt-4 text-center border-t border-green-500">
          <span className="font-semibold">
            {journeyDetails.displayDate} | {journeyDetails.day}
          </span>

          <p className="mt-1 text-sm font-semibold">
            Departure Time: {bus.departureTime}
          </p>
        </div>
      </div>

      {/* Seat Layout and Legend */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="w-full p-4 bg-white shadow rounded-2xl">
          <div className="grid grid-cols-4 gap-3">
            {seats.map((num) => {
              const isDisabled = isSeatDisabled(num);
              const isSelected = selectedSeat === num;

              let seatClass = "bg-gray-200";

              if (bookedSeats.includes(num)) {
                seatClass = "bg-yellow-400";
              }

              if (isSelected) {
                seatClass = "bg-red-500";
              }

              if (
                isStudentBus &&
                RESERVED_SEATS.includes(num) &&
                !bookedSeats.includes(num) &&
                !isSelected
              ) {
                seatClass = "bg-blue-200";
              }

              return (
                <button
                  key={num}
                  disabled={isDisabled}
                  onClick={() => setSelectedSeat(num)}
                  className={`w-full h-8 rounded-lg ${seatClass}
                    ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                    ${isSelected ? "ring-2 ring-red-700" : ""}
                  `}
                ></button>
              );
            })}
          </div>
        </div>

        <div className="w-full p-4 bg-white shadow rounded-2xl">
          <ul className="space-y-3">
            <li className="flex items-center">
              <div className="w-5 h-5 mr-3 bg-yellow-400 rounded-full"></div>
              <span>Booked</span>
            </li>

            <li className="flex items-center">
              <div className="w-5 h-5 mr-3 bg-red-500 rounded-full"></div>
              <span>Your Seat</span>
            </li>

            {isStudentBus ? (
              <>
                <li className="flex items-center">
                  <div className="w-5 h-5 mr-3 bg-blue-200 rounded-full"></div>
                  <span>Reserved (Faculty/Stuff)</span>
                </li>

                <li className="flex items-center">
                  <div className="w-5 h-5 mr-3 bg-gray-200 rounded-full"></div>
                  <span>Available (Student)</span>
                </li>
              </>
            ) : (
              <li className="flex items-center">
                <div className="w-5 h-5 mr-3 bg-gray-200 rounded-full"></div>
                <span>Available</span>
              </li>
            )}
          </ul>

          <div className="pt-4 mt-4 border-t">
            <div className="px-4 py-2 font-bold text-center text-green-700 bg-green-100 rounded-lg">
              {availableSeatsLeft} Seats left
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {availableSeatsLeft > 0 ? (
          <button
            onClick={handleBooking}
            disabled={!selectedSeat}
            className="w-full py-4 text-lg font-bold text-gray-900 rounded-lg shadow bg-[#facc15] disabled:opacity-50"
          >
            Confirm booking
          </button>
        ) : (
          <div>
            <p className="mb-4 font-semibold text-center text-red-600">
              Sorry, no seats are available on this bus.
            </p>

            <button
              disabled
              className="w-full py-4 text-lg font-bold text-white bg-blue-500 rounded-lg shadow cursor-not-allowed opacity-70"
            >
              Request for Extra Bus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
