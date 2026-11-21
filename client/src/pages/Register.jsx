
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebase.config";
import instance from "../utils/axiosConfig";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../constext/AuthContext";

export default function Register() {
  const [role, setRole] = useState("Student");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const navigate = useNavigate();

  const { fetchUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "Male",
    agree: false,
    studentId: "",
    department: "",
    batch: "",
    facultyId: "",
    designation: "",
    stuffId: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    let updatedValue = type === "checkbox" ? checked : value;

    // Bangladesh mobile number: digits only, maximum 11 digits
    if (name === "mobile") {
      updatedValue = value.replace(/\D/g, "").slice(0, 11);
    }

    // Batch: digits only
    if (name === "batch") {
      updatedValue = value.replace(/\D/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: updatedValue,
    }));
  };

  const handleRoleChange = (e) => {
    setRole(e.target.value);

    setFormData((prev) => ({
      ...prev,
      studentId: "",
      department: "",
      batch: "",
      facultyId: "",
      designation: "",
      stuffId: "",
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const {
      email,
      password,
      confirmPassword,
      fullName,
      mobile,
      gender,
      agree,
    } = formData;

    if (!fullName || !mobile || !email || !password || !agree) {
      return toast.error(
        "Please fill all required fields and agree to terms."
      );
    }

    // Bangladesh mobile number validation
    const bangladeshMobileRegex = /^01[3-9]\d{8}$/;

    if (!bangladeshMobileRegex.test(mobile)) {
      return toast.error(
        "Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678)."
      );
    }

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }

    let roleSpecific = {};

    if (role === "Student") {
      roleSpecific = {
        studentId: formData.studentId,
        department: formData.department,
        batch: formData.batch,
      };
    } else if (role === "Faculty") {
      roleSpecific = {
        facultyId: formData.facultyId,
        department: formData.department,
        designation: formData.designation,
      };
    } else if (role === "Stuff") {
      roleSpecific = {
        stuffId: formData.stuffId,
        department: formData.department,
        designation: formData.designation,
      };
    }

    try {
      // Step 1: Create Firebase account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Step 2: Save user details in MongoDB
      await instance.post("/secure/register-details", {
        fullName,
        mobile,
        gender,
        role,
        roleSpecific,
      });

      // Step 3: Load user profile
      await fetchUserProfile(userCredential.user);

      // Step 4: Redirect to mandatory ID verification
      toast.success(
        "Account created successfully! Please verify your University ID."
      );

      navigate("/verify-id");
    } catch (err) {
      console.error("Registration error:", err);

      toast.error(
        err.response?.data?.message || err.message || "Registration failed."
      );
    }
  };

  const renderRoleFields = () => {
    if (role === "Student") {
      return (
        <>
          <input
            type="text"
            name="studentId"
            placeholder="Student ID"
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={formData.studentId}
            onChange={handleChange}
            required
          />

          <div className="flex space-x-4">
            <input
              type="text"
              name="department"
              placeholder="Department"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.department}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="batch"
              placeholder="Batch Number"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.batch}
              onChange={handleChange}
              required
            />
          </div>
        </>
      );
    }

    if (role === "Faculty") {
      return (
        <>
          <input
            type="text"
            name="facultyId"
            placeholder="Faculty ID"
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={formData.facultyId}
            onChange={handleChange}
            required
          />

          <div className="flex space-x-4">
            <input
              type="text"
              name="department"
              placeholder="Department"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.department}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="designation"
              placeholder="Designation"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.designation}
              onChange={handleChange}
              required
            />
          </div>
        </>
      );
    }

    if (role === "Stuff") {
      return (
        <>
          <input
            type="text"
            name="stuffId"
            placeholder="Stuff ID"
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={formData.stuffId}
            onChange={handleChange}
            required
          />

          <div className="flex space-x-4">
            <input
              type="text"
              name="department"
              placeholder="Department"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.department}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="designation"
              placeholder="Designation"
              className="w-1/2 p-4 border border-gray-300 rounded-lg"
              value={formData.designation}
              onChange={handleChange}
              required
            />
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-screen p-6 bg-theme-bg">
      <div className="flex items-center mb-6">
        <Link
          to="/login"
          className="z-20 p-3 bg-white rounded-full shadow-lg"
        >
          <ChevronLeft size={24} />
        </Link>

        <h1 className="text-2xl font-bold text-center grow">
          Create an account
        </h1>
      </div>

      <form
        onSubmit={handleRegister}
        className="pb-4 space-y-4 overflow-y-auto hide-scrollbar"
      >
        <input
          type="text"
          name="fullName"
          placeholder="Name"
          className="w-full p-4 border border-gray-300 rounded-lg"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="mobile"
          placeholder="Phone number (01XXXXXXXXX)"
          className="w-full p-4 border border-gray-300 rounded-lg"
          value={formData.mobile}
          onChange={handleChange}
          inputMode="numeric"
          maxLength={11}
          pattern="01[3-9][0-9]{8}"
          title="Enter a valid 11-digit Bangladesh mobile number, e.g. 01712345678"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="w-full p-4 border border-gray-300 rounded-lg"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          value={role}
          onChange={handleRoleChange}
          className="w-full p-4 bg-white border border-gray-300 rounded-lg"
        >
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
          <option value="Stuff">Stuff</option>
        </select>

        {renderRoleFields()}

        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full p-4 bg-white border border-gray-300 rounded-lg"
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <div className="relative w-full">
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Password (minimum 6 characters)"
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute text-gray-500 right-4 top-4"
          >
            {showPass ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <div className="relative w-full">
          <input
            type={showConfirmPass ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm password"
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute text-gray-500 right-4 top-4"
          >
            {showConfirmPass ? <EyeOff /> : <Eye />}
          </button>
        </div>

        <label className="flex items-center text-sm text-gray-600">
          <input
            type="checkbox"
            name="agree"
            checked={formData.agree}
            className="mr-2"
            onChange={handleChange}
            required
          />
          I accept the Terms and condition
        </label>

        <button
          type="submit"
          className="w-full py-4 mt-4 text-lg font-semibold text-white rounded-lg shadow-lg bg-[#059669]"
        >
          Register
        </button>
      </form>
    </div>
  );
}
