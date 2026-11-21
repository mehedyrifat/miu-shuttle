
import { useLocation, useNavigate, Link } from "react-router-dom";
import { UserRound, ChevronLeft, ArrowRightLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import instance from "../utils/axiosConfig";
import { useAuth } from "../constext/AuthContext";
import BusIcon from "../assets/icons and logo/Bus image.png";

export default function AvailableBuses() {
  const { profile } = useAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const searchState = location.state || {
    from: "Campus",
    to: "Route",
    dateString: "Today",
    dateObject: new Date(),
  };

  const [displayDate, setDisplayDate] = useState(searchState.dateString);

  // Format journey date and day from the Bus schedule
  const getJourneyDate = (date) => {
    if (!date) return "Date unavailable";

    const d = new Date(date);

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  const getJourneyDay = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "UTC",
    });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchBuses = async () => {
      setLoading(true);
      setSelectedBus(null);

      if (!searchState.from || !searchState.to) {
        toast.error("Please select 'From' and 'To' locations.");
        setLoading(false);
        return;
      }

      try {
        const res = await instance.get("/buses", {
          params: {
            from: searchState.from,
            to: searchState.to,
          },
        });

        if (!cancelled) {
          setBuses(res.data);

          // Show the actual journey date returned by the server
          if (res.data.length > 0) {
            const actualDate = res.data[0].journeyDate;

            setDisplayDate(
              `${getJourneyDate(actualDate)} | ${getJourneyDay(actualDate)}`
            );
          } else {
            setDisplayDate(searchState.dateString);
          }
        }
      } catch (err) {
        console.error("Error loading buses:", err);

        if (!cancelled) {
          setBuses([]);
          setDisplayDate(searchState.dateString);
          toast.error("Failed to find buses for this route.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBuses();

    return () => {
      cancelled = true;
    };
  }, [searchState.from, searchState.to]);

  const isBusDisabled = (bus) => {
    if (!profile) return true;

    const userRole = profile.role;
    const userGender = profile.gender;
    const busType = bus.busType;

    if (userRole === "Student" && busType === "Faculty") {
      return true;
    }

    if (userRole === "Student") {
      if (userGender === "Male" && busType === "Female") return true;
      if (userGender === "Female" && busType === "Male") return true;
    }

    return false;
  };

  const handleConfirm = () => {
    if (!selectedBus) {
      toast.error("Please select a bus");
      return;
    }

    // Use the actual schedule date, not the date sent from Home
    const journeyDate = new Date(selectedBus.journeyDate);

    const journeyInfo = {
      ...searchState,
      dateObject: journeyDate,
      dateString: `${getJourneyDate(selectedBus.journeyDate)} | ${getJourneyDay(selectedBus.journeyDate)}`,
    };

    navigate("/seat-selection", {
      state: {
        bus: selectedBus,
        journeyInfo,
      },
    });
  };

  return (
    <div className="min-h-screen p-6 pb-24 bg-theme-bg">
      <header className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="z-20 p-2 bg-white rounded-full shadow-lg"
        >
          <ChevronLeft size={24} />
        </button>

        <h1 className="text-xl font-semibold">
          Hello {profile?.fullName?.split(" ")[0] || "User"}!
        </h1>

        <Link
          to="/profile"
          className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full"
        >
          <UserRound size={24} className="text-gray-500" />
        </Link>
      </header>

      <p className="mb-4 -mt-4 text-center text-gray-600">
        Select your bus!
      </p>

      <div className="p-5 mb-6 text-white bg-green-400 shadow-lg rounded-2xl">
        <div className="mx-auto mb-3 w-28">
          <img className="w-full" src={BusIcon} alt="Bus Icon" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{searchState.from}</span>

          <div className="flex items-center justify-center w-10 h-10 bg-gray-800 border-4 rounded-full border-theme-green">
            <ArrowRightLeft size={20} className="text-white" />
          </div>

          <span className="text-2xl font-bold">{searchState.to}</span>
        </div>

        <div className="pt-2 mt-4 text-center border-t border-green-500">
          <span className="font-semibold">
            {displayDate}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10">
          <Loader2
            className="animate-spin text-theme-green"
            size={40}
          />
        </div>
      ) : buses.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">
          This date's bus is not available yet
        </p>
      ) : (
        <div className="space-y-4">
          {buses.map((bus, index) => {
            const isDisabled = isBusDisabled(bus);
            const isSelected = selectedBus?._id === bus._id;

            return (
              <button
                key={bus._id}
                onClick={() => !isDisabled && setSelectedBus(bus)}
                disabled={isDisabled}
                className={`flex items-center w-full p-4 bg-white rounded-lg shadow border-2
                  ${isSelected ? "border-theme-green" : "border-transparent"}
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-center justify-center w-12 h-12 mr-4 text-2xl font-bold text-white bg-green-400 rounded-lg">
                  {index + 1}
                </div>

                <div className="text-left">
                  <h3 className="text-lg font-bold">
                    {bus.busType} Bus
                  </h3>

                  <p className="text-sm text-gray-600">
                    Bus Name: {bus.busName}
                  </p>

                  <p className="text-sm text-gray-600">
                    Driver: {bus.driverName}
                  </p>

                  <p className="text-sm text-gray-500">
                    Contact: {bus.driverContact}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-green-700">
                    Journey: {getJourneyDate(bus.journeyDate)} |{" "}
                    {getJourneyDay(bus.journeyDate)}
                  </p>

                  <p className="text-sm text-gray-600">
                    Departure: {bus.departureTime}
                  </p>
                </div>

                <div className="flex items-center justify-center w-12 h-12 ml-auto bg-gray-800 rounded-full">
                  <UserRound size={24} className="text-white" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {buses.length > 0 && !loading && (
        <div className="mt-8">
          <button
            onClick={handleConfirm}
            disabled={!selectedBus}
            className="w-full py-4 text-lg font-bold text-gray-900 rounded-lg shadow bg-[#facc15] disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
