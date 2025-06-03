"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { eventSchema, ZodIssue } from "@/utils/validations";
import { createEvent } from "@/utils/database.updated";
import { getCurrentUser } from "@/utils/auth";
import toast from "react-hot-toast";

export default function CreateEvent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    capacity: "",
    price: "",
    category: "",
    image_url: "",
  });
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);

    try {
      // Convert strings to numbers where needed
      const validationData = {
        ...formData,
        capacity: parseInt(formData.capacity) || 0,
        price: parseFloat(formData.price) || 0,
      };

      // Validate form data
      const parsedData = eventSchema.parse(validationData);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        toast.error("You must be logged in to create an event");
        router.push("/login");
        return;
      }      // Create event
      const eventData = {
        organizer_id: currentUser.id,
        status: "draft" as const,
        title: formData.title, // Use the correct field name
        description: formData.description,
        location: formData.location,
        start_date: parsedData.start_date,
        end_date: parsedData.end_date,
        capacity: parsedData.capacity,
        price: parsedData.price,
        category: parsedData.category,
        image_url: formData.image_url || "",
      };

      const newEvent = await createEvent(eventData);

      if (newEvent) {
        toast.success("Event created successfully!");
        router.push(`/dashboard/events`);
      } else {
        throw new Error("Failed to create event");
      }
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        toast.error(error.message || "Failed to create event. Please try again.");
        console.error("Event creation error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Event Title */}
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Event Title
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "title") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "title")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "description") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "description")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "location") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "location")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  <option value="academic">Academic</option>
                  <option value="cultural">Cultural</option>
                  <option value="sports">Sports</option>
                  <option value="technology">Technology</option>
                  <option value="career">Career Fair</option>
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="other">Other</option>
                </select>
                {errors.find((e) => e.path[0] === "category") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "category")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                Start Date and Time
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="start_date"
                  name="start_date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "start_date") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "start_date")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                End Date and Time
              </label>
              <div className="mt-1">
                <input
                  type="datetime-local"
                  id="end_date"
                  name="end_date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "end_date") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "end_date")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                Capacity
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "capacity") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "capacity")?.message}
                  </p>
                )}
              </div>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Ticket Price ($)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="price"
                  name="price"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
                {errors.find((e) => e.path[0] === "price") && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.find((e) => e.path[0] === "price")?.message}
                  </p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Enter 0 for free events</p>
            </div>

            {/* Image URL */}
            <div className="col-span-2">
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">
                Event Image URL (optional)
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  id="image_url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/events')}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
