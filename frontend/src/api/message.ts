// frontend/src/api/message.ts
import api from '../api/axios';

export async function getMessages(params?: any) {
  const res = await api.get('/messages', { params });
  return res.data;
}

// FIX: Changed endpoint to include '/send' to match your Express router setup
export async function sendMessage(data: any) {
  const res = await api.post('/messages/send', data);
  return res.data;
}

export async function previewMessageRecipients(data: any) {
  const res = await api.post('/messages/preview', data);
  return res.data;
}

export async function deleteMessage(id: string) {
  const res = await api.delete(`/messages/${id}`);
  return res.data;
}