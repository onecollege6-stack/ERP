import React from 'react';
import { createRoot } from 'react-dom/client';

interface StudentData {
  name: string;
  rollNumber: string;
  sequenceNumber: string;
  class: string;
  section: string;
  academicYear: string;
  address: string;
  email: string;
  phone: string;
  parentName: string;
}

interface FeeStructure {
  feeName: string;
  amount: number;
  totalAmount: number;
  pendingAmount: number;
  payments: any[];
}

interface PaymentData {
  receiptNumber: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  totalPaid: number;
  totalFees: number;
  remainingFees: number;
}

interface SchoolData {
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

// Generate Invoice function for fee payments
export const generateInvoice = (
  studentData: StudentData,
  feeStructure: FeeStructure[],
  paymentData: PaymentData,
  schoolData: SchoolData
) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-IN', { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString('en-IN');
    return `${dateFormatted} (${day})`;
  };

  const formatCurrency = (amount: number) => {
    return `INR ${amount.toLocaleString('en-IN')}`;
  };

  // Calculate totals
  const totalPending = feeStructure.reduce((sum, fee) => sum + (fee.pendingAmount || 0), 0);
  const pendingInstallments = feeStructure.filter((fee) => fee.pendingAmount > 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt</title>
      <style>
        @page { 
          size: A4 landscape; 
          margin: 10mm; 
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .container { 
          width: 100%; 
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .copy-section {
          flex: 1;
          border-bottom: 2px dashed #ccc;
          padding-bottom: 10mm;
          margin-bottom: 10mm;
        }
        .copy-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #3b82f6;
        }
        .school-info h1 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }
        .school-info p {
          margin: 2px 0;
          font-size: 11px;
          color: #666;
        }
        .copy-type {
          background: #3b82f6;
          color: white;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        .title {
          text-align: center;
          margin-bottom: 15px;
        }
        .title h2 {
          margin: 0;
          font-size: 16px;
          color: #1f2937;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .content {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
        }
        .left-column, .right-column {
          flex: 1;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1f2937;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: 11px;
        }
        .detail-row .value {
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 6px;
          text-align: left;
        }
        th {
          background: #f8f9fa;
          font-weight: bold;
        }
        .amount {
          text-align: right;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          margin-top: 10px;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
        .edulogix {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 5px;
        }
        .edulogix strong {
          color: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Admin Copy -->
        <div class="copy-section">
          <div class="header">
            <div class="school-info">
              <h1>${schoolData.schoolName}</h1>
              <p>${schoolData.address}</p>
              <p>Phone: ${schoolData.phone} | Email: ${schoolData.email}</p>
            </div>
            <div class="copy-type">ADMIN COPY</div>
          </div>
          
          <div class="title">
            <h2>PAYMENT RECEIPT</h2>
          </div>
          
          <div class="content">
            <div class="left-column">
              <div class="section-title">Student Details</div>
              <div class="detail-row">
                <span>Name:</span>
                <span class="value">${studentData.name}</span>
              </div>
              <div class="detail-row">
                <span>${studentData.rollNumber && studentData.rollNumber !== 'null' && studentData.rollNumber !== 'N/A' ? 'Roll Number' : 'Student ID'}:</span>
                <span class="value">${studentData.rollNumber && studentData.rollNumber !== 'null' && studentData.rollNumber !== 'N/A' ? studentData.rollNumber : studentData.sequenceNumber}</span>
              </div>
              <div class="detail-row">
                <span>Class:</span>
                <span class="value">${studentData.class}-${studentData.section}</span>
              </div>
              <div class="detail-row">
                <span>Academic Year:</span>
                <span class="value">${studentData.academicYear}</span>
              </div>
              <div class="detail-row">
                <span>Contact:</span>
                <span class="value">${studentData.phone}</span>
              </div>
              <div class="detail-row">
                <span>Email:</span>
                <span class="value">${studentData.email}</span>
              </div>
              <div class="detail-row">
                <span>Parent:</span>
                <span class="value">${studentData.parentName}</span>
              </div>
            </div>
            
            <div class="right-column">
              <div class="section-title">Payment Details</div>
              <div class="detail-row">
                <span>Receipt No:</span>
                <span class="value">${paymentData.receiptNumber}</span>
              </div>
              <div class="detail-row">
                <span>Payment Date:</span>
                <span class="value">${formatDate(paymentData.paymentDate)}</span>
              </div>
              <div class="detail-row">
                <span>Method:</span>
                <span class="value">${paymentData.paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span>Reference:</span>
                <span class="value">${paymentData.reference}</span>
              </div>
              <div class="detail-row">
                <span>Total Fees:</span>
                <span class="value">${formatCurrency(paymentData.totalFees)}</span>
              </div>
              <div class="detail-row">
                <span>Total Paid:</span>
                <span class="value">${formatCurrency(paymentData.totalPaid)}</span>
              </div>
              <div class="detail-row">
                <span>Remaining:</span>
                <span class="value">${formatCurrency(paymentData.remainingFees)}</span>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Installment</th>
                <th class="amount">Paid Amount</th>
                <th class="amount">Total Amount</th>
                <th class="amount">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${feeStructure.map(fee => `
                <tr>
                  <td>${fee.feeName}</td>
                  <td class="amount">${formatCurrency(fee.amount)}</td>
                  <td class="amount">${formatCurrency(fee.totalAmount)}</td>
                  <td class="amount">${formatCurrency(fee.pendingAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${pendingInstallments.length > 0 ? `
            <div style="margin-top: 15px;">
              <div class="section-title">Pending Installments</div>
              ${pendingInstallments.map(fee => `
                <div class="detail-row">
                  <span>${fee.feeName}:</span>
                  <span class="value">${formatCurrency(fee.pendingAmount)}</span>
                </div>
              `).join('')}
              <div class="detail-row" style="border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
                <span><strong>Total Pending:</strong></span>
                <span class="value"><strong>${formatCurrency(totalPending)}</strong></span>
              </div>
            </div>
          ` : `
            <div style="margin-top: 15px; text-align: center; color: #16a34a; font-weight: bold;">
              ✓ All installments paid
            </div>
          `}
        </div>
        
        <!-- Student Copy -->
        <div class="copy-section">
          <div class="header">
            <div class="school-info">
              <h1>${schoolData.schoolName}</h1>
              <p>${schoolData.address}</p>
              <p>Phone: ${schoolData.phone} | Email: ${schoolData.email}</p>
            </div>
            <div class="copy-type">STUDENT COPY</div>
          </div>
          
          <div class="title">
            <h2>PAYMENT RECEIPT</h2>
          </div>
          
          <div class="content">
            <div class="left-column">
              <div class="section-title">Student Details</div>
              <div class="detail-row">
                <span>Name:</span>
                <span class="value">${studentData.name}</span>
              </div>
              <div class="detail-row">
                <span>${studentData.rollNumber && studentData.rollNumber !== 'null' && studentData.rollNumber !== 'N/A' ? 'Roll Number' : 'Student ID'}:</span>
                <span class="value">${studentData.rollNumber && studentData.rollNumber !== 'null' && studentData.rollNumber !== 'N/A' ? studentData.rollNumber : studentData.sequenceNumber}</span>
              </div>
              <div class="detail-row">
                <span>Class:</span>
                <span class="value">${studentData.class}-${studentData.section}</span>
              </div>
              <div class="detail-row">
                <span>Academic Year:</span>
                <span class="value">${studentData.academicYear}</span>
              </div>
              <div class="detail-row">
                <span>Contact:</span>
                <span class="value">${studentData.phone}</span>
              </div>
              <div class="detail-row">
                <span>Email:</span>
                <span class="value">${studentData.email}</span>
              </div>
              <div class="detail-row">
                <span>Parent:</span>
                <span class="value">${studentData.parentName}</span>
              </div>
            </div>
            
            <div class="right-column">
              <div class="section-title">Payment Details</div>
              <div class="detail-row">
                <span>Receipt No:</span>
                <span class="value">${paymentData.receiptNumber}</span>
              </div>
              <div class="detail-row">
                <span>Payment Date:</span>
                <span class="value">${formatDate(paymentData.paymentDate)}</span>
              </div>
              <div class="detail-row">
                <span>Method:</span>
                <span class="value">${paymentData.paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span>Reference:</span>
                <span class="value">${paymentData.reference}</span>
              </div>
              <div class="detail-row">
                <span>Total Fees:</span>
                <span class="value">${formatCurrency(paymentData.totalFees)}</span>
              </div>
              <div class="detail-row">
                <span>Total Paid:</span>
                <span class="value">${formatCurrency(paymentData.totalPaid)}</span>
              </div>
              <div class="detail-row">
                <span>Remaining:</span>
                <span class="value">${formatCurrency(paymentData.remainingFees)}</span>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Installment</th>
                <th class="amount">Paid Amount</th>
                <th class="amount">Total Amount</th>
                <th class="amount">Pending</th>
              </tr>
            </thead>
            <tbody>
              ${feeStructure.map(fee => `
                <tr>
                  <td>${fee.feeName}</td>
                  <td class="amount">${formatCurrency(fee.amount)}</td>
                  <td class="amount">${formatCurrency(fee.totalAmount)}</td>
                  <td class="amount">${formatCurrency(fee.pendingAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          ${pendingInstallments.length > 0 ? `
            <div style="margin-top: 15px;">
              <div class="section-title">Pending Installments</div>
              ${pendingInstallments.map(fee => `
                <div class="detail-row">
                  <span>${fee.feeName}:</span>
                  <span class="value">${formatCurrency(fee.pendingAmount)}</span>
                </div>
              `).join('')}
              <div class="detail-row" style="border-top: 1px solid #ddd; padding-top: 5px; margin-top: 5px;">
                <span><strong>Total Pending:</strong></span>
                <span class="value"><strong>${formatCurrency(totalPending)}</strong></span>
              </div>
            </div>
          ` : `
            <div style="margin-top: 15px; text-align: center; color: #16a34a; font-weight: bold;">
              ✓ All installments paid
            </div>
          `}
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div>This is a computer generated copy. Signature is not required.</div>
          <div class="edulogix">
            <span>Powered by</span>
            <strong>EduLogix</strong>
            <img src="/logo-edulogix.png" alt="EduLogix" style="width: 16px; height: 16px; margin-left: 5px;" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Create and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);
  }
};

export default generateInvoice;
