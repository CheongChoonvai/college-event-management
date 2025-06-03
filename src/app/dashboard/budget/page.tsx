"use client";

import { useState, useEffect, FormEvent } from "react";
import { budgetItemSchema, ZodIssue } from "@/utils/validations";
import { createBudgetItem, getEventBudget, updateBudgetItem } from "@/utils/database";
import { getEvents } from "@/utils/database";
import { Budget, Event } from "@/types/database.types";
import toast from "react-hot-toast";
import { getCurrentUser } from "@/utils/auth";

export default function BudgetManagement() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [budgetItems, setBudgetItems] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    category: "venue",
    estimated_cost: "",
    actual_cost: "",
    notes: "",
  });
  const [errors, setErrors] = useState<ZodIssue[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        setUser(currentUser);

        // Load events for this organizer
        const userEvents = await getEvents({ organizerId: currentUser.id });
        setEvents(userEvents);
      } catch (error) {
        console.error("Error loading events:", error);
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const loadBudgetItems = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      setIsLoading(true);
      const budget = await getEventBudget(eventId);
      setBudgetItems(budget);
    } catch (error) {
      console.error("Error loading budget items:", error);
      toast.error("Failed to load budget items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    if (eventId) {
      loadBudgetItems(eventId);
    } else {
      setBudgetItems([]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (item: Budget) => {
    setEditingItemId(item.id);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      estimated_cost: item.estimated_cost.toString(),
      actual_cost: item.actual_cost?.toString() || "",
      notes: item.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setFormData({
      item_name: "",
      category: "venue",
      estimated_cost: "",
      actual_cost: "",
      notes: "",
    });
    setErrors([]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Convert strings to numbers
      const validationData = {
        event_id: selectedEvent,
        item_name: formData.item_name,
        category: formData.category as Budget["category"],
        estimated_cost: parseFloat(formData.estimated_cost) || 0,
        actual_cost: formData.actual_cost ? parseFloat(formData.actual_cost) : undefined,
        status: "planned" as Budget["status"],
        notes: formData.notes || undefined,
      };

      // Validate form data
      budgetItemSchema.parse(validationData);

      if (editingItemId) {
        // Update existing budget item
        await updateBudgetItem(editingItemId, validationData);
        toast.success("Budget item updated successfully");
      } else {
        // Create new budget item
        await createBudgetItem(validationData);
        toast.success("Budget item added successfully");
      }

      // Reset form and reload budget items
      setFormData({
        item_name: "",
        category: "venue",
        estimated_cost: "",
        actual_cost: "",
        notes: "",
      });
      setEditingItemId(null);
      loadBudgetItems(selectedEvent);
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        toast.error("Failed to save budget item");
        console.error("Budget item error:", error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalEstimated = budgetItems.reduce((sum, item) => sum + item.estimated_cost, 0);
  const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Budget Management</h1>

      {isLoading && events.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Event Selection */}
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              id="event-select"
              value={selectedEvent}
              onChange={handleEventChange}
              className="block w-full md:w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            >
              <option value="">-- Select an event --</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({new Date(event.start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Budget Form */}
              <div className="col-span-1">
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    {editingItemId ? "Edit Budget Item" : "Add Budget Item"}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="item_name" className="block text-sm font-medium text-gray-700">
                        Item Name
                      </label>
                      <input
                        type="text"
                        id="item_name"
                        name="item_name"
                        value={formData.item_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        required
                      />
                      {errors.find((e) => e.path[0] === "item_name") && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.find((e) => e.path[0] === "item_name")?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        required
                      >
                        <option value="venue">Venue</option>
                        <option value="catering">Catering</option>
                        <option value="marketing">Marketing</option>
                        <option value="equipment">Equipment</option>
                        <option value="staff">Staff</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700">
                        Estimated Cost ($)
                      </label>
                      <input
                        type="number"
                        id="estimated_cost"
                        name="estimated_cost"
                        value={formData.estimated_cost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        required
                      />
                      {errors.find((e) => e.path[0] === "estimated_cost") && (
                        <p className="mt-1 text-xs text-red-600">
                          {errors.find((e) => e.path[0] === "estimated_cost")?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="actual_cost" className="block text-sm font-medium text-gray-700">
                        Actual Cost ($) <span className="text-xs text-gray-500">(if known)</span>
                      </label>
                      <input
                        type="number"
                        id="actual_cost"
                        name="actual_cost"
                        value={formData.actual_cost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      {editingItemId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Saving..." : editingItemId ? "Update Item" : "Add Item"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Budget List */}
              <div className="col-span-2">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Budget Items</h2>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : budgetItems.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No budget items found for this event. Add your first budget item.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Item
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Category
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Estimated
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actual
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {budgetItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {item.item_name}
                                {item.notes && (
                                  <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                                    {item.notes}
                                  </p>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                {item.category}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${item.estimated_cost.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.actual_cost !== null && item.actual_cost !== undefined
                                  ? `$${item.actual_cost.toFixed(2)}`
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => handleEditClick(item)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">Total</td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                              ${totalEstimated.toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                              ${totalActual.toFixed(2)}
                            </td>
                            <td className="px-6 py-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {budgetItems.length > 0 && (
                  <div className="mt-6 bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Budget Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Estimated Cost:</span>
                          <span className="font-medium">${totalEstimated.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Total Actual Cost:</span>
                          <span className="font-medium">${totalActual.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium text-gray-800">
                            Difference (Est. vs. Actual):
                          </span>
                          <span
                            className={`font-medium ${
                              totalEstimated >= totalActual
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            ${Math.abs(totalEstimated - totalActual).toFixed(2)}
                            {totalEstimated >= totalActual ? " under budget" : " over budget"}
                          </span>
                        </div>
                      </div>

                      {/* Budget breakdown by category */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Category Breakdown</h3>
                        {Object.entries(
                          budgetItems.reduce((acc: Record<string, number>, item) => {
                            const category = item.category;
                            if (!acc[category]) acc[category] = 0;
                            acc[category] += item.estimated_cost;
                            return acc;
                          }, {})
                        ).map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600 capitalize">{category}:</span>
                            <span className="text-xs font-medium">
                              ${amount.toFixed(2)} ({((amount / totalEstimated) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
