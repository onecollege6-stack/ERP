import React, { useState } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { School } from '../types';

export function AddSchoolForm() {
  const { setCurrentView, addSchool } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    logo: 'https://images.pexels.com/photos/289740/pexels-photo-289740.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
    area: '',
    district: '',
    pinCode: '',
    mobile: '',
    principalName: '',
    principalEmail: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    accountHolderName: '',
    schoolType: '',
    establishedYear: '',
    affiliationBoard: '',
    website: '',
    secondaryContact: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    try {
      await addSchool({
        name: formData.name,
        code: formData.code,
        mobile: formData.mobile,
        principalName: formData.principalName,
        principalEmail: formData.principalEmail,
        area: formData.area,
        district: formData.district,
        pinCode: formData.pinCode,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branch: formData.branch,
          accountHolderName: formData.accountHolderName
        } as any,
        accessMatrix: {
          admin: { manageUsers: true, manageSchoolSettings: true, viewAttendance: true, viewResults: true, messageStudentsParents: true },
          teacher: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: true },
          student: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: false },
          parent: { manageUsers: false, manageSchoolSettings: false, viewAttendance: true, viewResults: true, messageStudentsParents: false }
        } as any,
        schoolType: formData.schoolType,
        establishedYear: formData.establishedYear,
        affiliationBoard: formData.affiliationBoard,
        website: formData.website,
        secondaryContact: formData.secondaryContact,
        ...(logoFile ? { logoFile } : {})
      });
      setSuccess('School created successfully!');
      setTimeout(() => {
        setCurrentView('dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to create school');
    }
  };

  const handleClear = () => {
    setFormData({
      name: '',
      code: '',
      logo: 'https://images.pexels.com/photos/289740/pexels-photo-289740.jpeg?auto=compress&cs=tinysrgb&w=100&h=100',
      area: '',
      district: '',
      pinCode: '',
      mobile: '',
      principalName: '',
      principalEmail: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branch: '',
      accountHolderName: '',
      schoolType: '',
      establishedYear: '',
      affiliationBoard: '',
      website: '',
      secondaryContact: ''
    });
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New School</h1>
        </div>

        {success && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">{success}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* School Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">School Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter school code (e.g., NPS, DAV, KVS)"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">This code will be used for admin and teacher panel identification</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo</label>
                <div className="flex items-center space-x-3">
                  <img src={formData.logo} alt="School logo" className="w-12 h-12 rounded-lg object-cover border border-gray-300" />
                  <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        setLogoFile(file);
                        const url = URL.createObjectURL(file);
                        setFormData({ ...formData, logo: url });
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                <input
                  type="text"
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({...formData, district: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter district"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pin Code</label>
                <input
                  type="text"
                  required
                  value={formData.pinCode}
                  onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter pin code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Principal Name</label>
                <input
                  type="text"
                  required
                  value={formData.principalName}
                  onChange={(e) => setFormData({...formData, principalName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter principal name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Principal Email ID</label>
                <input
                  type="email"
                  required
                  value={formData.principalEmail}
                  onChange={(e) => setFormData({...formData, principalEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter principal email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Type</label>
                <select
                  required
                  value={formData.schoolType}
                  onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select School Type</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                  <option value="International">International</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Established Year</label>
                <input
                  type="number"
                  required
                  value={formData.establishedYear}
                  onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter established year"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Affiliation Board</label>
                <select
                  required
                  value={formData.affiliationBoard}
                  onChange={(e) => setFormData({ ...formData, affiliationBoard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Affiliation Board</option>
                  <option value="CBSE">CBSE</option>
                  <option value="ICSE">ICSE</option>
                  <option value="State Board">State Board</option>
                  <option value="IB">IB</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter website URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Contact Number</label>
                <input
                  type="tel"
                  value={formData.secondaryContact}
                  onChange={(e) => setFormData({ ...formData, secondaryContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter secondary contact number"
                />
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Bank Account Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter IFSC code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <input
                  type="text"
                  required
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter branch name"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({...formData, accountHolderName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter account holder name"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}