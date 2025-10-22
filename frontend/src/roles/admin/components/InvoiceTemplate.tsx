import React, { useState, useEffect } from 'react';
import { FileText, Download, Eye, Settings, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InvoiceTemplateProps {
  schoolName?: string;
  schoolCode?: string;
  website?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  studentName: string;
  studentAddress: string;
  studentEmail: string;
  studentPhone: string;
  items: InvoiceItem[];
  subTotal: number;
  tax: number;
  total: number;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  schoolName = "School Name",
  schoolCode = "SCH001",
  website = "www.school.com"
}) => {
  const [templateSettings, setTemplateSettings] = useState({
    schoolName,
    schoolCode,
    website,
    logoUrl: '',
    headerColor: '#1f2937',
    accentColor: '#3b82f6'
  });

  const [previewMode, setPreviewMode] = useState(false);

  // Sample invoice data for preview
  const sampleInvoice: InvoiceData = {
    invoiceNumber: '#1234',
    invoiceDate: 'February 05, 2023',
    studentName: 'Pedro Fernandes',
    studentAddress: '123 Anywhere St., Any City, ST 12345',
    studentEmail: 'hello@reallygreatsite.com',
    studentPhone: '+123-456-7890',
    items: [
      { name: 'Tuition Fee', quantity: 1, price: 5000, total: 5000 },
      { name: 'Library Fee', quantity: 1, price: 500, total: 500 },
      { name: 'Sports Fee', quantity: 1, price: 300, total: 300 },
      { name: 'Lab Fee', quantity: 1, price: 800, total: 800 },
      { name: 'Transport Fee', quantity: 1, price: 1200, total: 1200 }
    ],
    subTotal: 7800,
    tax: 390,
    total: 8190
  };

  const handleSaveTemplate = async () => {
    try {
      // Here you would save the template settings to your backend
      // For now, we'll just save to localStorage
      localStorage.setItem('invoiceTemplate', JSON.stringify(templateSettings));
      toast.success('Template settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save template settings');
    }
  };

  const loadTemplateSettings = () => {
    try {
      const saved = localStorage.getItem('invoiceTemplate');
      if (saved) {
        setTemplateSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load template settings:', error);
    }
  };

  useEffect(() => {
    loadTemplateSettings();
  }, []);

  const InvoicePreview = () => (
    <div className="max-w-2xl mx-auto bg-white shadow-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start p-8 border-b-2" style={{ borderColor: templateSettings.accentColor }}>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white rounded transform rotate-45"></div>
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: templateSettings.headerColor }}>
              {templateSettings.schoolName}
            </h1>
            <p className="text-sm text-gray-600">School Code: {templateSettings.schoolCode}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold" style={{ color: templateSettings.headerColor }}>INVOICE</h2>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="p-8">
        <div className="flex justify-between mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">INVOICE TO:</h3>
            <div className="text-gray-800">
              <p className="font-semibold text-lg">{sampleInvoice.studentName}</p>
              <p className="text-sm text-gray-600">{sampleInvoice.studentAddress}</p>
              <p className="text-sm text-gray-600">{sampleInvoice.studentEmail}</p>
              <p className="text-sm text-gray-600">{sampleInvoice.studentPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-600">Invoice No: <span className="font-semibold">{sampleInvoice.invoiceNumber}</span></p>
              <p className="text-sm text-gray-600">Invoice Date: <span className="font-semibold">{sampleInvoice.invoiceDate}</span></p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2" style={{ borderColor: templateSettings.accentColor }}>
                <th className="text-left py-3 font-semibold text-gray-700">NAME</th>
                <th className="text-center py-3 font-semibold text-gray-700">QTY</th>
                <th className="text-right py-3 font-semibold text-gray-700">PRICE</th>
                <th className="text-right py-3 font-semibold text-gray-700">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sampleInvoice.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 text-gray-800">{item.name}</td>
                  <td className="py-3 text-center text-gray-800">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-800">₹{item.price}</td>
                  <td className="py-3 text-right text-gray-800">₹{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Sub-total:</span>
              <span className="font-semibold">₹{sampleInvoice.subTotal}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax:</span>
              <span className="font-semibold">₹{sampleInvoice.tax}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-300">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">₹{sampleInvoice.total}</span>
            </div>
          </div>
        </div>

        {/* Signature and Thank You */}
        <div className="flex justify-between items-end">
          <div>
            <div className="mb-2">
              <div className="w-32 h-16 border-b border-gray-400"></div>
              <p className="text-sm text-gray-600 mt-2">Administrator</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold" style={{ color: templateSettings.headerColor }}>THANK YOU!</h3>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-8 py-4 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{sampleInvoice.studentPhone}</span>
          <span>{sampleInvoice.studentEmail}</span>
          <span>{templateSettings.website}</span>
        </div>
      </div>
    </div>
  );

  if (previewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Invoice Template Preview</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Template
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Print/Download
            </button>
          </div>
        </div>
        <InvoicePreview />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Invoice Template Settings</h3>
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
            <h4 className="text-sm font-medium text-blue-900">Invoice Template</h4>
            <p className="text-sm text-blue-700 mt-1">
              Configure your school's invoice template for fee collection. This template will be used for generating fee invoices and admit cards.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
          <input
            type="text"
            value={templateSettings.schoolName}
            onChange={(e) => setTemplateSettings(prev => ({ ...prev, schoolName: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter school name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
          <input
            type="text"
            value={templateSettings.schoolCode}
            onChange={(e) => setTemplateSettings(prev => ({ ...prev, schoolCode: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter school code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <input
            type="text"
            value={templateSettings.website}
            onChange={(e) => setTemplateSettings(prev => ({ ...prev, website: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="www.yourschool.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (Optional)</label>
          <input
            type="text"
            value={templateSettings.logoUrl}
            onChange={(e) => setTemplateSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/logo.png"
          />
        </div>

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

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Template Usage</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• This template will be used for generating fee invoices</li>
          <li>• Future admit cards will also use this template design</li>
          <li>• Preview your changes before saving</li>
          <li>• The template is automatically applied to new invoices</li>
        </ul>
      </div>
    </div>
  );
};

export default InvoiceTemplate;
