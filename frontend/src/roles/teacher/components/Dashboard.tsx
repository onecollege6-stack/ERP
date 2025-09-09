import React from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { currentUser, mockStudents, mockAssignments } from '../utils/mockData';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const stats = [
    {
      name: 'Total Students',
      value: mockStudents.length.toString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+5 this month'
    },
    {
      name: 'Classes Today',
      value: "0",
      icon: Calendar,
      color: 'bg-green-500',
      change: 'Next at 10:00 AM'
    },
    {
      name: 'Active Assignments',
      value: mockAssignments.filter(a => a.status === 'active').length.toString(),
      icon: BookOpen,
      color: 'bg-orange-500',
      change: '2 due this week'
    },
    {
      name: 'Messages',
      value: '8',
      icon: MessageSquare,
      color: 'bg-purple-500',
      change: '3 unread'
    }
  ];

  const quickActions = [
    {
      title: 'Mark Attendance',
      description: 'Take attendance for your classes',
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
      action: () => onNavigate('mark-attendance')
    },
    {
      title: 'Mark Attendance',
      description: 'Record student attendance',
      icon: UserCheck,
      color: 'bg-blue-500',
      action: () => onNavigate('mark-attendance')
    },
    {
      title: 'Add Assignment',
      description: 'Upload new assignments for students',
      icon: BookOpen,
      color: 'bg-orange-100 text-orange-700',
      action: () => onNavigate('add-assignments')
    },
    {
      title: 'Send Message',
      description: 'Communicate with students and parents',
      icon: MessageSquare,
      color: 'bg-purple-100 text-purple-700',
      action: () => onNavigate('messages')
    }
  ];

  const upcomingClasses = [
    {
      time: '10:00 AM',
      subject: 'Mathematics',
      class: '10A',
      room: 'Room 101'
    },
    {
      time: '11:30 AM',
      subject: 'Physics',
      class: '11A',
      room: 'Lab 201'
    },
    {
      time: '2:00 PM',
      subject: 'Mathematics',
      class: '10B',
      room: 'Room 102'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="text-blue-100 mb-4 sm:mb-0">
              You have 3 classes scheduled for today. Ready to make an impact?
            </p>
          </div>
          <div className="flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2">
            <Clock className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-105 text-left group"
                >
                  <div className={`inline-flex p-3 rounded-lg ${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {upcomingClasses.map((classItem, index) => (
              <div
                key={index}
                className={`p-4 ${index !== upcomingClasses.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600">{classItem.time}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {classItem.room}
                  </span>
                </div>
                <h4 className="font-medium text-gray-900">{classItem.subject}</h4>
                <p className="text-sm text-gray-600">Class {classItem.class}</p>
              </div>
            ))}
            
            {upcomingClasses.length === 0 && (
              <div className="p-8 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No classes scheduled for today</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;