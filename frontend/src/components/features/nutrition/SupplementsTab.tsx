import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import DateNavigation from './DateNavigation';
import { AddSupplementForm } from './AddSupplementForm';
import { SupplementWithLog, Supplement } from '../../../types/supplements';
import {
  getDailySupplements,
  getSupplements,
  logSupplement,
  unlogSupplement,
  deleteSupplement,
} from '../../../services/supplements.service';

export const SupplementsTab: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [supplements, setSupplements] = useState<SupplementWithLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [manageMode, setManageMode] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSupplements = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const data = await getDailySupplements(dateStr);
      setSupplements(data);
    } catch (error) {
      console.error('Failed to fetch supplements:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSupplements();
  }, [fetchSupplements]);

  const handleToggle = async (supp: SupplementWithLog) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    // Optimistic update
    setSupplements(prev =>
      prev.map(s => s.id === supp.id ? { ...s, taken_today: !s.taken_today } : s)
    );

    try {
      if (supp.taken_today) {
        await unlogSupplement(supp.id, dateStr);
      } else {
        await logSupplement({ supplement_id: supp.id, log_date: dateStr });
      }
    } catch {
      // Revert on error
      fetchSupplements();
    }
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingSupplement(null);
    fetchSupplements();
  };

  const handleEdit = async (supp: SupplementWithLog) => {
    // Fetch full supplement data for editing
    try {
      const allSupps = await getSupplements();
      const fullSupp = allSupps.find(s => s.id === supp.id);
      if (fullSupp) {
        setEditingSupplement(fullSupp);
        setShowAddForm(true);
      }
    } catch {
      alert('Failed to load supplement details');
    }
  };

  const handleDelete = async (supp: SupplementWithLog) => {
    if (!confirm(`Delete "${supp.name}"? This will also remove all log history for this supplement.`)) {
      return;
    }

    setDeletingId(supp.id);
    try {
      await deleteSupplement(supp.id);
      fetchSupplements();
    } catch {
      alert('Failed to delete supplement');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {loading ? (
          <div className="card text-center py-8">
            <div className="text-gray-400">Loading supplements...</div>
          </div>
        ) : supplements.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-3">💊</div>
            <p className="text-gray-400 mb-4">No supplements added yet.</p>
            <p className="text-sm text-gray-500 mb-4">
              Track your daily supplements so your AI coach can identify nutritional gaps.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              + Add Your First Supplement
            </button>
          </div>
        ) : (
          <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'MMM d') === format(new Date(), 'MMM d')
                  ? "Today's Supplements"
                  : `Supplements for ${format(selectedDate, 'MMM d')}`
                }
              </h3>
              <button
                onClick={() => setManageMode(!manageMode)}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                  manageMode
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {manageMode ? 'Done' : '⚙ Manage'}
              </button>
            </div>

            {/* Supplement list */}
            <div className="divide-y divide-gray-700">
              {supplements.map((supp) => (
                <div
                  key={supp.id}
                  className="flex items-center gap-3 py-3"
                >
                  {/* Checkbox */}
                  {!manageMode && (
                    <button
                      onClick={() => handleToggle(supp)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                        supp.taken_today
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {supp.taken_today && (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Supplement info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${supp.taken_today && !manageMode ? 'text-gray-400 line-through' : 'text-gray-200'}`}>
                      {supp.name}
                    </div>
                    {(supp.dosage || supp.brand) && (
                      <div className="text-sm text-gray-400 truncate">
                        {supp.dosage && <span>{supp.dosage}</span>}
                        {supp.dosage && supp.brand && <span> · </span>}
                        {supp.brand && <span>{supp.brand}</span>}
                      </div>
                    )}
                  </div>

                  {/* Manage mode actions */}
                  {manageMode && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(supp)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(supp)}
                        disabled={deletingId === supp.id}
                        className="p-1.5 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                setEditingSupplement(null);
                setShowAddForm(true);
              }}
              className="w-full mt-4 py-2 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
            >
              + Add Supplement
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <AddSupplementForm
          onClose={() => {
            setShowAddForm(false);
            setEditingSupplement(null);
          }}
          onSuccess={handleFormSuccess}
          editingSupplement={editingSupplement}
        />
      )}
    </>
  );
};
