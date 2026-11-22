
import { useEffect, useState } from "react";
import instance from "../utils/axiosConfig";
import toast from "react-hot-toast";
import { Plus, Edit, Trash } from "lucide-react";

const CAMPUS = "Manarat International University (Campus)";

const ROUTES = [
  "Mohammadpur",
  "Mirpur-1",
  "Mirpur-10",
  "Rampura Bridge",
  "BNS Center",
  "Uttara",
  "Vogra Bypass Gazipur",
  "Chandra",
  "Hemayetpur Savar",
];

const TIME_OPTIONS = {
  Arrive: [
    { display: "8:00 AM", departure: "08:00" },
    { display: "10:00 AM", departure: "10:00" },
  ],
  Leave: [
    { display: "1:45 PM", departure: "13:45" },
    { display: "5:00 PM", departure: "17:00" },
  ],
};

const defaultFormState = {
  busName: "",
  journeyType: "Arrive",
  routeFrom: "",
  routeTo: CAMPUS,
  time: "8:00 AM",
  departureTime: "08:00",
  journeyDate: "",
  totalSeats: 40,
  driverName: "",
  driverContact: "",
  busType: "Combined",
};

export default function BusManagement() {
  const [buses, setBuses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [formData, setFormData] = useState(defaultFormState);

  const fetchBuses = async () => {
    try {
      const res = await instance.get("/admin/buses");
      setBuses(res.data);
    } catch (err) {
      toast.error("Failed to fetch buses");
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Journey Type অনুযায়ী From, To এবং Time সেট করা
  const handleJourneyTypeChange = (e) => {
    const journeyType = e.target.value;
    const firstTime = TIME_OPTIONS[journeyType][0];

    setFormData((prev) => ({
      ...prev,
      journeyType,
      routeFrom: journeyType === "Arrive" ? "" : CAMPUS,
      routeTo: journeyType === "Arrive" ? CAMPUS : "",
      time: firstTime.display,
      departureTime: firstTime.departure,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      formData.journeyType === "Arrive" &&
      (!formData.routeFrom || formData.routeTo !== CAMPUS)
    ) {
      toast.error("Please select an arrival route");
      return;
    }

    if (
      formData.journeyType === "Leave" &&
      (!formData.routeTo || formData.routeFrom !== CAMPUS)
    ) {
      toast.error("Please select a departure route");
      return;
    }

    try {
      const payload = {
        ...formData,
        totalSeats: Number(formData.totalSeats),
      };

      if (isEditing) {
        await instance.put(`/admin/bus/${currentBus._id}`, payload);
        toast.success("Bus updated successfully");
      } else {
        await instance.post("/admin/bus", payload);
        toast.success("Bus added successfully");
      }

      resetModal();
      fetchBuses();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save bus"
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      try {
        await instance.delete(`/admin/bus/${id}`);
        toast.success("Bus deleted");
        fetchBuses();
      } catch (err) {
        toast.error("Failed to delete bus");
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentBus(null);
    setFormData(defaultFormState);
  };

  const openEditModal = (bus) => {
    // পুরোনো বাসের From / To দেখে Journey Type নির্ধারণ
    const journeyType =
      bus.routeTo === CAMPUS
        ? "Arrive"
        : bus.routeFrom === CAMPUS
        ? "Leave"
        : "Arrive";

    const allowedTimes = TIME_OPTIONS[journeyType];

    const selectedTime = allowedTimes.find(
      (item) =>
        item.display === bus.time ||
        item.departure === bus.departureTime
    );

    setFormData({
      busName: bus.busName || "",
      journeyType,
      routeFrom: journeyType === "Arrive" ? bus.routeFrom || "" : CAMPUS,
      routeTo: journeyType === "Arrive" ? CAMPUS : bus.routeTo || "",
      time: selectedTime?.display || allowedTimes[0].display,
      departureTime:
        selectedTime?.departure || allowedTimes[0].departure,
      journeyDate: bus.journeyDate
        ? bus.journeyDate.substring(0, 10)
        : "",
      totalSeats: bus.totalSeats || 40,
      driverName: bus.driverName || "",
      driverContact: bus.driverContact || "",
      busType: bus.busType || "Combined",
    });

    setCurrentBus(bus);
    setIsEditing(true);
    setShowModal(true);
  };

  const openAddModal = () => {
    resetModal();
    setShowModal(true);
  };

  const getJourneyDay = (date) => {
    if (!date) return "Not Set";

    const [year, month, day] = date
      .substring(0, 10)
      .split("-")
      .map(Number);

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return days[
      new Date(Date.UTC(year, month - 1, day)).getUTCDay()
    ];
  };

  const currentTimeOptions = TIME_OPTIONS[formData.journeyType];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Bus Management</h1>

        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2 space-x-2 font-semibold text-white rounded-lg bg-theme-green hover:bg-green-700"
        >
          <Plus size={20} />
          <span>Add New Bus</span>
        </button>
      </div>

      {/* Bus Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Bus Name</th>
              <th className="p-3 text-left">Route</th>
              <th className="p-3 text-left">Journey Date</th>
              <th className="p-3 text-left">Day</th>
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {buses.map((bus) => (
              <tr key={bus._id} className="border-b">
                <td className="p-3">{bus.busName}</td>

                <td className="p-3">
                  {bus.routeFrom} to {bus.routeTo}
                </td>

                <td className="p-3">
                  {bus.journeyDate
                    ? new Date(bus.journeyDate).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          timeZone: "UTC",
                        }
                      )
                    : "Not Set"}
                </td>

                <td className="p-3">
                  {bus.journeyDay || getJourneyDay(bus.journeyDate)}
                </td>

                <td className="p-3">
                  {bus.time} ({bus.departureTime})
                </td>

                <td className="p-3">{bus.busType}</td>

                <td className="p-3">
                  <button
                    onClick={() => openEditModal(bus)}
                    className="mr-2 text-blue-600"
                  >
                    <Edit size={18} />
                  </button>

                  <button
                    onClick={() => handleDelete(bus._id)}
                    className="text-red-600"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/50">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg">
            <h2 className="mb-4 text-2xl font-bold">
              {isEditing ? "Edit Bus" : "Add New Bus"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 max-h-[80vh] overflow-y-auto pr-2"
            >
              {/* Bus Name */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Bus Name
                </label>

                <input
                  name="busName"
                  value={formData.busName}
                  onChange={handleChange}
                  placeholder="Bus Name (e.g., 05)"
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Journey Type */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Journey Type
                </label>

                <select
                  name="journeyType"
                  value={formData.journeyType}
                  onChange={handleJourneyTypeChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="Arrive">Arrive</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              {/* From */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  From
                </label>

                {formData.journeyType === "Arrive" ? (
                  <select
                    name="routeFrom"
                    value={formData.routeFrom}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Arrival Route</option>

                    {ROUTES.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={CAMPUS}
                    readOnly
                    className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
                  />
                )}
              </div>

              {/* To */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  To
                </label>

                {formData.journeyType === "Arrive" ? (
                  <input
                    value={CAMPUS}
                    readOnly
                    className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed"
                  />
                ) : (
                  <select
                    name="routeTo"
                    value={formData.routeTo}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select Departure Route</option>

                    {ROUTES.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Journey Date */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Journey Date
                </label>

                <input
                  name="journeyDate"
                  type="date"
                  value={formData.journeyDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {/* Display Time */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Display Time
                </label>

                <select
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  {currentTimeOptions.map((item) => (
                    <option key={item.display} value={item.display}>
                      {item.display}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure Time */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Departure Time (24-hour format)
                </label>

                <select
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  {currentTimeOptions.map((item) => (
                    <option
                      key={item.departure}
                      value={item.departure}
                    >
                      {item.departure}
                    </option>
                  ))}
                </select>
              </div>

              {/* Total Seats */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Total Seats
                </label>

                <input
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleChange}
                  type="number"
                  min="1"
                  placeholder="Total Seats"
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Driver Name */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Driver Name
                </label>

                <input
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleChange}
                  placeholder="Driver Name"
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Driver Contact */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Driver Contact
                </label>

                <input
                  name="driverContact"
                  value={formData.driverContact}
                  onChange={handleChange}
                  placeholder="Driver Contact"
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Bus Type */}
              <div>
                <label className="block mb-1 text-sm font-medium">
                  Bus Type
                </label>

                <select
                  name="busType"
                  value={formData.busType}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="Combined">Combined</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Faculty">Faculty</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded bg-theme-green"
                >
                  {isEditing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
