import api from "./api";
import type { Slot, CreateSlotInput, UpdateSlotInput } from "../types/api";

export const slotsService = {
  async listSlots(): Promise<Slot[]> {
    const { data } = await api.get<{ slots: Slot[] }>("/api/slots");
    return data.slots;
  },

  async getAvailableSlots(): Promise<Slot[]> {
    const { data } = await api.get<{ slots: Slot[] }>("/api/slots/available");
    return data.slots;
  },

  async createSlot(input: CreateSlotInput): Promise<Slot> {
    const { data } = await api.post<Slot>("/api/slots", input);
    return data;
  },

  async updateSlot(id: string, input: UpdateSlotInput): Promise<Slot> {
    const { data } = await api.put<Slot>(`/api/slots/${id}`, input);
    return data;
  },

  async deleteSlot(id: string): Promise<void> {
    await api.delete(`/api/slots/${id}`);
  },
};
