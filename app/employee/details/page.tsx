"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function EmployeeDetails() {
  const { user, token } = useAuth();
  const router = useRouter();

  // ---------------------------
  // Text form data
  // ---------------------------
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
  });

  // ---------------------------
  // Files for upload (REAL File objects)
  // ---------------------------
  const [files, setFiles] = useState<{
    photo: File | null;
    aadhaar: File | null;
    pan: File | null;
  }>({
    photo: null,
    aadhaar: null,
    pan: null,
  });

  // ---------------------------
  // Preview URLs (UI only)
  // ---------------------------
  const [previews, setPreviews] = useState<{
    photo?: string;
    aadhaar?: string;
    pan?: string;
  }>({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------
  // Prefill data
  // ---------------------------
  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      router.push("/employee/login");
      return;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      contact: "",
    });
  }, [user, router]);

  // ---------------------------
  // Cleanup preview URLs
  // ---------------------------
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // ---------------------------
  // Text input handler
  // ---------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------------------------
  // File handler (UPLOAD + PREVIEW)
  // ---------------------------
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "photo" | "aadhaar" | "pan",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1️⃣ Store File object for backend
    setFiles((prev) => ({
      ...prev,
      [field]: file,
    }));

    // 2️⃣ Create preview URL for UI
    const previewUrl = URL.createObjectURL(file);

    setPreviews((prev) => ({
      ...prev,
      [field]: previewUrl,
    }));
  };

  // ---------------------------
  // Submit (multipart/form-data)
  // ---------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔍 DEBUG: auth
    console.log("TOKEN:", token);

    if (!token) {
      setError("Not authenticated");
      return;
    }

    // 🔍 DEBUG: text inputs
    console.log("FORM DATA (TEXT):", {
      name: formData.name,
      email: formData.email,
      contact: formData.contact,
    });

    // 🔍 DEBUG: file inputs (existence + metadata)
    console.log("FILES:", {
      aadhaar: files.aadhaar
        ? {
            name: files.aadhaar.name,
            type: files.aadhaar.type,
            size: files.aadhaar.size,
          }
        : null,
      pan: files.pan
        ? {
            name: files.pan.name,
            type: files.pan.type,
            size: files.pan.size,
          }
        : null,
      photo: files.photo
        ? {
            name: files.photo.name,
            type: files.photo.type,
            size: files.photo.size,
          }
        : null,
    });

    // 🔴 FRONTEND GUARD
    if (!files.aadhaar || !files.pan) {
      setError("Please upload Aadhaar and PAN documents");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("email", formData.email);
      payload.append("contact", formData.contact);

      payload.append("aadhaar", files.aadhaar);
      payload.append("pan", files.pan);

      if (files.photo) payload.append("photo", files.photo);

      // 🔍 DEBUG: FormData entries (VERY IMPORTANT)
      console.log("FORM DATA PAYLOAD:");
      for (const [key, value] of payload.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: [File]`,
            value.name,
            value.type,
            `${(value.size / 1024).toFixed(2)} KB`,
          );
        } else {
          console.log(`${key}:`, value);
        }
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/employee/details`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: payload,
        },
      );

      console.log("RESPONSE STATUS:", res.status);

      const text = await res.text();

      console.log("RAW RESPONSE TEXT:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("HTML response from server:", text);
        throw new Error("Server error. Please try again.");
      }

      console.log("PARSED RESPONSE JSON:", data);

      if (!res.ok) {
        throw new Error(data.message || "Submission failed");
      }

      router.push("/employee/profile");
    } catch (err: any) {
      console.error("SUBMIT ERROR:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="bg-white rounded-xl shadow border">
          <div className="px-8 py-6 border-b bg-gray-50">
            <h1 className="text-2xl font-bold">Employee Details</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Full Name"
                className="input-field"
                required
              />

              <input
                name="email"
                value={formData.email}
                disabled
                className="input-field"
              />

              <input
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                placeholder="Phone Number"
                className="input-field"
                required
              />
            </div>

            {/* Documents */}
            <div className="grid md:grid-cols-2 gap-8">
              {(["aadhaar", "pan"] as const).map((field) => (
                <div key={field}>
                  <label className="text-sm font-medium capitalize">
                    {field} Card
                  </label>

                  <div className="relative border-2 border-dashed rounded-lg p-4 mt-2 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, field)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />

                    {previews[field] ? (
                      <Image
                        src={previews[field]!}
                        alt={field}
                        width={300}
                        height={160}
                        className="object-cover rounded"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <Upload className="mx-auto mb-2" />
                        Click to upload
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !files.aadhaar || !files.pan}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle size={18} />
                {submitting ? "Saving..." : "Submit Details"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
