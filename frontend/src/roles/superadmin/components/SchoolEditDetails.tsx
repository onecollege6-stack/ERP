// NOTE: This file contained duplicate implementations. Keeping the full editor implementation below.

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, X, MapPin, Phone, Settings as SettingsIcon, Building } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../../../api/axios';

const SchoolEditDetails: React.FC = () => {
  const { selectedSchoolId, setCurrentView, updateSchool } = useApp();
  const [profile, setProfile] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!selectedSchoolId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/schools/${selectedSchoolId}`);
        setProfile(res.data);
        setForm(res.data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedSchoolId]);

  const update = (path: string, value: any) => {
    setForm((prev: any) => {
      const obj = { ...(prev || {}) } as any;
      const keys = path.split('.');
      let cur = obj as any;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
        cur = cur[k];
      }
      cur[keys[keys.length - 1]] = value;
      return obj;
    });
  };

  const handleSave = async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/schools/${selectedSchoolId}`, form);
      const updated = (res.data as any)?.school || res.data;
      setProfile(updated);
      await updateSchool({
        id: updated._id || updated.id || selectedSchoolId,
        name: updated.name,
        logo: updated.logoUrl ? (String(updated.logoUrl).startsWith('http') ? updated.logoUrl : `${import.meta.env.VITE_API_BASE_URL || ''}${updated.logoUrl}`) : '',
        area: updated.address?.street || '',
        district: updated.address?.city || '',
        pinCode: updated.address?.zipCode || '',
        mobile: updated.contact?.phone || '',
        principalName: updated.principalName || '',
        principalEmail: updated.principalEmail || updated.contact?.email || '',
        bankDetails: updated.bankDetails || {},
        accessMatrix: updated.accessMatrix || {},
      } as any);
      alert('School updated');
      setCurrentView('school-details');
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => setCurrentView('school-details')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Details</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
        </div>
        <div className="py-10 text-center text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => setCurrentView('school-details')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Details</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit School</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4">No data</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentView('school-details')} className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Details</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit: {profile.name}</h1>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setCurrentView('school-details')} className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded p-4">{error}</div>}

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Building className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.name || ''} onChange={(e) => update('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
              <input className="w-full px-3 py-2 border rounded-lg font-mono" value={form?.code || ''} onChange={(e) => update('code', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal Name</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.principalName || ''} onChange={(e) => update('principalName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Principal Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-lg" value={form?.principalEmail || form?.contact?.email || ''} onChange={(e) => update('principalEmail', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <MapPin className="h-6 w-6 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.address?.street || ''} onChange={(e) => update('address.street', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.address?.city || ''} onChange={(e) => update('address.city', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.address?.state || ''} onChange={(e) => update('address.state', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.address?.zipCode || ''} onChange={(e) => update('address.zipCode', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Phone className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form?.contact?.phone || ''} onChange={(e) => update('contact.phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" className="w-full px-3 py-2 border rounded-lg" value={form?.contact?.email || ''} onChange={(e) => update('contact.email', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="h-6 w-6 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
              <select className="w-full px-3 py-2 border rounded-lg" value={form?.isActive ? 'true' : 'false'} onChange={(e) => update('isActive', e.target.value === 'true')}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Established</label>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form?.establishedDate ? String(form.establishedDate).substring(0,10) : ''} onChange={(e) => update('establishedDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
              <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolEditDetails;
