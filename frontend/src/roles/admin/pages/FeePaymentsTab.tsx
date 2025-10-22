import React, { useState } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import ClassSectionSelect from '../components/ClassSectionSelect';
import { feesAPI } from '../../../services/api';
import toast from 'react-hot-toast';

const FeePaymentsTab: React.FC = () => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  console.log('FeePaymentsTab render');

  // Real data from API
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state for recording payments
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<any | null>(null);
  const [selectedInstallmentName, setSelectedInstallmentName] = useState<string>('');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payDate, setPayDate] = useState<string>('');
  const [payRef, setPayRef] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // History modal state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRecord, setHistoryRecord] = useState<any | null>(null);
  const [historyInstallmentName, setHistoryInstallmentName] = useState<string>('');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await feesAPI.getStudentFeeRecords({
        class: selectedClass,
        section: selectedSection,
        search: searchTerm,
        limit: 50,
      });
      const data = res.data?.data?.records || [];
      const mapped = data.map((r: any) => ({
        id: r.id,
        name: r.studentName,
        class: r.studentClass,
        section: r.studentSection,
        rollNumber: r.rollNumber,
        totalAmount: r.totalAmount,
        totalPaid: r.totalPaid,
        balance: r.totalPending,
        status: r.status,
        installments: r.installments || [],
      }));
      setStudents(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load fee records');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (receiptNumber: string) => {
    try {
      const res = await feesAPI.downloadReceipt(receiptNumber);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloading...');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to download receipt');
    }
  };

  const openHistoryModal = async (student: any) => {
    try {
      setHistoryLoading(true);
      setIsHistoryOpen(true);
      const res = await feesAPI.getStudentFeeRecord(student.id);
      const rec = res.data?.data;
      setHistoryRecord(rec || null);
      const firstInst = (rec?.installments || [])[0];
      setHistoryInstallmentName(firstInst?.name || '');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to load payment history');
      setIsHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedSection]);

  // naive debounce for search
  React.useEffect(() => {
    const t = setTimeout(() => fetchRecords(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'pending': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const openPaymentModal = (student: any) => {
    setActiveStudent(student);
    setPayMethod('cash');
    setPayDate('');
    setPayRef('');
    // Auto-select first pending installment if available
    const list = student.installments || [];
    const firstPending = list.find((inst: any) => {
      const pending = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0));
      return pending > 0;
    }) || list[0];
    if (firstPending) {
      const pending = Math.max(0, (firstPending.amount || 0) - (firstPending.paidAmount || 0));
      setSelectedInstallmentName(firstPending.name || '');
      setPayAmount(String(pending || ''));
    } else {
      setSelectedInstallmentName('');
      setPayAmount('');
    }
    setIsModalOpen(true);
  };

  const closePaymentModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setActiveStudent(null);
  };

  const onSelectInstallment = (inst: any) => {
    const pending = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0));
    setSelectedInstallmentName(inst.name);
    setPayAmount(String(pending || ''));
  };

  const handleSubmitPayment = async () => {
    if (!activeStudent) return;
    const amt = Number(payAmount);
    if (!selectedInstallmentName) return toast.error('Select an installment');
    if (Number.isNaN(amt) || amt <= 0) return toast.error('Enter a valid amount');
    const inst = (activeStudent.installments || []).find((i: any) => i.name === selectedInstallmentName);
    if (inst) {
      const pendingForInst = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0));
      if (amt > pendingForInst) return toast.error(`Amount cannot exceed pending (${formatCurrency(pendingForInst)})`);
    }
    const methodsRequiringRef = ['cheque', 'bank_transfer', 'online'];
    if (methodsRequiringRef.includes(payMethod) && !String(payRef || '').trim()) {
      return toast.error('Reference / Remarks is required for Cheque, Bank Transfer, and Online payments');
    }
    try {
      setSubmitting(true);
      await feesAPI.recordOfflinePayment(activeStudent.id, {
        installmentName: selectedInstallmentName,
        amount: amt,
        paymentMethod: payMethod,
        paymentDate: payDate || undefined,
        paymentReference: payRef || undefined,
      });
      await fetchRecords();
      setIsModalOpen(false);
      toast.success('Payment recorded successfully');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Payments Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <ClassSectionSelect
            schoolCode={user?.schoolCode}
            valueClass={selectedClass}
            valueSection={selectedSection}
            onClassChange={setSelectedClass}
            onSectionChange={setSelectedSection}
          />
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search students..."
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Assigned</p>
                <p className="text-2xl font-semibold text-blue-900">
                  {formatCurrency(students.reduce((sum, s) => sum + (s.totalAmount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-green-600">Total Collected</p>
                <p className="text-2xl font-semibold text-green-900">
                  {formatCurrency(students.reduce((sum, s) => sum + (s.totalPaid || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-orange-600">Outstanding</p>
                <p className="text-2xl font-semibold text-orange-900">
                  {formatCurrency(students.reduce((sum, s) => sum + (s.balance || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Student Fee Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <button
                        type="button"
                        onClick={() => openHistoryModal(student)}
                        className="text-left text-sm font-medium text-blue-600 hover:underline"
                      >
                        {student.name}
                      </button>
                      {(student.class || student.section || student.rollNumber) && (
                        <div className="text-sm text-gray-500">
                          {[
                            student.class && student.section
                              ? `${student.class} - ${student.section}`
                              : (student.class || student.section || ''),
                            student.rollNumber ? `(${student.rollNumber})` : ''
                          ].filter(Boolean).join(' ')}
                        </div>
                      )}
      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Payment History{historyRecord?.studentName ? ` - ${historyRecord.studentName}` : ''}</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {historyLoading && <div className="text-sm text-gray-500">Loading history...</div>}
              {!historyLoading && historyRecord && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Installment:</label>
                    <select
                      className="px-2 py-1 border rounded text-sm"
                      value={historyInstallmentName}
                      onChange={(e) => setHistoryInstallmentName(e.target.value)}
                    >
                      {(historyRecord.installments || []).map((inst: any) => (
                        <option key={inst.name} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(historyRecord.payments || [])
                          .filter((p: any) => !historyInstallmentName || p.installmentName === historyInstallmentName)
                          .map((p: any) => {
                            const d = p.paymentDate ? new Date(p.paymentDate) : null;
                            const dateStr = d ? d.toLocaleDateString() : '-';
                            const dayStr = d ? d.toLocaleDateString('en-IN', { weekday: 'long' }) : '-';
                            return (
                              <tr key={String(p.paymentId)} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(p.amount || 0)}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{p.paymentMethod}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{p.paymentReference || '-'}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{dateStr}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">{dayStr}</td>
                                <td className="px-3 py-2 text-sm text-gray-900">
                                  {p.receiptNumber ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(p.receiptNumber)}
                                      className="text-blue-600 hover:underline"
                                    >
                                      {p.receiptNumber}
                                    </button>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        {(!historyRecord.payments || historyRecord.payments.length === 0) && (
                          <tr>
                            <td colSpan={6} className="px-3 py-3 text-sm text-gray-500">No payments found for this installment.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(student.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(student.totalPaid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(student.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openPaymentModal(student)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Record Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {isModalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Record Payment - {activeStudent.name}</h3>
              <button onClick={closePaymentModal} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Installment</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(activeStudent.installments || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-3 text-sm text-gray-500">No installments data available.</td>
                      </tr>
                    ) : (
                      activeStudent.installments.map((inst: any, idx: number) => {
                        const pending = Math.max(0, (inst.amount || 0) - (inst.paidAmount || 0));
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900">{inst.name}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : '-'}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(inst.amount || 0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(inst.paidAmount || 0)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(pending)}</td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => onSelectInstallment(inst)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {selectedInstallmentName
                      ? `Selected installment: ${selectedInstallmentName}`
                      : 'Select an installment from the table to proceed.'}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount to collect</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Select an installment first"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="cheque">Cheque</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {['cheque','bank_transfer','online'].includes(payMethod) ? 'Reference / Remarks (required)' : 'Reference / Remarks (optional)'}
                    </label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="txn id, cheque no, note, etc."
                      required={['cheque','bank_transfer','online'].includes(payMethod)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={closePaymentModal}
                      disabled={submitting}
                      className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitPayment}
                      disabled={submitting || !selectedInstallmentName}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Recording...' : 'Record Payment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div className="text-sm text-gray-500">Loading records...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
    </div>
  );
};

export default FeePaymentsTab;
