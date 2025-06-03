"use client";

import { useEffect, useState } from "react";
import { getEvents, getEventReports, getReportTemplates, generateReport } from "@/utils/database.updated";
import { getCurrentUser } from "@/utils/auth";
import { Event, ReportTemplate, GeneratedReport } from "@/types/database.types.updated";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { generatedReportSchema, ZodIssue } from "@/utils/validations";

export default function ReportsPage() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    template_id: "",
    report_name: "",
    format: "pdf" as "pdf" | "csv" | "excel" | "json",
  });
  const [errors, setErrors] = useState<ZodIssue[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        if (!currentUser) return;
        setUser(currentUser);

        // Load events
        const userEvents = await getEvents();
        setEvents(userEvents);

        // Load report templates
        const reportTemplates = await getReportTemplates();
        setTemplates(reportTemplates);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const loadReports = async (eventId: string) => {
    if (!eventId) return;
    
    try {
      setIsLoading(true);
      const eventReports = await getEventReports(eventId);
      setReports(eventReports);
    } catch (error) {
      console.error("Error loading reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    if (eventId) {
      loadReports(eventId);
    } else {
      setReports([]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    setIsGenerating(true);
    setErrors([]);

    try {
      // Validate form data
      const validationData = {
        event_id: selectedEvent,
        template_id: formData.template_id || undefined,
        report_name: formData.report_name,
        report_data: {}, // Will be populated by the backend
        format: formData.format,
        created_by: user.id,
      };

      // Validate form data
      generatedReportSchema.parse(validationData);

      // Generate report
      const newReport = await generateReport(validationData);
      
      if (newReport) {
        toast.success("Report generated successfully!");
        // Reload reports
        loadReports(selectedEvent);
        // Reset form
        setFormData({
          template_id: "",
          report_name: "",
          format: "pdf",
        });
      }
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        toast.error("Failed to generate report");
        console.error("Report generation error:", error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTypeIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return "📄";
      case 'csv':
        return "📊";
      case 'excel':
        return "📑";
      case 'json':
        return "📋";
      default:
        return "📄";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Event Reports</h1>

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
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Generated Reports List */}
              <div className="col-span-2">
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center min-h-[100px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                      <p className="text-gray-500">No reports found for this event.</p>
                      <p className="text-sm text-gray-400 mt-1">Use the form on the right to generate a new report.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Report Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {reports.map((report) => (
                            <tr key={report.id}>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{report.report_name}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                <span className="mr-2">{getReportTypeIcon(report.format)}</span>
                                <span className="uppercase">{report.format}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{formatDate(report.created_at)}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {report.file_url ? (
                                  <a 
                                    href={report.file_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-indigo-600 hover:text-indigo-800"
                                  >
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-gray-400">Generating...</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Report Form */}
              <div className="col-span-1">
                <div className="bg-white shadow-md rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Generate Report</h2>
                  <form onSubmit={handleGenerateReport} className="space-y-4">
                    <div>
                      <label htmlFor="report_name" className="block text-sm font-medium text-gray-700">
                        Report Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="report_name"
                          name="report_name"
                          value={formData.report_name}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        />
                        {errors.find((e) => e.path[0] === "report_name") && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.find((e) => e.path[0] === "report_name")?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="template_id" className="block text-sm font-medium text-gray-700">
                        Report Template (Optional)
                      </label>
                      <div className="mt-1">
                        <select
                          id="template_id"
                          name="template_id"
                          value={formData.template_id}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                          <option value="">No template</option>
                          {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                                        <div>
                      <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                        Format
                      </label>
                      <div className="mt-1">
                        <select
                          id="format"
                          name="format"
                          value={formData.format}
                          onChange={handleInputChange}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                        >
                          <option value="pdf">PDF</option>
                          <option value="csv">CSV</option>
                          <option value="excel">Excel</option>
                          <option value="json">JSON</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className={`w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isGenerating ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      >
                        {isGenerating ? (
                          <svg
                            className="animate-spin h-5 w-5 mr-2 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                        ) : null}
                        {isGenerating ? "Generating..." : "Generate Report"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

