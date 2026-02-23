import React, { useState, useEffect } from 'react';
import { Supplement } from '../../../types/supplements';
import { createSupplement, updateSupplement } from '../../../services/supplements.service';

interface AddSupplementFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingSupplement?: Supplement | null;
}

export const AddSupplementForm: React.FC<AddSupplementFormProps> = ({
  onClose,
  onSuccess,
  editingSupplement,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [brand, setBrand] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!editingSupplement;

  useEffect(() => {
    if (editingSupplement) {
      setName(editingSupplement.name);
      setDosage(editingSupplement.dosage || '');
      setBrand(editingSupplement.brand || '');
      setNotes(editingSupplement.notes || '');
    }
  }, [editingSupplement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (isEditing && editingSupplement) {
        await updateSupplement(editingSupplement.id, {
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          brand: brand.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createSupplement({
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          brand: brand.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to save supplement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
      <div className="bg-gray-900 rounded-t-2xl w-full max-w-lg p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Supplement' : 'Add Supplement'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vitamin D3, Creatine, Fish Oil"
              className="input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dosage</label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g., 5000 IU, 5g, 1000mg"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brand</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g., NOW Foods, Optimum Nutrition"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about timing, stacking, etc."
              className="input w-full"
              rows={2}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
