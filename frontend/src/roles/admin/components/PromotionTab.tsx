import React from 'react';
import { Users, AlertCircle, ArrowRight } from 'lucide-react';

interface PromotionTabProps {
  promotionMode: 'bulk' | 'manual';
  setPromotionMode: (mode: 'bulk' | 'manual') => void;
  fromYear: string;
  setFromYear: (year: string) => void;
  toYear: string;
  finalYearAction: 'graduate' | 'request' | '';
  setFinalYearAction: (action: 'graduate' | 'request' | '') => void;
  classes: any[];
  selectedPromotionClass: string;
  setSelectedPromotionClass: (className: string) => void;
  selectedPromotionSection: string;
  setSelectedPromotionSection: (section: string) => void;
  holdBackSeqIds: string;
  setHoldBackSeqIds: (ids: string) => void;
  onBulkPromote: () => void;
  onManualPromote: () => void;
  loading: boolean;
}

const PromotionTab: React.FC<PromotionTabProps> = ({
  promotionMode,
  setPromotionMode,
  fromYear,
  setFromYear,
  toYear,
  finalYearAction,
  setFinalYearAction,
  classes,
  selectedPromotionClass,
  setSelectedPromotionClass,
  selectedPromotionSection,
  setSelectedPromotionSection,
  holdBackSeqIds,
  setHoldBackSeqIds,
  onBulkPromote,
  onManualPromote,
  loading
}) => {
  const classOrder = ['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const finalYearClass = classes.length > 0 
    ? classes.reduce((max, cls) => {
        const maxIndex = classOrder.indexOf(max.className);
        const clsIndex = classOrder.indexOf(cls.className);
        return clsIndex > maxIndex ? cls : max;
      }).className
    : '12';

  const selectedClassData = classes.find(c => c.className === selectedPromotionClass);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Student Promotion System</h3>
        <p className="text-sm text-gray-600">Promote students to the next academic year</p>
      </div>

      {/* Academic Year Selector */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Promote From:</label>
            <select
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">Promote To:</label>
            <input
              type="text"
              value={toYear}
              disabled
              className="w-full border border-blue-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Mode Toggle */}
      {promotionMode === 'bulk' ? (
        <div className="space-y-4">
          {/* Bulk Promotion Mode */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Bulk School-Wide Promotion</h4>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Final Year Class Detected: Class {finalYearClass}</p>
                  <p className="text-xs text-yellow-700 mt-1">Please choose how to handle final-year students before proceeding.</p>
                </div>
              </div>
            </div>

            {/* Final Year Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: finalYearAction === 'graduate' ? '#3b82f6' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="finalYearAction"
                  value="graduate"
                  checked={finalYearAction === 'graduate'}
                  onChange={(e) => setFinalYearAction(e.target.value as 'graduate')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Mark 'Class {finalYearClass}' students as Graduated/Alumni</p>
                  <p className="text-sm text-gray-600">Students will be archived and moved to alumni records.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: finalYearAction === 'request' ? '#3b82f6' : '#e5e7eb' }}>
                <input
                  type="radio"
                  name="finalYearAction"
                  value="request"
                  checked={finalYearAction === 'request'}
                  onChange={(e) => setFinalYearAction(e.target.value as 'request')}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900">Request creation of next class (Class {parseInt(finalYearClass) + 1 || 'Next'})</p>
                  <p className="text-sm text-gray-600">A notification will be sent to SuperAdmin. Class {finalYearClass} promotion will be paused.</p>
                </div>
              </label>
            </div>

            {/* Promote Button */}
            <button
              onClick={onBulkPromote}
              disabled={!finalYearAction || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              {loading ? 'Promoting...' : `Promote All Students (from ${fromYear} to ${toYear})`}
            </button>

            {/* Switch to Manual Mode */}
            <button
              onClick={() => setPromotionMode('manual')}
              className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Users className="h-5 w-5" />
              Switch to Manual Mode (Hold Back Students)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Manual Exception Mode */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Manual Exception Mode</h4>
              <button
                onClick={() => setPromotionMode('bulk')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                ← Back to Bulk Promotion
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Select a class and section, then enter the Sequence IDs of students to hold back (comma-separated). All other students will be promoted.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
                <select
                  value={selectedPromotionClass}
                  onChange={(e) => {
                    setSelectedPromotionClass(e.target.value);
                    setSelectedPromotionSection('');
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class...</option>
                  {classes.sort((a, b) => {
                    const aIndex = classOrder.indexOf(a.className);
                    const bIndex = classOrder.indexOf(b.className);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.className.localeCompare(b.className);
                  }).map(cls => (
                    <option key={cls._id} value={cls.className}>
                      Class {cls.className}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                <select
                  value={selectedPromotionSection}
                  onChange={(e) => setSelectedPromotionSection(e.target.value)}
                  disabled={!selectedPromotionClass}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select a section...</option>
                  {selectedClassData?.sections.sort().map((section: string) => (
                    <option key={section} value={section}>
                      Section {section}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Sequence IDs of Students to Hold Back
              </label>
              <textarea
                value={holdBackSeqIds}
                onChange={(e) => setHoldBackSeqIds(e.target.value)}
                placeholder="e.g., SB-S-0001, SB-S-0005, SB-S-0012"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple IDs with commas</p>
            </div>

            <button
              onClick={onManualPromote}
              disabled={!selectedPromotionClass || !selectedPromotionSection || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Promoting...' : `Promote This Section (with exceptions)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionTab;
