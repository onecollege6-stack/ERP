import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { AddSchoolForm } from './components/AddSchoolForm';
import { ViewAccess } from './components/ViewAccess';
import { AccountDetails } from './components/AccountDetails';
import SchoolDetails from './components/SchoolDetails';
import SchoolEditDetails from './components/SchoolEditDetails';
import AcademicTestConfiguration from './components/AcademicTestConfiguration';
import { SchoolLogin } from '../../pages/SchoolLogin';

function AppContent() {
  const { currentView, setCurrentView } = useApp();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'add-school':
        return <AddSchoolForm />;
      case 'view-access':
        return <ViewAccess />;
      case 'account-details':
        return <AccountDetails />;
      case 'school-details':
        return <SchoolDetails />;
      case 'edit-school':
        return <SchoolEditDetails />;
      case 'academic-test-config':
        return <AcademicTestConfiguration />;
      case 'school-login':
        return (
          <SchoolLogin 
            onLoginSuccess={(userInfo) => {
              alert(`Login successful!\nWelcome ${userInfo.name}\nRole: ${userInfo.role}\nSchool: ${userInfo.schoolName}`);
              setCurrentView('dashboard');
            }}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {currentView !== 'school-login' && <Navigation />}
      <main className={`flex-1 overflow-y-auto ${currentView === 'school-login' ? 'w-full' : ''}`}>
        {renderCurrentView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;