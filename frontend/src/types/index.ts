export interface Ship {
  id: number;
  name: string;
  imoNumber: string;
  flag: string;
  type: string;
  builtYear: number;
  deadweightTonnage: number;
}

export interface Port {
  id: number;
  name: string;
  code: string;
  country: string;
  city?: string;
  capacity: number;
}

export type VisitStatus = 'Scheduled' | 'Docked' | 'Departed' | 'Cancelled';

export interface ShipVisit {
  id: number;
  shipId: number;
  originPortId?: number;
  portId: number;
  arrivalDate: string; // ISO string or YYYY-MM-DDTHH:mm
  departureDate: string;
  status: VisitStatus;
  purpose?: string;
  dockNumber?: string;
  rowVersion?: string;
  ship?: Ship;
  originPort?: Port;
  port?: Port;
}

export type CargoType = 'Container' | 'Bulk' | 'Liquid' | 'General' | 'Vehicles';

export interface Cargo {
  id: number;
  shipId: number;
  description: string;
  weightTons: number; // Must be > 0
  type: CargoType;
  containerCount?: number;
  billOfLadingNumber?: string;
  imdgClass?: string;
  shipper?: string;
  consignee?: string;
  sealNumber?: string;
  ship?: Ship;
}

export interface CrewMember {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: string;
  email: string;
  phone: string;
  nationality: string;
}

export interface ShipCrewAssignment {
  id: number;
  shipId: number;
  crewMemberId: number;
  startDate: string;
  endDate?: string;
  roleOnShip: string;
  ship?: Ship;
  crewMember?: CrewMember;
}



export type UserRole = 'Admin' | 'Operator' | 'Viewer';

export interface User {
  id?: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  id?: number;
  user?: User;
  username?: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  expiresAt: string;
}

export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  type?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AvailableShipDto {
  shipId: number;
  name: string;
  imoNumber: string;
  flag: string;
  type: string;
  deadweightTonnage: number;
  isAvailable: boolean;
  currentStatus: string;
  lastKnownPortName?: string;
}

export interface AvailableCrewDto {
  crewId: number;
  fullName: string;
  role: string;
  nationality: string;
  email: string;
  phone: string;
  isAvailable: boolean;
  conflictDescription?: string;
}

export interface SafeManningValidationResult {
  isCompliant: boolean;
  hasMaster: boolean;
  hasChiefEngineer: boolean;
  totalCrewCount: number;
  warnings: string[];
  errors: string[];
}

export interface DispatchVoyageRequest {
  shipId: number;
  originPortId: number;
  destinationPortId: number;
  departureDate: string;
  arrivalDate: string;
  purpose?: string;
  dockNumber?: string;
  crewMemberIds: number[];
}

export interface DispatchVoyageResponse {
  success: boolean;
  message: string;
  visit?: ShipVisit;
  manningStatus: SafeManningValidationResult;
}
