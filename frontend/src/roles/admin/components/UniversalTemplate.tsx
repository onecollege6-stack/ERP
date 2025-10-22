import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Settings, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../auth/AuthContext';
import api, { schoolAPI } from '../../../services/api';

interface TemplateSettings {
  schoolName: string;
  schoolCode: string;
  website: string;
  logoUrl: string;
  headerColor: string;
  accentColor: string;
  address: string;
  phone: string;
  email: string;
}

interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'table';
  placeholder: string;
  required: boolean;
}

const UniversalTemplate: React.FC = () => {
  const { user } = useAuth();

  const [templateSettings, setTemplateSettings] = useState<TemplateSettings>({
    schoolName: user?.schoolName || 'School Name',
    schoolCode: user?.schoolCode || 'SCH001',
    website: 'www.edulogix.com',
    logoUrl: '',
    headerColor: '#1f2937',
    accentColor: '#3b82f6',
    address: '123 School Street, City, State 12345',
    phone: '+91-XXXXXXXXXX',
    email: 'info@school.com'
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [templateType, setTemplateType] = useState<'invoice' | 'admit_card' | 'certificate' | 'custom'>('invoice');
  const [loading, setLoading] = useState(false);

  // Fetch school data from database
  const fetchSchoolData = async () => {
    console.log('User data available:', {
      schoolCode: user?.schoolCode,
      schoolId: user?.schoolId,
      schoolName: user?.schoolName
    });

    if (!user?.schoolCode && !user?.schoolId) return;

    try {
      setLoading(true);

      let schoolData = null;

      // Try to fetch school info using the proper school API
      try {
        console.log('Fetching school info using school API...');
        console.log('User context:', { schoolId: user?.schoolId, schoolCode: user?.schoolCode });
        let response;

        // Use the new reliable school info endpoint that only uses main database
        const schoolIdentifier = user?.schoolId || user?.schoolCode;
        if (schoolIdentifier) {
          console.log('Trying with school info endpoint:', schoolIdentifier);
          try {
            // Use the new /info endpoint that bypasses school-specific database issues
            response = await api.get(`/schools/${schoolIdentifier}/info`);
            console.log('Success with school info endpoint:', response?.data);
          } catch (infoError: any) {
            console.log('School info endpoint failed:', infoError.response?.status, 'Trying original endpoint...');
            // Fallback to original endpoint if new one fails
            response = await schoolAPI.getSchoolById(schoolIdentifier);
            console.log('Success with original endpoint:', response?.data);
          }
        }

        // Handle both wrapped and direct response formats
        const data = response?.data?.data || response?.data;
        if (data && (data.name || data.schoolName)) {
          console.log('School data found:', data);

          // Format address from nested structure (concise version)
          let formattedAddress = '123 School Street, City, State 12345';
          if (data.address) {
            const addr = data.address;
            // Create a more concise address format
            const addressParts = [
              addr.area || addr.street?.substring(0, 30), // Limit street to 30 chars or use area
              addr.city,
              addr.state,
              addr.pinCode || addr.zipCode
            ].filter(Boolean);
            
            // Join with commas and limit total length
            formattedAddress = addressParts.join(', ');
            if (formattedAddress.length > 60) {
              formattedAddress = formattedAddress.substring(0, 57) + '...';
            }
          }

          // Format website URL to be more concise
          let formattedWebsite = data.contact?.website || data.website || 'www.edulogix.com';
          if (formattedWebsite.length > 25) {
            // Remove protocol and www if present, then truncate
            formattedWebsite = formattedWebsite
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '');
            if (formattedWebsite.length > 25) {
              formattedWebsite = formattedWebsite.substring(0, 22) + '...';
            }
          }

          schoolData = {
            schoolName: data.name || data.schoolName || user?.schoolName,
            schoolCode: data.code || data.schoolCode || user?.schoolCode,
            address: formattedAddress,
            phone: data.contact?.phone || data.phone || data.contactNumber || '+91-XXXXXXXXXX',
            email: data.contact?.email || data.email || data.contactEmail || data.principalEmail || 'info@school.com',
            website: formattedWebsite,
            logoUrl: data.logoUrl || data.logo || ''
          };
        }
      } catch (error: any) {
        console.log('Failed to fetch from school API:', error.response?.status || error.message);

        // Try alternative school endpoints as fallback
        try {
          console.log('Trying alternative school endpoints...');
          let fallbackResponse;
          
          // Try different possible school endpoints
          const possibleEndpoints = [
            `/admin/schools/${user.schoolCode}`,
            `/schools/${user.schoolCode}`,
            `/api/schools/${user.schoolCode}`,
            `/school/${user.schoolCode}`,
            `/admin/school/${user.schoolCode}`
          ];
          
          for (const endpoint of possibleEndpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              fallbackResponse = await api.get(endpoint);
              if (fallbackResponse?.data?.success || fallbackResponse?.data) {
                console.log(`Success with endpoint: ${endpoint}`, fallbackResponse.data);
                break;
              }
            } catch (endpointError: any) {
              console.log(`Failed endpoint ${endpoint}:`, endpointError.response?.status);
              continue;
            }
          }

          if (fallbackResponse?.data) {
            const data = fallbackResponse.data.data || fallbackResponse.data;
            console.log('School data found from alternative endpoint:', data);

            // Format address from nested structure (concise version)
            let formattedAddress = '123 School Street, City, State 12345';
            if (data.address && typeof data.address === 'object') {
              const addr = data.address;
              const addressParts = [
                addr.area || addr.street?.substring(0, 30),
                addr.city,
                addr.state,
                addr.pinCode || addr.zipCode
              ].filter(Boolean);
              
              formattedAddress = addressParts.join(', ');
              if (formattedAddress.length > 60) {
                formattedAddress = formattedAddress.substring(0, 57) + '...';
              }
            } else if (typeof data.address === 'string') {
              formattedAddress = data.address.length > 60 ? data.address.substring(0, 57) + '...' : data.address;
            }

            // Format website URL to be more concise
            let formattedWebsite = data.contact?.website || data.website || 'www.edulogix.com';
            if (formattedWebsite.length > 25) {
              formattedWebsite = formattedWebsite
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '');
              if (formattedWebsite.length > 25) {
                formattedWebsite = formattedWebsite.substring(0, 22) + '...';
              }
            }

            schoolData = {
              schoolName: data.name || data.schoolName || user?.schoolName,
              schoolCode: data.code || data.schoolCode || user?.schoolCode,
              address: formattedAddress,
              phone: data.contact?.phone || data.phone || data.contactNumber || '+91-XXXXXXXXXX',
              email: data.contact?.email || data.email || data.contactEmail || data.principalEmail || 'info@school.com',
              website: formattedWebsite,
              logoUrl: data.logoUrl || data.logo || ''
            };
          }
        } catch (fallbackError: any) {
          console.log('Alternative endpoints also failed:', fallbackError.response?.status || fallbackError.message);

          // Try one more fallback - get all schools and find by code
          if (user?.schoolCode && !schoolData) {
            try {
              console.log('Trying getAllSchools as final fallback...');
              const allSchoolsResponse = await schoolAPI.getAllSchools();
              if (allSchoolsResponse?.data?.success && allSchoolsResponse.data?.data) {
                const schools = allSchoolsResponse.data.data;
                const school = schools.find((s: any) =>
                  s.schoolCode === user.schoolCode ||
                  s.code === user.schoolCode ||
                  s.name?.toLowerCase().includes(user.schoolName?.toLowerCase() || '')
                );
                if (school) {
                  console.log('School found in getAllSchools:', school);
                  
                  // Format address from nested structure (concise version)
                  let formattedAddress = '123 School Street, City, State 12345';
                  if (school.address && typeof school.address === 'object') {
                    const addr = school.address;
                    const addressParts = [
                      addr.area || addr.street?.substring(0, 30),
                      addr.city,
                      addr.state,
                      addr.pinCode || addr.zipCode
                    ].filter(Boolean);
                    
                    formattedAddress = addressParts.join(', ');
                    if (formattedAddress.length > 60) {
                      formattedAddress = formattedAddress.substring(0, 57) + '...';
                    }
                  } else if (typeof school.address === 'string') {
                    formattedAddress = school.address.length > 60 ? school.address.substring(0, 57) + '...' : school.address;
                  } else if (school.location?.address) {
                    const locAddr = school.location.address;
                    formattedAddress = locAddr.length > 60 ? locAddr.substring(0, 57) + '...' : locAddr;
                  }
                  
                  // Format website URL to be more concise
                  let formattedWebsite = school.contact?.website || school.website || 'www.edulogix.com';
                  if (formattedWebsite.length > 25) {
                    formattedWebsite = formattedWebsite
                      .replace(/^https?:\/\//, '')
                      .replace(/^www\./, '');
                    if (formattedWebsite.length > 25) {
                      formattedWebsite = formattedWebsite.substring(0, 22) + '...';
                    }
                  }
                  
                  schoolData = {
                    schoolName: school.name || school.schoolName || user?.schoolName,
                    schoolCode: school.code || school.schoolCode || user?.schoolCode,
                    address: formattedAddress,
                    phone: school.contact?.phone || school.phone || school.contactNumber || '+91-XXXXXXXXXX',
                    email: school.contact?.email || school.email || school.contactEmail || school.principalEmail || 'info@school.com',
                    website: formattedWebsite,
                    logoUrl: school.logoUrl || school.logo || ''
                  };
                }
              }
            } catch (finalError: any) {
              console.log('Final fallback also failed:', finalError.response?.status || finalError.message);
            }
          }
        }
      }

      // If we got school data, update the template settings
      if (schoolData) {
        console.log('Updating template settings with school data:', schoolData);
        setTemplateSettings(prev => ({
          ...prev,
          schoolName: schoolData.schoolName || prev.schoolName,
          schoolCode: schoolData.schoolCode || prev.schoolCode,
          address: schoolData.address || prev.address,
          phone: schoolData.phone || prev.phone,
          email: schoolData.email || prev.email,
          website: schoolData.website || prev.website,
          logoUrl: schoolData.logoUrl || prev.logoUrl
        }));
      } else {
        // Fallback to auth context data
        console.log('Using fallback data from user context');
        setTemplateSettings(prev => ({
          ...prev,
          schoolName: user?.schoolName || prev.schoolName,
          schoolCode: user?.schoolCode || prev.schoolCode,
          address: prev.address,
          phone: prev.phone,
          email: prev.email,
          website: prev.website
        }));
      }
    } catch (error) {
      console.error('Failed to fetch school data:', error);
      // Keep existing values from auth context
    } finally {
      setLoading(false);
    }
  };

  // Empty template data for different document types
  const templateData = {
    invoice: {
      title: 'INVOICE',
      recipientTitle: 'INVOICE TO:',
      showContent: false
    },
    admit_card: {
      title: 'ADMIT CARD',
      recipientTitle: 'STUDENT DETAILS:',
      showContent: false
    },
    certificate: {
      title: 'CERTIFICATE',
      recipientTitle: 'AWARDED TO:',
      showContent: false
    },
    custom: {
      title: 'DOCUMENT',
      recipientTitle: 'DETAILS:',
      showContent: false
    }
  };

  const handleSaveTemplate = async () => {
    try {
      localStorage.setItem('universalTemplate', JSON.stringify(templateSettings));
      toast.success('Template settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save template settings');
    }
  };

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print template');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Template Preview - ${templateData[templateType].title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
            }
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="w-full bg-white flex flex-col" style="font-family: Arial, sans-serif; min-height: 100vh; padding: 20mm; box-sizing: border-box;">
            <!-- Header -->
            <div class="flex justify-between items-start mb-8 pb-4 border-b-2" style="border-color: ${templateSettings.accentColor};">
              <div class="flex items-center space-x-4">
                ${templateSettings.logoUrl ?
        `<img src="${templateSettings.logoUrl}" alt="Logo" class="w-16 h-16 object-contain" />` :
        `<div class="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div class="w-10 h-10 border-2 border-white rounded transform rotate-45"></div>
                  </div>`
      }
                <div>
                  <h1 class="text-2xl font-bold" style="color: ${templateSettings.headerColor};">
                    ${templateSettings.schoolName}
                  </h1>
                  <p class="text-sm text-gray-600">School Code: ${templateSettings.schoolCode}</p>
                  <p class="text-sm text-gray-600">${templateSettings.address}</p>
                </div>
              </div>
              <div class="text-right">
                <h2 class="text-4xl font-bold" style="color: ${templateSettings.headerColor};">${templateData[templateType].title}</h2>
              </div>
            </div>
            
            <!-- Empty Content Area -->
            <div class="flex-1 flex items-center justify-center">
              <div class="text-center text-gray-400">
                <div class="text-6xl mb-4">📄</div>
                <p class="text-lg font-medium">Template Preview</p>
                <p class="text-sm">Content will appear here when documents are generated</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="mt-auto bg-gray-50 px-8 py-4 border-t">
              <div class="flex justify-between items-center text-sm text-gray-600">
                <div class="flex items-center space-x-4">
                  <span>${templateSettings.phone}</span>
                  <span>${templateSettings.email}</span>
                  <span>${templateSettings.website}</span>
                </div>
                <div class="flex items-center text-xs text-gray-500">
                  <span>Powered by</span>
                  <div class="ml-2 flex items-center">
                    <div class="w-4 h-4 bg-blue-600 rounded-sm mr-1"></div>
                    <span class="font-semibold">EduLogix</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="no-print fixed bottom-0 left-0 right-0 p-4 text-center bg-white border-t shadow-lg">
            <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-2 rounded-lg mr-4 hover:bg-blue-700 transition-colors">Print Template</button>
            <button onclick="window.close()" class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors">Close</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const loadTemplateSettings = () => {
    try {
      const saved = localStorage.getItem('universalTemplate');
      if (saved) {
        setTemplateSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load template settings:', error);
    }
  };

  useEffect(() => {
    loadTemplateSettings();
    fetchSchoolData();
  }, [user?.schoolCode]);

  const TemplatePreview = () => {
    const data = templateData[templateType];

    // Special layout for invoice template (portrait with vertical partition)
    if (templateType === 'invoice') {
      return (
        <div className="w-full max-w-4xl mx-auto bg-white shadow-lg" style={{
          fontFamily: 'Arial, sans-serif',
          aspectRatio: '210/148', // A5 landscape ratio (smaller height)
          minHeight: '148mm',
          width: '210mm',
          padding: '8mm',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row'
        }}>
          {/* Admin Copy */}
          <div style={{
            flex: 1,
            borderRight: '2px dashed #ccc',
            paddingRight: '5mm',
            marginRight: '5mm',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            {/* Header */}
            <div className="flex flex-col items-center mb-2 pb-1 border-b-2" style={{ borderColor: templateSettings.accentColor }}>
              <div className="flex items-center space-x-1 mb-1">
                {templateSettings.logoUrl ? (
                  <img src={templateSettings.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded transform rotate-45"></div>
                  </div>
                )}
                <div className="text-center">
                  <h1 className="text-xs font-bold" style={{ color: templateSettings.headerColor }}>
                    {templateSettings.schoolName}
                  </h1>
                  <p className="text-xs text-gray-600">{templateSettings.address}</p>
                  <p className="text-xs text-gray-600">Phone: {templateSettings.phone}</p>
                </div>
              </div>
              <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-xs font-bold">
                ADMIN COPY
              </div>
            </div>

            <div className="text-center mb-2">
              <h2 className="text-xs font-bold" style={{ color: templateSettings.headerColor }}>
                PAYMENT RECEIPT
              </h2>
            </div>

            <div className="text-center text-gray-400 flex-1 flex items-center justify-center">
              <div>
                <div className="text-2xl mb-2">🧾</div>
                <p className="text-xs font-medium">Admin Copy</p>
                <p className="text-xs">Student details</p>
              </div>
            </div>

            <div className="text-center mt-auto text-xs text-gray-600 border-t pt-2">
              <div className="mb-1">This is a computer generated copy.</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span>Powered by</span>
                <strong style={{ color: '#2563eb' }}>EduLogix</strong>
              </div>
            </div>
          </div>

          {/* Student Copy */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}>
            {/* Header */}
            <div className="flex flex-col items-center mb-2 pb-1 border-b-2" style={{ borderColor: templateSettings.accentColor }}>
              <div className="flex items-center space-x-1 mb-1">
                {templateSettings.logoUrl ? (
                  <img src={templateSettings.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <div className="w-6 h-6 bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white rounded transform rotate-45"></div>
                  </div>
                )}
                <div className="text-center">
                  <h1 className="text-xs font-bold" style={{ color: templateSettings.headerColor }}>
                    {templateSettings.schoolName}
                  </h1>
                  <p className="text-xs text-gray-600">{templateSettings.address}</p>
                  <p className="text-xs text-gray-600">Phone: {templateSettings.phone}</p>
                </div>
              </div>
              <div className="bg-blue-600 text-white px-1 py-0.5 rounded text-xs font-bold">
                STUDENT COPY
              </div>
            </div>

            <div className="text-center mb-2">
              <h2 className="text-xs font-bold" style={{ color: templateSettings.headerColor }}>
                PAYMENT RECEIPT
              </h2>
            </div>

            <div className="text-center text-gray-400 flex-1 flex items-center justify-center">
              <div>
                <div className="text-2xl mb-2">🧾</div>
                <p className="text-xs font-medium">Student Copy</p>
                <p className="text-xs">Student details</p>
              </div>
            </div>

            <div className="text-center mt-auto text-xs text-gray-600 border-t pt-2">
              <div className="mb-1">This is a computer generated copy.</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span>Powered by</span>
                <strong style={{ color: '#2563eb' }}>EduLogix</strong>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular portrait layout for other templates
    return (
      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg flex flex-col" style={{
        fontFamily: 'Arial, sans-serif',
        aspectRatio: '210/297', // A4 ratio
        minHeight: '297mm',
        width: '210mm',
        padding: '20mm',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b-2" style={{ borderColor: templateSettings.accentColor }}>
          <div className="flex items-center space-x-4">
            {templateSettings.logoUrl ? (
              <img src={templateSettings.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-white rounded transform rotate-45"></div>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold" style={{ color: templateSettings.headerColor }}>
                {templateSettings.schoolName}
              </h1>
              <p className="text-sm text-gray-600">School Code: {templateSettings.schoolCode}</p>
              <p className="text-sm text-gray-600">{templateSettings.address}</p>
              <p className="text-sm text-gray-600">Phone: {templateSettings.phone} | Email: {templateSettings.email}</p>
            </div>
          </div>
        </div>

        {/* Document Title Below Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: templateSettings.headerColor }}>
            {data.title}
          </h2>
        </div>

        {/* Empty Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium">Template Preview</p>
            <p className="text-sm">Content will appear here when documents are generated</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto bg-gray-50 px-8 py-4 border-t">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-600 font-medium">This is a computer generated copy. Signature is not required.</p>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{templateSettings.phone}</span>
              <span>{templateSettings.email}</span>
              <span>{templateSettings.website}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span>Powered by</span>
              <div className="ml-2 flex items-center">
                <div className="w-4 h-4 bg-blue-600 rounded-sm mr-1"></div>
                <span className="font-semibold">EduLogix</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Template Preview - {templateType.replace('_', ' ').toUpperCase()}</h3>
          <div className="flex space-x-3">
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="invoice">Invoice</option>
              <option value="admit_card">Admit Card</option>
              <option value="certificate">Certificate</option>
              <option value="custom">Custom Document</option>
            </select>
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Template
            </button>
            <button
              onClick={handlePrintPreview}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Print Template
            </button>
          </div>
        </div>

        {/* A4 Preview Container */}
        <div className="bg-gray-100 p-8 rounded-lg overflow-auto">
          <div className="transform scale-75 origin-top-left">
            <TemplatePreview />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Universal Template Settings</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </button>
          <button
            onClick={handleSaveTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Universal Template System</h4>
            <p className="text-sm text-blue-700 mt-1">
              Configure your school's universal template for all documents including invoices, admit cards, certificates, and more. This template will be used across the entire system.
            </p>
          </div>
        </div>
      </div>

      {/* School Information - Read Only */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">
          School Information
          {loading && (
            <span className="ml-2 text-sm text-blue-600">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading...
            </span>
          )}
        </h4>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> School information is automatically fetched from your database. Contact your administrator to update school details.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
            <input
              type="text"
              value={templateSettings.schoolName}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
            <input
              type="text"
              value={templateSettings.schoolCode}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">School Address</label>
            <input
              type="text"
              value={templateSettings.address}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="text"
              value={templateSettings.phone}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={templateSettings.email}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input
              type="text"
              value={templateSettings.website}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Design Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Design Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Header Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={templateSettings.headerColor}
                onChange={(e) => setTemplateSettings(prev => ({ ...prev, headerColor: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={templateSettings.headerColor}
                onChange={(e) => setTemplateSettings(prev => ({ ...prev, headerColor: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#1f2937"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={templateSettings.accentColor}
                onChange={(e) => setTemplateSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={templateSettings.accentColor}
                onChange={(e) => setTemplateSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3b82f6"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Template Usage</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This universal template will be used for all PDF documents</li>
          <li>• Supports invoices, admit cards, certificates, and custom documents</li>
          <li>• Maintains consistent branding across all school documents</li>
          <li>• Preview different document types before finalizing</li>
          <li>• Template is automatically applied to new documents</li>
        </ul>
      </div>
    </div>
  );
};

export default UniversalTemplate;
