// Sample React component for Academic Test Configuration in superadmin panel
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AcademicTestConfiguration = ({ schoolId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [academicSettings, setAcademicSettings] = useState({
    schoolTypes: [],
    classes: []
  });
  const [testDetails, setTestDetails] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [newTestType, setNewTestType] = useState({
    name: '',
    code: '',
    description: '',
    maxMarks: 100,
    weightage: 1,
    isActive: true
  });

  // Fetch academic settings and test details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get token from local storage
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        // Fetch school academic settings
        const settingsResponse = await axios.get(
          `/api/superadmin/academic/schools/${schoolId}/academic/settings`,
          config
        );
        
        // Fetch test details
        const testDetailsResponse = await axios.get(
          `/api/superadmin/academic/schools/${schoolId}/academic/tests`,
          config
        );
        
        setAcademicSettings({
          schoolTypes: settingsResponse.data.data.academicSettings?.schoolTypes || [],
          classes: settingsResponse.data.data.classes || []
        });
        
        setTestDetails(testDetailsResponse.data.data.classTestTypes || {});
        
        // Set the first class as selected if available
        if (settingsResponse.data.data.classes?.length > 0) {
          setSelectedClass(settingsResponse.data.data.classes[0]);
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [schoolId]);

  // Handle adding a new test type
  const handleAddTestType = async (e) => {
    e.preventDefault();
    
    if (!newTestType.name || !newTestType.code) {
      setError('Test name and code are required');
      return;
    }
    
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Add the test type
      const response = await axios.post(
        `/api/superadmin/academic/schools/${schoolId}/academic/tests/class/${selectedClass}`,
        { testType: newTestType },
        config
      );
      
      // Update the test details in state
      const updatedTestDetails = { ...testDetails };
      updatedTestDetails[selectedClass] = response.data.data.testTypes;
      
      setTestDetails(updatedTestDetails);
      
      // Reset the form
      setNewTestType({
        name: '',
        code: '',
        description: '',
        maxMarks: 100,
        weightage: 1,
        isActive: true
      });
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding test type');
    }
  };

  // Handle removing a test type
  const handleRemoveTestType = async (testTypeCode) => {
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Remove the test type
      const response = await axios.delete(
        `/api/superadmin/academic/schools/${schoolId}/academic/tests/class/${selectedClass}/test/${testTypeCode}`,
        config
      );
      
      // Update the test details in state
      const updatedTestDetails = { ...testDetails };
      updatedTestDetails[selectedClass] = response.data.data.testTypes;
      
      setTestDetails(updatedTestDetails);
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error removing test type');
    }
  };

  // Handle updating academic settings
  const handleUpdateAcademicSettings = async (e) => {
    e.preventDefault();
    
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Update academic settings
      const response = await axios.put(
        `/api/superadmin/academic/schools/${schoolId}/academic/settings`,
        {
          schoolTypes: academicSettings.schoolTypes,
          classes: academicSettings.classes
        },
        config
      );
      
      setAcademicSettings({
        schoolTypes: response.data.data.academicSettings?.schoolTypes || [],
        classes: response.data.data.classes || []
      });
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating academic settings');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="academic-config-container">
      <h2>Academic Test Configuration</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="academic-settings-section">
        <h3>School Academic Settings</h3>
        
        <form onSubmit={handleUpdateAcademicSettings}>
          <div className="form-group">
            <label>School Types</label>
            <div className="school-types-container">
              {['Kindergarten', 'Primary', 'Middle', 'Secondary', 'Higher Secondary', 'K-12'].map(type => (
                <div key={type} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`type-${type}`}
                    checked={academicSettings.schoolTypes.includes(type)}
                    onChange={(e) => {
                      const updatedTypes = e.target.checked
                        ? [...academicSettings.schoolTypes, type]
                        : academicSettings.schoolTypes.filter(t => t !== type);
                      setAcademicSettings({
                        ...academicSettings,
                        schoolTypes: updatedTypes
                      });
                    }}
                  />
                  <label htmlFor={`type-${type}`}>{type}</label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label>Classes</label>
            <div className="classes-container">
              {['LKG', 'UKG', ...Array.from({length: 12}, (_, i) => (i+1).toString())].map(cls => (
                <div key={cls} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`class-${cls}`}
                    checked={academicSettings.classes.includes(cls)}
                    onChange={(e) => {
                      const updatedClasses = e.target.checked
                        ? [...academicSettings.classes, cls]
                        : academicSettings.classes.filter(c => c !== cls);
                      setAcademicSettings({
                        ...academicSettings,
                        classes: updatedClasses
                      });
                    }}
                  />
                  <label htmlFor={`class-${cls}`}>{cls}</label>
                </div>
              ))}
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary">
            Update Academic Settings
          </button>
        </form>
      </div>
      
      <div className="test-types-section">
        <h3>Test Types Configuration</h3>
        
        <div className="class-selector">
          <label>Select Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select a class</option>
            {academicSettings.classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        
        {selectedClass && (
          <>
            <h4>Test Types for Class {selectedClass}</h4>
            
            <div className="test-types-list">
              {testDetails[selectedClass]?.length > 0 ? (
                <table className="test-types-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Description</th>
                      <th>Max Marks</th>
                      <th>Weightage</th>
                      <th>Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testDetails[selectedClass].map(test => (
                      <tr key={test.code}>
                        <td>{test.name}</td>
                        <td>{test.code}</td>
                        <td>{test.description}</td>
                        <td>{test.maxMarks}</td>
                        <td>{test.weightage}</td>
                        <td>{test.isActive ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveTestType(test.code)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No test types configured for this class</p>
              )}
            </div>
            
            <div className="add-test-type-form">
              <h4>Add New Test Type</h4>
              
              <form onSubmit={handleAddTestType}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Test Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTestType.name}
                      onChange={(e) => setNewTestType({
                        ...newTestType,
                        name: e.target.value
                      })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Test Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTestType.code}
                      onChange={(e) => setNewTestType({
                        ...newTestType,
                        code: e.target.value.toUpperCase()
                      })}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTestType.description}
                    onChange={(e) => setNewTestType({
                      ...newTestType,
                      description: e.target.value
                    })}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Max Marks</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newTestType.maxMarks}
                      onChange={(e) => setNewTestType({
                        ...newTestType,
                        maxMarks: parseInt(e.target.value)
                      })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Weightage</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      value={newTestType.weightage}
                      onChange={(e) => setNewTestType({
                        ...newTestType,
                        weightage: parseFloat(e.target.value)
                      })}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Active</label>
                    <select
                      className="form-control"
                      value={newTestType.isActive.toString()}
                      onChange={(e) => setNewTestType({
                        ...newTestType,
                        isActive: e.target.value === 'true'
                      })}
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" className="btn btn-success">
                  Add Test Type
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicTestConfiguration;
