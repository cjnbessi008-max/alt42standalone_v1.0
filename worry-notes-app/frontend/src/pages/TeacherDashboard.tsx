/**
 * Teacher Dashboard - View and respond to student concerns
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, AlertCircle } from 'lucide-react';
import { worryNotesApi } from '@/services/api';
import WorryNoteCard from '@/components/WorryNoteCard';
import FilterPanel from '@/components/FilterPanel';
import StatsOverview from '@/components/StatsOverview';

export default function TeacherDashboard() {
  const [filters, setFilters] = useState({
    category: null,
    priority: null,
    status: null,
    is_crisis: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch worry notes with filters
  const { data: notes, isLoading } = useQuery({
    queryKey: ['teacher-notes', filters],
    queryFn: () => worryNotesApi.listNotes(filters),
  });

  // Count urgent concerns
  const urgentCount = notes?.items.filter(
    (note) => note.priority === 'urgent' || note.is_crisis
  ).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Student Concerns Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and respond to student concerns from your courses
        </p>
      </div>

      {/* Stats Overview */}
      <StatsOverview />

      {/* Urgent Alert */}
      {urgentCount > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <div>
            <p className="font-semibold text-red-900">
              {urgentCount} urgent concern{urgentCount > 1 ? 's' : ''} requiring attention
            </p>
            <p className="text-sm text-red-700">
              Please review and respond as soon as possible
            </p>
          </div>
        </div>
      )}

      {/* Filter Button */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={18} />
          <span>Filters</span>
        </button>

        {/* Active Filters Display */}
        {Object.values(filters).some(v => v !== null) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.entries(filters).map(([key, value]) =>
              value && (
                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {key}: {value}
                </span>
              )
            )}
            <button
              onClick={() => setFilters({ category: null, priority: null, status: null, is_crisis: null })}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* List of Concerns */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading concerns...</p>
          </div>
        )}

        {notes && notes.items.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No concerns match your filters</p>
          </div>
        )}

        {notes && notes.items.map((note) => (
          <WorryNoteCard key={note.id} note={note} userRole="teacher" />
        ))}
      </div>
    </div>
  );
}
