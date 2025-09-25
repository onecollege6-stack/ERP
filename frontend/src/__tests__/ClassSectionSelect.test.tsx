import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClassSectionSelect from '../roles/admin/components/ClassSectionSelect';
import { useAuth } from '../auth/AuthContext';

// Mock the API
jest.mock('../services/api', () => ({
  classesAPI: {
    getSchoolClasses: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../auth/AuthContext', () => ({
  useAuth: jest.fn()
}));

const mockClassesAPI = require('../services/api').classesAPI;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ClassSectionSelect', () => {
  const mockOnClassChange = jest.fn();
  const mockOnSectionChange = jest.fn();
  
  const defaultProps = {
    valueClass: 'ALL',
    valueSection: 'ALL',
    onClassChange: mockOnClassChange,
    onSectionChange: mockOnSectionChange
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user123',
        schoolId: 'school123',
        role: 'admin'
      }
    } as any);
  });

  it('renders loading state initially', async () => {
    mockClassesAPI.getSchoolClasses.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<ClassSectionSelect {...defaultProps} />);
    
    expect(screen.getByText('Loading classes...')).toBeInTheDocument();
  });

  it('renders error state when API fails', async () => {
    mockClassesAPI.getSchoolClasses.mockRejectedValue(new Error('API Error'));

    render(<ClassSectionSelect {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load classes and sections')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders no data state when no classes exist', async () => {
    mockClassesAPI.getSchoolClasses.mockResolvedValue({
      data: { success: true, data: [] }
    });

    render(<ClassSectionSelect {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/No classes defined for this school/)).toBeInTheDocument();
    });
  });

  it('renders classes and sections when data is available', async () => {
    const mockClasses = [
      {
        classId: 'class1',
        className: '1',
        sections: [
          { sectionId: 'sec1', sectionName: 'A' },
          { sectionId: 'sec2', sectionName: 'B' }
        ]
      },
      {
        classId: 'class2',
        className: '2',
        sections: [
          { sectionId: 'sec3', sectionName: 'A' }
        ]
      }
    ];

    mockClassesAPI.getSchoolClasses.mockResolvedValue({
      data: { success: true, data: mockClasses }
    });

    render(<ClassSectionSelect {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Class')).toBeInTheDocument();
      expect(screen.getByText('Section')).toBeInTheDocument();
    });
  });

  it('opens class dropdown and calls onClassChange when class is selected', async () => {
    const mockClasses = [
      {
        classId: 'class1',
        className: '1',
        sections: [{ sectionId: 'sec1', sectionName: 'A' }]
      }
    ];

    mockClassesAPI.getSchoolClasses.mockResolvedValue({
      data: { success: true, data: mockClasses }
    });

    render(<ClassSectionSelect {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Class')).toBeInTheDocument();
    });

    // Click class dropdown
    const classButton = screen.getByRole('button', { name: /All Classes/ });
    fireEvent.click(classButton);

    // Click on a class option
    const classOption = screen.getByText('Class 1');
    fireEvent.click(classOption);

    expect(mockOnClassChange).toHaveBeenCalledWith('1');
  });

  it('resets section when class changes', async () => {
    const mockClasses = [
      {
        classId: 'class1',
        className: '1',
        sections: [{ sectionId: 'sec1', sectionName: 'A' }]
      }
    ];

    mockClassesAPI.getSchoolClasses.mockResolvedValue({
      data: { success: true, data: mockClasses }
    });

    render(<ClassSectionSelect {...defaultProps} valueSection="B" />);
    
    await waitFor(() => {
      expect(screen.getByText('Class')).toBeInTheDocument();
    });

    // Click class dropdown and select a class
    const classButton = screen.getByRole('button', { name: /All Classes/ });
    fireEvent.click(classButton);

    const classOption = screen.getByText('Class 1');
    fireEvent.click(classOption);

    expect(mockOnSectionChange).toHaveBeenCalledWith('ALL');
  });

  it('disables section dropdown when "All Classes" is selected', async () => {
    const mockClasses = [
      {
        classId: 'class1',
        className: '1',
        sections: [{ sectionId: 'sec1', sectionName: 'A' }]
      }
    ];

    mockClassesAPI.getSchoolClasses.mockResolvedValue({
      data: { success: true, data: mockClasses }
    });

    render(<ClassSectionSelect {...defaultProps} valueClass="ALL" />);
    
    await waitFor(() => {
      const sectionButton = screen.getByRole('button', { name: /All Sections/ });
      expect(sectionButton).toBeDisabled();
    });
  });

  it('handles retry functionality', async () => {
    mockClassesAPI.getSchoolClasses.mockRejectedValueOnce(new Error('API Error'));
    mockClassesAPI.getSchoolClasses.mockResolvedValueOnce({
      data: { success: true, data: [] }
    });

    render(<ClassSectionSelect {...defaultProps} />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText('Failed to load classes and sections')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should show no data state after successful retry
    await waitFor(() => {
      expect(screen.getByText(/No classes defined for this school/)).toBeInTheDocument();
    });

    expect(mockClassesAPI.getSchoolClasses).toHaveBeenCalledTimes(2);
  });
});
