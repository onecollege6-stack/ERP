import React from 'react';

const AcademicDetailsTest: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Academic Details - Test Page</h1>
      <p className="text-gray-600 mt-2">This is the Academic Details page. If you can see this, the routing is working correctly.</p>
      
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-700">✅ Academic Details route is working!</p>
      </div>
    </div>
  );
};

export default AcademicDetailsTest;
