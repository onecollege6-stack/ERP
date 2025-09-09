import api from '../api/axios';

export async function getAttendanceReport(params?: any) {
  const res = await api.get('/reports/attendance', { params });
  return res.data;
}

export async function getAcademicReport(params?: any) {
  const res = await api.get('/reports/academic', { params });
  return res.data;
}

export async function getGradeDistribution(params?: any) {
  const res = await api.get('/reports/grades', { params });
  return res.data;
}

export async function getTeacherPerformance(params?: any) {
  const res = await api.get('/reports/teachers', { params });
  return res.data;
}
