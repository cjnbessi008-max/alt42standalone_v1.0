/**
 * Student Dashboard - View and submit worry notes
 */
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { worryNotesApi } from '@/services/api';
import WorryNoteForm from '@/components/WorryNoteForm';
import WorryNoteCard from '@/components/WorryNoteCard';

export default function StudentDashboard() {
  const [showForm, setShowForm] = useState(false);

  // Fetch student's worry notes
  const { data: notes, isLoading } = useQuery({
    queryKey: ['my-concerns'],
    queryFn: () => worryNotesApi.getMyNotes(),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Concerns
        </h1>
        <p className="text-gray-600">
          Share your concerns and get support from your teachers
        </p>
      </div>

      {/* New Concern Button */}
      <button
        onClick={() => setShowForm(true)}
        className="mb-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={20} />
        <span>New Concern</span>
      </button>

      {/* Worry Note Form Modal */}
      {showForm && (
        <WorryNoteForm onClose={() => setShowForm(false)} />
      )}

      {/* List of Concerns */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your concerns...</p>
          </div>
        )}

        {notes && notes.items.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">You haven't shared any concerns yet</p>
            <p className="text-sm text-gray-500">
              Click the "New Concern" button above to get started
            </p>
          </div>
        )}

        {notes && notes.items.map((note) => (
          <WorryNoteCard key={note.id} note={note} userRole="student" />
        ))}
      </div>
    </div>
  );
}
