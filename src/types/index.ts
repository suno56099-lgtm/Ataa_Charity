/**
 * Type definitions for Ataa Charity Association Management System
 */

export type UserRole = 'admin' | 'staff';

export interface StaffAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Beneficiary {
  id: string;
  nationalId: string;
  fullName: string;
  phone: string;
  address?: string;
  familySize: number;
  pointsBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  pointsCost: number;
  unit: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export type CodeStatus = 'available' | 'used';

export interface MonthlyCode {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryNationalId: string;
  monthKey: string; // e.g. "2026-10"
  code: string; // 6-digit numeric string
  status: CodeStatus;
  usedAt?: string;
  usedByStaffId?: string;
  usedByStaffName?: string;
  deliveryId?: string;
  createdAt: string;
}

export interface DeliveryItemRecord {
  id: string;
  deliveryId: string;
  productId: string;
  productName: string;
  unitPoints: number;
  quantity: number;
  subtotalPoints: number;
}

export interface DeliveryRecord {
  id: string;
  codeId: string;
  deliveryCode: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  staffId: string;
  staffName: string;
  totalPoints: number;
  balanceBefore: number;
  balanceAfter: number;
  items: DeliveryItemRecord[];
  notes?: string;
  createdAt: string;
}

export type AuditActionType =
  | 'NATIONAL_ID_REVEAL'
  | 'GENERATE_CODES'
  | 'DELIVERY_DISPATCH'
  | 'ADD_POINTS'
  | 'BENEFICIARY_CREATE'
  | 'BENEFICIARY_UPDATE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'STAFF_CREATE'
  | 'STAFF_TOGGLE'
  | 'STAFF_RESET_PWD'
  | 'STAFF_LOGIN'
  | 'STAFF_LOGOUT';

export interface AuditLogEntry {
  id: string;
  action: AuditActionType;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetId?: string;
  targetName?: string;
  details: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalBeneficiaries: number;
  deliveriesThisMonth: number;
  totalPointsRemaining: number;
  codesThisMonthTotal: number;
  codesThisMonthUsed: number;
  codesThisMonthAvailable: number;
  pointsDistributedThisMonth: number;
  weeklyDeliveries: {
    weekLabel: string;
    deliveryCount: number;
    pointsCount: number;
  }[];
}
