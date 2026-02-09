"use client";

import { useState, useEffect } from "react";
import { useAuth, EmployeeProfile } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function EmployeeDetails() {
  const { user, updateEmployeeProfile } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<EmployeeProfile>({
    name: "",
    email: "",
    phone: "",
    aadhaar: "",
    pan: "",
    otherDocs: [],
  });

  const [previews, setPreviews] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!user || user.role !== "EMPLOYEE") {
      router.push("/employee/login");
      return;
    }
    // Pre-fill if exists
    if (user.profile) {
      setFormData(user.profile);
      // In real app, these would be URLs. For mock, we assume they are valid image sources if present.
    } else {
      setFormData((prev) => ({ ...prev, name: user.name }));
    }
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData((prev) => ({ ...prev, [field]: result }));
        setPreviews((prev) => ({ ...prev, [field]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      updateEmployeeProfile(user.id, formData);
      router.push("/employee/profile");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Details Form
            </h1>
            <p className="text-gray-500 mt-1">
              Please fill in your information accurately.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Info Section */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Documents Section */}
            <section className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Document Uploads
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Aadhaar Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Aadhaar Card Image
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors text-center group bg-gray-50 hover:bg-blue-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "aadhaar")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {formData.aadhaar ? (
                      <div className="relative w-full h-32 rounded overflow-hidden">
                        <Image
                          src={formData.aadhaar}
                          alt="Aadhaar Preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">
                            Click to Change
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500">
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">Click to upload Aadhaar</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAN Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    PAN Card Image
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors text-center group bg-gray-50 hover:bg-blue-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "pan")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {formData.pan ? (
                      <div className="relative w-full h-32 rounded overflow-hidden">
                        <Image
                          src={formData.pan}
                          alt="PAN Preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm font-medium">
                            Click to Change
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-blue-500">
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">Click to upload PAN</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="btn-primary flex items-center space-x-2 px-8"
              >
                <CheckCircle size={20} />
                <span>Submit Details</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
