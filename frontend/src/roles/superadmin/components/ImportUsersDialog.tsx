import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertTriangle, Check } from 'lucide-react';
import { CsvUser, parseCsvFile } from '../utils/userExportImport';
import { userApi } from '../../../api/users';
import { SchoolUserRole } from '../types/school';

interface ImportUsersDialogProps {
  schoolId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportUsersDialog({ schoolId, onClose, onSuccess }: ImportUsersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [users, setUsers] = useState<CsvUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const parsedUsers = await parseCsvFile(selectedFile);
      // Validate users
      const invalidUsers = parsedUsers.filter(user => {
        const isValidRole = ['admin', 'teacher', 'student', 'parent'].includes(user.role);
        const hasRequiredFields = user.name && user.email && user.role;
        return !isValidRole || !hasRequiredFields;
      });

      if (invalidUsers.length > 0) {
        setError(`Found ${invalidUsers.length} invalid user entries. Please check the CSV format.`);
        return;
      }

      setUsers(parsedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to parse CSV file');
    }
  };

  const handleImport = async () => {
    if (!users.length) return;

    setIsLoading(true);
    setError(null);
    setImportProgress(0);

    try {
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        await userApi.createUser({
          name: user.name,
          email: user.email,
          role: user.role as SchoolUserRole,
          schoolId,
          subjects: user.subjects?.split(';').filter(Boolean),
          classes: user.classes?.split(';').filter(Boolean),
          class: user.class,
          rollNumber: user.rollNumber
        });
        setImportProgress(((i + 1) / users.length) * 100);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import users');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Users</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
              />
              
              {!file ? (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Drop your CSV file here or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="h-6 w-6 text-gray-400" />
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <button
                    onClick={() => {
                      setFile(null);
                      setUsers([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {users.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">
                      {users.length} users ready to import
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Importing users...</span>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(importProgress)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!users.length || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Importing...' : 'Import Users'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
