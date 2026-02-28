export type Role = "ADMIN" | "EMPLOYEE" | "SECURITY";
export type SlotType = "TWO_WHEELER" | "FOUR_WHEELER";

export interface AuthResponse {
  token: string;
  role: Role;
  userId: string;
}

export interface Slot {
  id: string;
  slotCode: string;
  level: number;
  type: SlotType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  slotId: string;
  userId: string;
  vehicleId: string;
  checkedInAt: string;
  checkedOutAt: string | null;
  slot: Slot;
}

export interface DailyReport {
  generatedAt: string;
  totalSlots: number;
  usedSlots: number;
  emptySlots: number;
  occupiedSlots: { slotId: string; vehicleNumber: string }[];
}

export interface Flag {
  id: string;
  slotId: string;
  vehicleId: string;
  reportedAt: string;
  resolvedAt: string | null;
  slot: Slot;
  reportedBy: { id: string; email: string };
  resolvedBy: { id: string; email: string } | null;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface UserProfile {
  employeeId: string;
  vehicleId: string;
  phoneNumber: string;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  profile: UserProfile | null;
}

export interface CreateSlotInput {
  slotCode: string;
  level: number;
  type: SlotType;
}

export interface UpdateSlotInput {
  slotCode?: string;
  level?: number;
  type?: SlotType;
}

export interface RegisterInput {
  email: string;
  password: string;
  employeeId: string;
  vehicleId: string;
  phoneNumber: string;
}
