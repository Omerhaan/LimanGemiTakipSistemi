import axios from 'axios';
import type {
  Ship,
  Port,
  ShipVisit,
  Cargo,
  CrewMember,
  ShipCrewAssignment,
  VisitStatus,
  User,
  LoginRequest,
  LoginResponse,
  PaginationParams,
  PagedResult,
  AvailableShipDto,
  AvailableCrewDto,
  SafeManningValidationResult,
  DispatchVoyageRequest,
  DispatchVoyageResponse,
} from '../types';
import { mockStorage } from './mockData';

// API Base URL (default ASP.NET Core URL)
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor: Attach JWT Bearer Token if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('liman_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Extract error messages cleanly and handle 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('liman_token');
      localStorage.removeItem('liman_current_user');
      window.dispatchEvent(new Event('auth-changed'));
    }
    const serverMessage = error.response?.data?.message;
    const message = serverMessage || error.message || 'Sunucu ile iletişimde hata oluştu.';
    return Promise.reject(new Error(message));
  }
);

// Mock mode toggle helper (defaults to Live API mode)
export const isMockEnabled = (): boolean => {
  const stored = localStorage.getItem('liman_use_mock');
  if (stored !== null) {
    return stored === 'true';
  }
  return false; // Default: Live API mode
};

export const setMockEnabled = (enabled: boolean): void => {
  localStorage.setItem('liman_use_mock', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('mock-mode-changed'));
};

export interface ImoValidationResult {
  isValid: boolean;
  message: string;
  cleanImo: string;
  expectedCheckDigit?: number;
}

export const validateImoNumber = (imo: string): ImoValidationResult => {
  if (!imo || !imo.trim()) {
    return { isValid: false, message: 'IMO numarası zorunludur.', cleanImo: '' };
  }

  const digits = imo.replace(/\D/g, '');

  if (digits.length !== 7) {
    return {
      isValid: false,
      message: 'IMO numarası tam olarak 7 basamaklı olmalıdır (örn: 9176187).',
      cleanImo: digits,
    };
  }

  const weights = [7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    sum += parseInt(digits[i], 10) * weights[i];
  }

  const expectedCheckDigit = sum % 10;
  const actualCheckDigit = parseInt(digits[6], 10);

  if (expectedCheckDigit !== actualCheckDigit) {
    return {
      isValid: false,
      message: `Geçersiz IMO kontrol basamağı! İlk 6 basamağın formülüne göre son rakam ${expectedCheckDigit} olmalıdır, fakat ${actualCheckDigit} girildi.`,
      cleanImo: digits,
      expectedCheckDigit,
    };
  }

  return {
    isValid: true,
    message: 'Geçerli IMO Numarası (Uluslararası kontrol basamağı doğrulandı)',
    cleanImo: digits,
    expectedCheckDigit,
  };
};

export const generateRandomValidImo = (): string => {
  // İlk basamak genellikle modern ticaret gemilerinde 8 veya 9 olur
  const d1 = Math.floor(Math.random() * 2) + 8;
  const d2 = Math.floor(Math.random() * 10);
  const d3 = Math.floor(Math.random() * 10);
  const d4 = Math.floor(Math.random() * 10);
  const d5 = Math.floor(Math.random() * 10);
  const d6 = Math.floor(Math.random() * 10);
  const digits = [d1, d2, d3, d4, d5, d6];
  const weights = [7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    sum += digits[i] * weights[i];
  }
  const checkDigit = sum % 10;
  return `${digits.join('')}${checkDigit}`;
};

// ============================================================================
// PAGINATION HELPER (FOR MOCK & CLIENT)
// ============================================================================
export function paginateList<T>(
  list: T[],
  params?: PaginationParams,
  filterFn?: (item: T, term: string) => boolean
): PagedResult<T> {
  const pageNumber = params?.pageNumber && params.pageNumber > 0 ? params.pageNumber : 1;
  const pageSize = params?.pageSize && params.pageSize > 0 ? params.pageSize : 10;
  const searchTerm = (params?.searchTerm || '').trim().toLowerCase();

  let filtered = list;
  if (searchTerm && filterFn) {
    filtered = filtered.filter(item => filterFn(item, searchTerm));
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startIndex = (pageNumber - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    hasPreviousPage: pageNumber > 1,
    hasNextPage: pageNumber < totalPages,
  };
}

// ============================================================================
// AUTH SERVICE (/api/auth)
// ============================================================================
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'Admin123!',
    user: {
      id: 1,
      username: 'admin',
      fullName: 'Sistem Yöneticisi',
      email: 'admin@liman.gov.tr',
      role: 'Admin',
    },
  },
  operator: {
    password: 'Operator123!',
    user: {
      id: 2,
      username: 'operator',
      fullName: 'Liman Operatörü',
      email: 'operator@liman.gov.tr',
      role: 'Operator',
    },
  },
  viewer: {
    password: 'Viewer123!',
    user: {
      id: 3,
      username: 'viewer',
      fullName: 'Misafir Gözlemci',
      email: 'viewer@liman.gov.tr',
      role: 'Viewer',
    },
  },
};

export const authService = {
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    if (isMockEnabled()) {
      const match = DEMO_USERS[request.username.toLowerCase()];
      if (!match || !request.password || match.password !== request.password) {
        throw new Error('Kullanıcı adı veya şifre hatalı!');
      }
      const response: LoginResponse = {
        token: `mock-jwt-token-for-${match.user.username}-${Date.now()}`,
        username: match.user.username,
        email: match.user.email,
        fullName: match.user.fullName,
        role: match.user.role,
        expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
      };
      localStorage.setItem('liman_token', response.token);
      localStorage.setItem('liman_current_user', JSON.stringify(match.user));
      window.dispatchEvent(new Event('auth-changed'));
      return response;
    }

    try {
      const res = await axiosInstance.post<any>('/api/auth/login', request);
      const rawUser = res.data.user || res.data;
      const currentUser: User = {
        id: rawUser.id,
        username: rawUser.username || res.data.username || request.username,
        email: rawUser.email || res.data.email || '',
        fullName: rawUser.fullName || res.data.fullName || request.username,
        role: (rawUser.role || res.data.role || 'Viewer') as any,
      };
      localStorage.setItem('liman_token', res.data.token);
      localStorage.setItem('liman_current_user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('auth-changed'));
      return {
        token: res.data.token,
        user: currentUser,
        username: currentUser.username,
        email: currentUser.email,
        fullName: currentUser.fullName,
        role: currentUser.role,
        expiresAt: res.data.expiresAt,
      };
    } catch (err: any) {
      throw err;
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('liman_token');
    if (!token) return null;

    if (isMockEnabled()) {
      const stored = localStorage.getItem('liman_current_user');
      return stored ? JSON.parse(stored) : null;
    }

    try {
      const res = await axiosInstance.get<any>('/api/auth/me');
      const raw = res.data.user || res.data;
      if (raw && (raw.username || raw.role)) {
        const user: User = {
          id: raw.id,
          username: raw.username,
          email: raw.email,
          fullName: raw.fullName,
          role: raw.role,
        };
        localStorage.setItem('liman_current_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch {
      const stored = localStorage.getItem('liman_current_user');
      return stored ? JSON.parse(stored) : null;
    }
  },

  logout: () => {
    localStorage.removeItem('liman_token');
    localStorage.removeItem('liman_current_user');
    window.dispatchEvent(new Event('auth-changed'));
  },

  getStoredUser: (): User | null => {
    try {
      const stored = localStorage.getItem('liman_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },
};

// ============================================================================
// 1. SHIPS SERVICE (/api/ships)
// ============================================================================
export const shipService = {
  getAll: async (): Promise<Ship[]> => {
    if (isMockEnabled()) {
      return Promise.resolve(mockStorage.getShips());
    }
    const res = await axiosInstance.get<Ship[]>('/api/ships');
    return res.data;
  },

  getPaged: async (params?: PaginationParams): Promise<PagedResult<Ship>> => {
    if (isMockEnabled()) {
      let list = mockStorage.getShips();
      if (params?.type && params.type !== 'ALL') {
        list = list.filter(s => s.type === params.type);
      }
      return Promise.resolve(
        paginateList(list, params, (s, term) =>
          s.name.toLowerCase().includes(term) ||
          s.imoNumber.includes(term) ||
          s.flag.toLowerCase().includes(term)
        )
      );
    }
    const res = await axiosInstance.get<PagedResult<Ship>>('/api/ships/paged', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Ship> => {
    if (isMockEnabled()) {
      const ship = mockStorage.getShips().find(s => s.id === id);
      if (!ship) throw new Error("Gemi bulunamadı");
      return Promise.resolve(ship);
    }
    const res = await axiosInstance.get<Ship>(`/api/ships/${id}`);
    return res.data;
  },

  create: async (ship: Omit<Ship, 'id'>): Promise<Ship> => {
    if (!ship.name?.trim()) throw new Error("Gemi adı zorunludur.");
    if (!ship.type?.trim()) throw new Error("Gemi tipi zorunludur.");
    if (!ship.flag?.trim()) throw new Error("Gemi bayrağı / tescil ülkesi zorunludur.");
    if (ship.deadweightTonnage < 0) throw new Error("Gemi taşıma kapasitesi (DWT) negatif olamaz.");
    if (ship.deadweightTonnage > 600000) throw new Error("Gemi taşıma kapasitesi (DWT) gerçekçi sınırlar içinde olmalıdır (Maksimum 600.000 DWT).");

    const maxYear = new Date().getFullYear() + 3;
    if (ship.builtYear > 0 && (ship.builtYear < 1900 || ship.builtYear > maxYear)) {
      throw new Error(`Gemi yapım yılı 1900 ile ${maxYear} arasında olmalıdır.`);
    }

    // IMO Kontrol Basamağı Doğrulaması
    const imoCheck = validateImoNumber(ship.imoNumber);
    if (!imoCheck.isValid) {
      throw new Error(imoCheck.message);
    }

    const shipWithCleanImo = { ...ship, imoNumber: imoCheck.cleanImo };

    if (isMockEnabled()) {
      const ships = mockStorage.getShips();
      // IMO Uniqueness check
      if (ships.some(s => s.imoNumber.trim() === shipWithCleanImo.imoNumber.trim())) {
        throw new Error(`Bu IMO Numarası (${shipWithCleanImo.imoNumber}) ile kayıtlı başka bir gemi zaten var!`);
      }
      const newShip: Ship = {
        ...shipWithCleanImo,
        id: ships.length > 0 ? Math.max(...ships.map(s => s.id)) + 1 : 1,
      };
      mockStorage.saveShips([...ships, newShip]);
      return Promise.resolve(newShip);
    }
    const res = await axiosInstance.post<Ship>('/api/ships', shipWithCleanImo);
    return res.data;
  },

  update: async (id: number, ship: Partial<Ship>): Promise<Ship> => {
    let cleanImo = ship.imoNumber;
    if (ship.imoNumber) {
      const imoCheck = validateImoNumber(ship.imoNumber);
      if (!imoCheck.isValid) {
        throw new Error(imoCheck.message);
      }
      cleanImo = imoCheck.cleanImo;
    }

    const shipToUpdate = cleanImo ? { ...ship, imoNumber: cleanImo } : ship;

    if (isMockEnabled()) {
      const ships = mockStorage.getShips();
      // IMO uniqueness check for other ships
      if (cleanImo && ships.some(s => s.id !== id && s.imoNumber.trim() === cleanImo.trim())) {
        throw new Error(`Bu IMO Numarası (${cleanImo}) başka bir gemide kullanılmaktadır!`);
      }
      const updated = ships.map(s => s.id === id ? { ...s, ...shipToUpdate } : s);
      mockStorage.saveShips(updated);
      const target = updated.find(s => s.id === id);
      if (!target) throw new Error("Gemi bulunamadı");
      return Promise.resolve(target);
    }
    const res = await axiosInstance.put<Ship>(`/api/ships/${id}`, shipToUpdate);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      const ships = mockStorage.getShips().filter(s => s.id !== id);
      mockStorage.saveShips(ships);
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/ships/${id}`);
  },
};

// ============================================================================
// 2. PORTS SERVICE (/api/ports)
// ============================================================================
export const portService = {
  getAll: async (): Promise<Port[]> => {
    if (isMockEnabled()) return Promise.resolve(mockStorage.getPorts());
    const res = await axiosInstance.get<Port[]>('/api/ports');
    return res.data;
  },

  getPaged: async (params?: PaginationParams): Promise<PagedResult<Port>> => {
    if (isMockEnabled()) {
      const list = mockStorage.getPorts();
      return Promise.resolve(
        paginateList(list, params, (p, term) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.country.toLowerCase().includes(term)
        )
      );
    }
    const res = await axiosInstance.get<PagedResult<Port>>('/api/ports/paged', { params });
    return res.data;
  },

  getById: async (id: number): Promise<Port> => {
    if (isMockEnabled()) {
      const port = mockStorage.getPorts().find(p => p.id === id);
      if (!port) throw new Error("Liman bulunamadı");
      return Promise.resolve(port);
    }
    const res = await axiosInstance.get<Port>(`/api/ports/${id}`);
    return res.data;
  },

  create: async (port: Omit<Port, 'id'>): Promise<Port> => {
    if (isMockEnabled()) {
      const ports = mockStorage.getPorts();
      const newPort: Port = {
        ...port,
        id: ports.length > 0 ? Math.max(...ports.map(p => p.id)) + 1 : 1,
      };
      mockStorage.savePorts([...ports, newPort]);
      return Promise.resolve(newPort);
    }
    const res = await axiosInstance.post<Port>('/api/ports', port);
    return res.data;
  },

  update: async (id: number, port: Partial<Port>): Promise<Port> => {
    if (isMockEnabled()) {
      const ports = mockStorage.getPorts();
      const updated = ports.map(p => p.id === id ? { ...p, ...port } : p);
      mockStorage.savePorts(updated);
      const target = updated.find(p => p.id === id);
      if (!target) throw new Error("Liman bulunamadı");
      return Promise.resolve(target);
    }
    const res = await axiosInstance.put<Port>(`/api/ports/${id}`, port);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      mockStorage.savePorts(mockStorage.getPorts().filter(p => p.id !== id));
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/ports/${id}`);
  },
};

export const computeVisitStatus = (arrivalDate: string, departureDate: string, currentStatus?: VisitStatus): VisitStatus => {
  if (currentStatus === 'Cancelled') return 'Cancelled';
  if (!arrivalDate || !departureDate) return currentStatus || 'Scheduled';

  const now = new Date().getTime();
  const arr = new Date(arrivalDate).getTime();
  const dep = new Date(departureDate).getTime();

  if (now > dep) {
    return 'Departed';
  } else if (now >= arr && now <= dep) {
    return 'Docked';
  } else {
    return 'Scheduled';
  }
};

// ============================================================================
// 3. SHIP VISITS SERVICE (/api/ship-visits)
// ============================================================================
export const shipVisitService = {
  getAll: async (): Promise<ShipVisit[]> => {
    if (isMockEnabled()) {
      const visits = mockStorage.getVisits();
      const ships = mockStorage.getShips();
      const ports = mockStorage.getPorts();
      return Promise.resolve(
        visits.map(v => ({
          ...v,
          status: computeVisitStatus(v.arrivalDate, v.departureDate, v.status),
          ship: ships.find(s => s.id === v.shipId),
          port: ports.find(p => p.id === v.portId),
        }))
      );
    }
    const res = await axiosInstance.get<ShipVisit[]>('/api/ship-visits');
    return res.data;
  },

  getPaged: async (params?: PaginationParams): Promise<PagedResult<ShipVisit>> => {
    if (isMockEnabled()) {
      const visits = mockStorage.getVisits();
      const ships = mockStorage.getShips();
      const ports = mockStorage.getPorts();
      let fullVisits = visits.map(v => ({
        ...v,
        status: computeVisitStatus(v.arrivalDate, v.departureDate, v.status),
        ship: ships.find(s => s.id === v.shipId),
        port: ports.find(p => p.id === v.portId),
      }));

      if (params?.status && params.status !== 'ALL') {
        fullVisits = fullVisits.filter(v => v.status === params.status);
      }

      return Promise.resolve(
        paginateList(fullVisits, params, (v, term) =>
          (v.ship?.name.toLowerCase() || '').includes(term) ||
          (v.port?.name.toLowerCase() || '').includes(term) ||
          (v.dockNumber?.toLowerCase() || '').includes(term)
        )
      );
    }
    const res = await axiosInstance.get<PagedResult<ShipVisit>>('/api/ship-visits/paged', { params });
    return res.data;
  },

  create: async (visit: Omit<ShipVisit, 'id'>): Promise<ShipVisit> => {
    // Business Rule: Geliş tarihi ayrılış tarihinden önce olmalı
    const arrTime = new Date(visit.arrivalDate).getTime();
    const depTime = new Date(visit.departureDate).getTime();
    if (isNaN(arrTime) || isNaN(depTime) || arrTime >= depTime) {
      throw new Error("Geliş tarihi ayrılış tarihinden önce olmalıdır!");
    }

    const calculatedStatus = computeVisitStatus(visit.arrivalDate, visit.departureDate, visit.status);
    const visitToSave = { ...visit, status: calculatedStatus };

    if (isMockEnabled()) {
      const visits = mockStorage.getVisits();
      const ships = mockStorage.getShips();
      const ports = mockStorage.getPorts();

      if (visitToSave.status !== 'Cancelled') {
        // 1. KURAL: Gemi Çift Rezervasyon (Işınlanma) Engeli
        const conflictingShipVisit = visits.find(v =>
          v.shipId === visitToSave.shipId &&
          v.status !== 'Cancelled' &&
          new Date(visitToSave.arrivalDate) < new Date(v.departureDate) &&
          new Date(visitToSave.departureDate) > new Date(v.arrivalDate)
        );

        if (conflictingShipVisit) {
          const ship = ships.find(s => s.id === visitToSave.shipId);
          const port = ports.find(p => p.id === conflictingShipVisit.portId);
          const shipName = ship ? ship.name : `Gemi #${visitToSave.shipId}`;
          const portName = port ? port.name : `Liman #${conflictingShipVisit.portId}`;
          throw new Error(
            `Gemi Çift Rezervasyon (Işınlanma) Engeli! '${shipName}' gemisi belirtilen tarihlerde zaten '${portName}' limanında aktif bir sefere sahiptir. Bir gemi aynı anda iki farklı yerde bulunamaz!`
          );
        }

        // 2. KURAL: Liman Eşzamanlı Kapasite Aşımı Kontrolü
        const port = ports.find(p => p.id === visitToSave.portId);
        if (port && port.capacity > 0) {
          const overlappingPortVisits = visits.filter(v =>
            v.portId === visitToSave.portId &&
            v.status !== 'Cancelled' &&
            new Date(visitToSave.arrivalDate) < new Date(v.departureDate) &&
            new Date(visitToSave.departureDate) > new Date(v.arrivalDate)
          );

          if (overlappingPortVisits.length >= port.capacity) {
            throw new Error(
              `Liman Rıhtım Kapasitesi Dolu! '${port.name}' limanının azami eşzamanlı yanaşma kapasitesi ${port.capacity} adettir. Belirtilen tarihlerde limanda zaten ${overlappingPortVisits.length} adet gemi bulunmaktadır. Yeni gemi kabul edilemez!`
            );
          }
        }
      }

      const newVisit: ShipVisit = {
        ...visitToSave,
        id: visits.length > 0 ? Math.max(...visits.map(v => v.id)) + 1 : 1,
      };
      mockStorage.saveVisits([...visits, newVisit]);
      return Promise.resolve(newVisit);
    }
    const res = await axiosInstance.post<ShipVisit>('/api/ship-visits', visitToSave);
    return res.data;
  },

  update: async (id: number, visit: Partial<ShipVisit>): Promise<ShipVisit> => {
    if (visit.arrivalDate && visit.departureDate) {
      if (new Date(visit.arrivalDate) >= new Date(visit.departureDate)) {
        throw new Error("Geliş tarihi ayrılış tarihinden önce olmalıdır!");
      }
    }

    if (isMockEnabled()) {
      const visits = mockStorage.getVisits();
      const existing = visits.find(v => v.id === id);
      if (!existing) throw new Error("Ziyaret bulunamadı");

      const targetShipId = visit.shipId ?? existing.shipId;
      const targetPortId = visit.portId ?? existing.portId;
      const targetArrival = visit.arrivalDate ?? existing.arrivalDate;
      const targetDeparture = visit.departureDate ?? existing.departureDate;
      const targetStatus = visit.status ?? existing.status;

      const ships = mockStorage.getShips();
      const ports = mockStorage.getPorts();

      if (targetStatus !== 'Cancelled') {
        // 1. KURAL: Gemi Çift Rezervasyon (Işınlanma) Engeli
        const conflictingShipVisit = visits.find(v =>
          v.id !== id &&
          v.shipId === targetShipId &&
          v.status !== 'Cancelled' &&
          new Date(targetArrival) < new Date(v.departureDate) &&
          new Date(targetDeparture) > new Date(v.arrivalDate)
        );

        if (conflictingShipVisit) {
          const ship = ships.find(s => s.id === targetShipId);
          const port = ports.find(p => p.id === conflictingShipVisit.portId);
          const shipName = ship ? ship.name : `Gemi #${targetShipId}`;
          const portName = port ? port.name : `Liman #${conflictingShipVisit.portId}`;
          throw new Error(
            `Gemi Çift Rezervasyon (Işınlanma) Engeli! '${shipName}' gemisi belirtilen tarihlerde zaten '${portName}' limanında aktif bir sefere sahiptir. Bir gemi aynı anda iki farklı yerde bulunamaz!`
          );
        }

        // 2. KURAL: Liman Eşzamanlı Kapasite Aşımı Kontrolü
        const port = ports.find(p => p.id === targetPortId);
        if (port && port.capacity > 0) {
          const overlappingPortVisits = visits.filter(v =>
            v.id !== id &&
            v.portId === targetPortId &&
            v.status !== 'Cancelled' &&
            new Date(targetArrival) < new Date(v.departureDate) &&
            new Date(targetDeparture) > new Date(v.arrivalDate)
          );

          if (overlappingPortVisits.length >= port.capacity) {
            throw new Error(
              `Liman Rıhtım Kapasitesi Dolu! '${port.name}' limanının azami eşzamanlı yanaşma kapasitesi ${port.capacity} adettir. Belirtilen tarihlerde limanda zaten ${overlappingPortVisits.length} adet gemi bulunmaktadır. Yeni gemi kabul edilemez!`
            );
          }
        }
      }

      const updated = visits.map(v => v.id === id ? { ...v, ...visit } : v);
      mockStorage.saveVisits(updated);
      const target = updated.find(v => v.id === id);
      return Promise.resolve(target!);
    }
    const res = await axiosInstance.put<ShipVisit>(`/api/ship-visits/${id}`, visit);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      mockStorage.saveVisits(mockStorage.getVisits().filter(v => v.id !== id));
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/ship-visits/${id}`);
  },

  getAvailableShips: async (departureDate: string, arrivalDate: string): Promise<AvailableShipDto[]> => {
    if (isMockEnabled()) {
      const ships = mockStorage.getShips();
      const visits = mockStorage.getVisits();
      const ports = mockStorage.getPorts();
      const depTime = new Date(departureDate).getTime();
      const arrTime = new Date(arrivalDate).getTime();

      return ships.map((ship) => {
        const conflict = visits.find((v) =>
          v.shipId === ship.id &&
          v.status !== 'Cancelled' &&
          new Date(v.arrivalDate).getTime() < depTime &&
          new Date(v.departureDate).getTime() > arrTime
        );
        const lastVisit = visits
          .filter((v) => v.shipId === ship.id && v.status !== 'Cancelled')
          .sort((a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime())[0];
        const port = conflict ? ports.find((p) => p.id === conflict.portId) : (lastVisit ? ports.find((p) => p.id === lastVisit.portId) : null);

        return {
          shipId: ship.id,
          name: ship.name,
          imoNumber: ship.imoNumber,
          flag: ship.flag,
          type: ship.type,
          deadweightTonnage: ship.deadweightTonnage,
          isAvailable: !conflict,
          currentStatus: conflict ? `${port?.name || 'Liman'} aktif seferinde` : 'Müsait (Boşta)',
          lastKnownPortName: port?.name || 'Açık Deniz',
        };
      });
    }
    const res = await axiosInstance.get<AvailableShipDto[]>('/api/ship-visits/available-ships', {
      params: { departureDate, arrivalDate },
    });
    return res.data;
  },

  getAvailableCrew: async (departureDate: string, arrivalDate: string, role?: string): Promise<AvailableCrewDto[]> => {
    if (isMockEnabled()) {
      const crew: CrewMember[] = mockStorage.getCrew();
      const assignments = mockStorage.getAssignments();
      const ships = mockStorage.getShips();
      const depTime = new Date(departureDate).getTime();
      const arrTime = new Date(arrivalDate).getTime();

      let filtered = crew;
      if (role) {
        filtered = filtered.filter((c: CrewMember) => c.role.toLowerCase().includes(role.toLowerCase()));
      }

      return filtered.map((c: CrewMember) => {
        const conflict = assignments.find((a) =>
          a.crewMemberId === c.id &&
          new Date(a.startDate).getTime() < arrTime &&
          (!a.endDate || new Date(a.endDate).getTime() > depTime)
        );
        const ship = conflict ? ships.find((s) => s.id === conflict.shipId) : null;
        return {
          crewId: c.id,
          fullName: c.fullName || `${c.firstName} ${c.lastName}`,
          role: c.role,
          nationality: c.nationality,
          email: c.email,
          phone: c.phone,
          isAvailable: !conflict,
          conflictDescription: conflict ? `${ship?.name || 'Gemi'} üzerinde görevli` : undefined,
        };
      });
    }
    const res = await axiosInstance.get<AvailableCrewDto[]>('/api/ship-visits/available-crew', {
      params: { departureDate, arrivalDate, role },
    });
    return res.data;
  },

  validateSafeManning: async (shipId: number, crewMemberIds: number[]): Promise<SafeManningValidationResult> => {
    if (isMockEnabled()) {
      const allCrew: CrewMember[] = mockStorage.getCrew();
      const members = allCrew.filter((c: CrewMember) => crewMemberIds.includes(c.id));
      const hasMaster = members.some((m: CrewMember) => /kaptan|master|captain/i.test(m.role));
      const hasChiefEngineer = members.some((m: CrewMember) => /mühendis|çarkçı|engineer/i.test(m.role));
      const warnings: string[] = [];
      const errors: string[] = [];

      if (!hasMaster) errors.push('Eksik Kilit Personel: Gemide atanmış Kaptan (Master) bulunmuyor!');
      if (!hasChiefEngineer) warnings.push('Eksik Teknik Personel: Gemide Başmühendis / Çarkçıbaşı (Chief Engineer) seçilmedi.');
      if (members.length < 3) warnings.push(`Asgari Donatım Tavsiyesi: Toplam ${members.length} personel seçildi. Uluslararası standartlarda emniyetli seyir için asgari 3 personel önerilir.`);

      return {
        isCompliant: hasMaster,
        hasMaster,
        hasChiefEngineer,
        totalCrewCount: members.length,
        warnings,
        errors,
      };
    }
    const res = await axiosInstance.post<SafeManningValidationResult>('/api/ship-visits/validate-safe-manning', {
      shipId,
      crewMemberIds,
    });
    return res.data;
  },

  dispatchVoyage: async (request: DispatchVoyageRequest): Promise<DispatchVoyageResponse> => {
    if (isMockEnabled()) {
      const visit = await shipVisitService.create({
        shipId: request.shipId,
        originPortId: request.originPortId,
        portId: request.destinationPortId,
        arrivalDate: request.departureDate,
        departureDate: request.arrivalDate,
        purpose: request.purpose || 'Ticari Sefer',
        dockNumber: request.dockNumber,
        status: 'Scheduled',
      });

      for (const crewId of request.crewMemberIds) {
        const crew = mockStorage.getCrew().find((c) => c.id === crewId);
        try {
          await assignmentService.create({
            shipId: request.shipId,
            crewMemberId: crewId,
            startDate: request.departureDate,
            endDate: request.arrivalDate,
            roleOnShip: crew?.role || 'Personel',
          });
        } catch {
          // ignore assignment conflicts in mock mode
        }
      }

      const manning = await shipVisitService.validateSafeManning(request.shipId, request.crewMemberIds);
      return {
        success: true,
        message: 'Sefer başarıyla planlandı ve mürettebat atamaları tamamlandı.',
        visit,
        manningStatus: manning,
      };
    }
    const res = await axiosInstance.post<DispatchVoyageResponse>('/api/ship-visits/dispatch', request);
    return res.data;
  },
};

// ============================================================================
// 4. CARGOES SERVICE (/api/cargoes)
// ============================================================================
export const cargoService = {
  getAll: async (): Promise<Cargo[]> => {
    if (isMockEnabled()) {
      const cargoes = mockStorage.getCargoes();
      const ships = mockStorage.getShips();
      return Promise.resolve(
        cargoes.map(c => ({
          ...c,
          ship: ships.find(s => s.id === c.shipId),
        }))
      );
    }
    const res = await axiosInstance.get<Cargo[]>('/api/cargoes');
    return res.data;
  },

  getPaged: async (params?: PaginationParams): Promise<PagedResult<Cargo>> => {
    if (isMockEnabled()) {
      const cargoes = mockStorage.getCargoes();
      const ships = mockStorage.getShips();
      let fullCargoes = cargoes.map(c => ({
        ...c,
        ship: ships.find(s => s.id === c.shipId),
      }));

      if (params?.type && params.type !== 'ALL') {
        fullCargoes = fullCargoes.filter(c => c.type === params.type);
      }

      return Promise.resolve(
        paginateList(fullCargoes, params, (c, term) =>
          c.description.toLowerCase().includes(term) ||
          (c.ship?.name.toLowerCase() || '').includes(term) ||
          c.type.toLowerCase().includes(term)
        )
      );
    }
    const res = await axiosInstance.get<PagedResult<Cargo>>('/api/cargoes/paged', { params });
    return res.data;
  },

  create: async (cargo: Omit<Cargo, 'id'>): Promise<Cargo> => {
    // Business Rule: Yük ağırlığı 0'dan büyük olmalı
    if (cargo.weightTons <= 0) {
      throw new Error("Yük ağırlığı 0'dan büyük olmalıdır!");
    }

    if (isMockEnabled()) {
      const cargoes = mockStorage.getCargoes();
      const ships = mockStorage.getShips();
      const ship = ships.find(s => s.id === cargo.shipId);
      if (ship) {
        const otherCargoesWeight = cargoes
          .filter(c => c.shipId === cargo.shipId)
          .reduce((sum, c) => sum + (c.weightTons || 0), 0);
        const remainingCapacity = ship.deadweightTonnage - otherCargoesWeight;
        if (otherCargoesWeight + cargo.weightTons > ship.deadweightTonnage) {
          throw new Error(
            `Kapasite Aşımı! '${ship.name}' gemisinin azami DWT kapasitesi: ${ship.deadweightTonnage.toLocaleString()} Ton. ` +
            `Mevcut Yük: ${otherCargoesWeight.toLocaleString()} Ton, Kalan Boş Kapasite: ${Math.max(0, remainingCapacity).toLocaleString()} Ton. ` +
            `Eklenmek istenen (${cargo.weightTons.toLocaleString()} Ton) gemi sınırını aşıyor!`
          );
        }
      }

      const newCargo: Cargo = {
        ...cargo,
        id: cargoes.length > 0 ? Math.max(...cargoes.map(c => c.id)) + 1 : 1,
      };
      mockStorage.saveCargoes([...cargoes, newCargo]);
      return Promise.resolve(newCargo);
    }
    const res = await axiosInstance.post<Cargo>('/api/cargoes', cargo);
    return res.data;
  },

  update: async (id: number, cargo: Partial<Cargo>): Promise<Cargo> => {
    if (cargo.weightTons !== undefined && cargo.weightTons <= 0) {
      throw new Error("Yük ağırlığı 0'dan büyük olmalıdır!");
    }

    if (isMockEnabled()) {
      const cargoes = mockStorage.getCargoes();
      const existing = cargoes.find(c => c.id === id);
      if (!existing) throw new Error("Yük kaydı bulunamadı");
      const targetShipId = cargo.shipId ?? existing.shipId;
      const targetWeight = cargo.weightTons ?? existing.weightTons;
      const ships = mockStorage.getShips();
      const ship = ships.find(s => s.id === targetShipId);
      if (ship) {
        const otherCargoesWeight = cargoes
          .filter(c => c.shipId === targetShipId && c.id !== id)
          .reduce((sum, c) => sum + (c.weightTons || 0), 0);
        const remainingCapacity = ship.deadweightTonnage - otherCargoesWeight;
        if (otherCargoesWeight + targetWeight > ship.deadweightTonnage) {
          throw new Error(
            `Kapasite Aşımı! '${ship.name}' gemisinin azami DWT kapasitesi: ${ship.deadweightTonnage.toLocaleString()} Ton. ` +
            `Kalan Boş Kapasite: ${Math.max(0, remainingCapacity).toLocaleString()} Ton. ` +
            `Güncellenen yük (${targetWeight.toLocaleString()} Ton) gemi sınırını aşıyor!`
          );
        }
      }

      const updated = cargoes.map(c => c.id === id ? { ...c, ...cargo } : c);
      mockStorage.saveCargoes(updated);
      const target = updated.find(c => c.id === id);
      if (!target) throw new Error("Yük kaydı bulunamadı");
      return Promise.resolve(target);
    }
    const res = await axiosInstance.put<Cargo>(`/api/cargoes/${id}`, cargo);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      mockStorage.saveCargoes(mockStorage.getCargoes().filter(c => c.id !== id));
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/cargoes/${id}`);
  },
};

// ============================================================================
// 5. CREW MEMBERS SERVICE (/api/crew-members)
// ============================================================================
export const crewMemberService = {
  getAll: async (): Promise<CrewMember[]> => {
    if (isMockEnabled()) return Promise.resolve(mockStorage.getCrew());
    const res = await axiosInstance.get<CrewMember[]>('/api/crew-members');
    return res.data;
  },

  getPaged: async (params?: PaginationParams): Promise<PagedResult<CrewMember>> => {
    if (isMockEnabled()) {
      const crew = mockStorage.getCrew();
      return Promise.resolve(
        paginateList(crew, params, (c, term) =>
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          (c.fullName?.toLowerCase() || '').includes(term) ||
          c.role.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.nationality.toLowerCase().includes(term)
        )
      );
    }
    const res = await axiosInstance.get<PagedResult<CrewMember>>('/api/crew-members/paged', { params });
    return res.data;
  },

  create: async (crew: Omit<CrewMember, 'id'>): Promise<CrewMember> => {
    if (!crew.firstName || !crew.firstName.trim()) {
      throw new Error("Ad (First Name) alanı zorunludur!");
    }
    if (!crew.lastName || !crew.lastName.trim()) {
      throw new Error("Soyad (Last Name) alanı zorunludur!");
    }
    // E-posta ve telefon doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(crew.email)) {
      throw new Error("Geçerli bir e-posta adresi giriniz!");
    }
    if (!crew.phone || crew.phone.trim().length < 7) {
      throw new Error("Geçerli bir telefon numarası giriniz!");
    }

    const payload = {
      ...crew,
      fullName: crew.fullName || `${crew.firstName} ${crew.lastName}`.trim(),
    };

    if (isMockEnabled()) {
      const members = mockStorage.getCrew();
      const newMember: CrewMember = {
        ...payload,
        id: members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1,
      };
      mockStorage.saveCrew([...members, newMember]);
      return Promise.resolve(newMember);
    }
    const res = await axiosInstance.post<CrewMember>('/api/crew-members', payload);
    return res.data;
  },

  update: async (id: number, crew: Partial<CrewMember>): Promise<CrewMember> => {
    if (crew.firstName !== undefined && !crew.firstName.trim()) {
      throw new Error("Ad (First Name) alanı zorunludur!");
    }
    if (crew.lastName !== undefined && !crew.lastName.trim()) {
      throw new Error("Soyad (Last Name) alanı zorunludur!");
    }
    if (crew.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(crew.email)) throw new Error("Geçerli bir e-posta adresi giriniz!");
    }
    if (crew.phone && crew.phone.trim().length < 7) {
      throw new Error("Geçerli bir telefon numarası giriniz!");
    }

    if (isMockEnabled()) {
      const members = mockStorage.getCrew();
      const existing = members.find(m => m.id === id);
      const updatedFn = crew.firstName ?? existing?.firstName ?? '';
      const updatedLn = crew.lastName ?? existing?.lastName ?? '';
      const updated = members.map(m => m.id === id ? { 
        ...m, 
        ...crew,
        fullName: `${updatedFn} ${updatedLn}`.trim()
      } : m);
      mockStorage.saveCrew(updated);
      const target = updated.find(m => m.id === id);
      if (!target) throw new Error("Mürettebat üyesi bulunamadı");
      return Promise.resolve(target);
    }
    const res = await axiosInstance.put<CrewMember>(`/api/crew-members/${id}`, crew);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      mockStorage.saveCrew(mockStorage.getCrew().filter(m => m.id !== id));
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/crew-members/${id}`);
  },
};

// ============================================================================
// 6. SHIP-CREW ASSIGNMENTS SERVICE (/api/ship-crew-assignments)
// ============================================================================
export const assignmentService = {
  getAll: async (): Promise<ShipCrewAssignment[]> => {
    if (isMockEnabled()) {
      const assignments = mockStorage.getAssignments();
      const ships = mockStorage.getShips();
      const crew = mockStorage.getCrew();
      return Promise.resolve(
        assignments.map(a => ({
          ...a,
          ship: ships.find(s => s.id === a.shipId),
          crewMember: crew.find(c => c.id === a.crewMemberId),
        }))
      );
    }
    const res = await axiosInstance.get<ShipCrewAssignment[]>('/api/ship-crew-assignments');
    return res.data;
  },

  create: async (item: Omit<ShipCrewAssignment, 'id'>): Promise<ShipCrewAssignment> => {
    if (isMockEnabled()) {
      const assignments = mockStorage.getAssignments();
      const ships = mockStorage.getShips();
      const crew = mockStorage.getCrew();

      const newStart = new Date(item.startDate).getTime();
      const newEnd = item.endDate ? new Date(item.endDate).getTime() : Infinity;

      if (newEnd < newStart) {
        throw new Error("Görev bitiş tarihi başlangıç tarihinden önce olamaz.");
      }

      const conflict = assignments.find(a => {
        if (a.crewMemberId !== item.crewMemberId) return false;
        const exStart = new Date(a.startDate).getTime();
        const exEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        return (newEnd >= exStart) && (exEnd >= newStart);
      });

      if (conflict) {
        const conflictShip = ships.find(s => s.id === conflict.shipId)?.name || `Gemi #${conflict.shipId}`;
        const crewMember = crew.find(c => c.id === item.crewMemberId);
        const crewName = crewMember?.fullName || `${crewMember?.firstName || ''} ${crewMember?.lastName || ''}`.trim() || `Personel #${item.crewMemberId}`;
        const conflictStartStr = new Date(conflict.startDate).toLocaleDateString('tr-TR');
        const conflictEndStr = conflict.endDate ? new Date(conflict.endDate).toLocaleDateString('tr-TR') : 'Devam Ediyor';

        if (conflict.shipId !== item.shipId) {
          throw new Error(
            `Çift Gemi Ataması Engeli: '${crewName}' adlı personel ${conflictStartStr} - ${conflictEndStr} tarihleri arasında zaten '${conflictShip}' gemisinde görev yapmaktadır! Bir personel aynı anda birden fazla gemide görev alamaz.`
          );
        } else {
          throw new Error(
            `Mükerrer Görev Engeli: '${crewName}' adlı personelin '${conflictShip}' gemisinde ${conflictStartStr} - ${conflictEndStr} tarihleri arasında zaten aktif bir görevi bulunmaktadır! Çakışan tarihlerde mükerrer görev atanamaz.`
          );
        }
      }

      const newAssignment: ShipCrewAssignment = {
        ...item,
        id: assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1,
      };
      mockStorage.saveAssignments([...assignments, newAssignment]);
      return Promise.resolve(newAssignment);
    }

    const res = await axiosInstance.post<ShipCrewAssignment>('/api/ship-crew-assignments', item);
    return res.data;
  },

  update: async (id: number, item: Partial<ShipCrewAssignment>): Promise<ShipCrewAssignment> => {
    if (isMockEnabled()) {
      const assignments = mockStorage.getAssignments();
      const existing = assignments.find(a => a.id === id);
      if (!existing) throw new Error("Atama bulunamadı");
      const updated = assignments.map(a => a.id === id ? { ...a, ...item } : a);
      mockStorage.saveAssignments(updated);
      return Promise.resolve(updated.find(a => a.id === id)!);
    }
    const res = await axiosInstance.put<ShipCrewAssignment>(`/api/ship-crew-assignments/${id}`, item);
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    if (isMockEnabled()) {
      mockStorage.saveAssignments(mockStorage.getAssignments().filter(a => a.id !== id));
      return Promise.resolve();
    }
    await axiosInstance.delete(`/api/ship-crew-assignments/${id}`);
  },
};

export interface OperationReportItem {
  visitId: number;
  shipName: string;
  portName: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  cargoCount: number;
  totalCargoWeightTons: number;
  crewCount: number;
}

export interface OperationReportResponse {
  items: OperationReportItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  queryCount: number;
  executionTimeMs: number;
  approach: string;
}

export interface PerformanceComparisonResult {
  totalRecordsAnalyzed: number;
  inefficientNPlusOne: {
    sqlQueryCount: number;
    executionTimeMs: number;
    memoryUsage: string;
    description: string;
  };
  optimizedSingleQuery: {
    sqlQueryCount: number;
    executionTimeMs: number;
    memoryUsage: string;
    description: string;
  };
  speedupFactor: number;
  queryReductionPercentage: number;
  analysisSummary: string;
}

export interface DatabaseStats {
  shipCount: number;
  portCount: number;
  visitCount: number;
  cargoCount: number;
  crewCount: number;
  assignmentCount: number;
  checkedAt: string;
}

export const reportService = {
  getInefficientReport: async (pageNumber = 1, pageSize = 20): Promise<OperationReportResponse> => {
    if (isMockEnabled()) {
      return getMockOperationReport(pageNumber, pageSize, false);
    }
    try {
      const res = await axiosInstance.get<OperationReportResponse>(
        `/api/reports/operation-summary-inefficient?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return res.data;
    } catch {
      return getMockOperationReport(pageNumber, pageSize, false);
    }
  },
  getOptimizedReport: async (pageNumber = 1, pageSize = 20): Promise<OperationReportResponse> => {
    if (isMockEnabled()) {
      return getMockOperationReport(pageNumber, pageSize, true);
    }
    try {
      const res = await axiosInstance.get<OperationReportResponse>(
        `/api/reports/operation-summary-optimized?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
      return res.data;
    } catch {
      return getMockOperationReport(pageNumber, pageSize, true);
    }
  },
  getPerformanceComparison: async (sampleSize = 50): Promise<PerformanceComparisonResult> => {
    if (isMockEnabled()) {
      return getMockPerformanceComparison(sampleSize);
    }
    try {
      const res = await axiosInstance.get<PerformanceComparisonResult>(
        `/api/reports/performance-comparison?sampleSize=${sampleSize}`,
        { timeout: 60000 }
      );
      return res.data;
    } catch {
      return getMockPerformanceComparison(sampleSize);
    }
  },
  getDashboardCharts: async (): Promise<DashboardChartsData> => {
    if (isMockEnabled()) {
      return getMockDashboardCharts();
    }
    try {
      const res = await axiosInstance.get<DashboardChartsData>('/api/reports/dashboard-charts');
      return res.data;
    } catch {
      return getMockDashboardCharts();
    }
  },
};

// Fallback generator for mock mode or offline mode
function getMockDashboardCharts(): DashboardChartsData {
  const ships = mockStorage.getShips();
  const ports = mockStorage.getPorts();
  const visits = mockStorage.getVisits();
  const cargoes = mockStorage.getCargoes();
  const crew = mockStorage.getCrew();
  const assignments = mockStorage.getAssignments();

  // Ship types
  const typeMap: Record<string, number> = {};
  ships.forEach((s) => {
    typeMap[s.type] = (typeMap[s.type] || 0) + 1;
  });
  const shipTypeDistribution: ShipTypeDistributionItem[] = Object.entries(typeMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Monthly visits (last 6 months)
  const monthMap: Record<string, { scheduled: number; docked: number; departed: number; cancelled: number }> = {};
  visits.forEach((v) => {
    const m = (v.arrivalDate || '').substring(0, 7) || '2026-03';
    if (!monthMap[m]) monthMap[m] = { scheduled: 0, docked: 0, departed: 0, cancelled: 0 };
    if (v.status === 'Scheduled') monthMap[m].scheduled++;
    else if (v.status === 'Docked') monthMap[m].docked++;
    else if (v.status === 'Departed') monthMap[m].departed++;
    else if (v.status === 'Cancelled') monthMap[m].cancelled++;
  });
  const monthlyVisits: MonthlyVisitItem[] = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([month, stats]) => ({
      month,
      ...stats,
    }));

  // Cargo types
  const cargoMap: Record<string, { count: number; totalWeightTons: number }> = {};
  cargoes.forEach((c) => {
    if (!cargoMap[c.type]) cargoMap[c.type] = { count: 0, totalWeightTons: 0 };
    cargoMap[c.type].count++;
    cargoMap[c.type].totalWeightTons += Number(c.weightTons) || 0;
  });
  const cargoTypeBreakdown: CargoTypeBreakdownItem[] = Object.entries(cargoMap).map(([type, stats]) => ({
    type,
    count: stats.count,
    totalWeightTons: Math.round(stats.totalWeightTons),
  }));

  // Port occupancy
  const topPortOccupancy: PortOccupancyItem[] = ports.slice(0, 8).map((p) => {
    const docked = visits.filter((v) => v.portId === p.id && v.status === 'Docked').length;
    const cap = p.capacity || 5;
    return {
      portName: p.name,
      dockedCount: docked,
      capacity: cap,
      occupancyPercent: Math.round((docked / cap) * 100),
    };
  });

  const activeVoyages = visits.filter((v) => v.status === 'Docked' || v.status === 'Scheduled').length;
  const dockedShips = visits.filter((v) => v.status === 'Docked').length;
  const totalCargoTons = cargoes.reduce((sum, c) => sum + (Number(c.weightTons) || 0), 0);
  const assignedCrew = assignments.filter((a) => !a.endDate || new Date(a.endDate) > new Date()).length;

  return {
    shipTypeDistribution,
    monthlyVisits,
    cargoTypeBreakdown,
    topPortOccupancy,
    fleet: {
      totalShips: ships.length,
      activeVoyages,
      dockedShips,
      totalCargoTons: Math.round(totalCargoTons),
      totalCrew: crew.length,
      assignedCrew,
    },
  };
}

function getMockOperationReport(pageNumber: number, pageSize: number, isOptimized: boolean): OperationReportResponse {
  const visits = mockStorage.getVisits();
  const ships = mockStorage.getShips();
  const ports = mockStorage.getPorts();
  const cargoes = mockStorage.getCargoes();
  const assignments = mockStorage.getAssignments();

  const start = (pageNumber - 1) * pageSize;
  const paged = visits.slice(start, start + pageSize);

  const items: OperationReportItem[] = paged.map((v) => {
    const s = ships.find((x) => x.id === v.shipId);
    const p = ports.find((x) => x.id === v.portId);
    const c = cargoes.filter((x) => x.shipId === v.shipId);
    const a = assignments.filter((x) => x.shipId === v.shipId);
    return {
      visitId: v.id,
      shipName: s?.name || `Gemi #${v.shipId}`,
      portName: p?.name || `Liman #${v.portId}`,
      arrivalDate: v.arrivalDate,
      departureDate: v.departureDate,
      status: v.status,
      cargoCount: c.length,
      totalCargoWeightTons: c.reduce((sum, x) => sum + (Number(x.weightTons) || 0), 0),
      crewCount: a.length,
    };
  });

  const queryCount = isOptimized ? 2 : 1 + (items.length * 4);
  const executionTimeMs = isOptimized ? 14.5 : Math.round(items.length * 6.8);

  return {
    items,
    totalCount: visits.length,
    pageNumber,
    pageSize,
    queryCount,
    executionTimeMs,
    approach: isOptimized
      ? 'Optimized (AsNoTracking + DTO Projection + Subquery Aggregation)'
      : 'Inefficient N+1 (Her kayıt için 4 ayrı SQL sorgusu)',
  };
}

function getMockPerformanceComparison(sampleSize: number): PerformanceComparisonResult {
  const queryCountSlow = 1 + (sampleSize * 4);
  const timeSlow = Math.round(sampleSize * 7.2);
  const queryCountFast = 2;
  const timeFast = Math.round(timeSlow / 18.5);

  return {
    totalRecordsAnalyzed: sampleSize,
    inefficientNPlusOne: {
      sqlQueryCount: queryCountSlow,
      executionTimeMs: timeSlow,
      memoryUsage: 'Aktif (ChangeTracker)',
      description: 'Döngü içi ilişkisel yükleme (N+1)',
    },
    optimizedSingleQuery: {
      sqlQueryCount: queryCountFast,
      executionTimeMs: timeFast,
      memoryUsage: 'Devre Dışı (AsNoTracking)',
      description: 'Tekil SQL projeksiyonu ve alt sorgu toplamları',
    },
    speedupFactor: Math.round((timeSlow / Math.max(timeFast, 1)) * 10) / 10,
    queryReductionPercentage: Math.round(((queryCountSlow - queryCountFast) / queryCountSlow) * 1000) / 10,
    analysisSummary: '',
  };
}

// Dashboard chart data types
export interface ShipTypeDistributionItem {
  type: string;
  count: number;
}

export interface MonthlyVisitItem {
  month: string;
  scheduled: number;
  docked: number;
  departed: number;
  cancelled: number;
}

export interface CargoTypeBreakdownItem {
  type: string;
  count: number;
  totalWeightTons: number;
}

export interface PortOccupancyItem {
  portName: string;
  dockedCount: number;
  capacity: number;
  occupancyPercent: number;
}

export interface FleetSummary {
  totalShips: number;
  activeVoyages: number;
  dockedShips: number;
  totalCargoTons: number;
  totalCrew: number;
  assignedCrew: number;
}

export interface DashboardChartsData {
  shipTypeDistribution: ShipTypeDistributionItem[];
  monthlyVisits: MonthlyVisitItem[];
  cargoTypeBreakdown: CargoTypeBreakdownItem[];
  topPortOccupancy: PortOccupancyItem[];
  fleet: FleetSummary;
}

export const dataSeedService = {
  getStats: async (): Promise<DatabaseStats> => {
    const res = await axiosInstance.get<DatabaseStats>('/api/test-data/stats');
    return res.data;
  },
  generateMassData: async (ships = 1000, ports = 100, visits = 5000, cargo = 10000, crew = 5000, assignments = 15000) => {
    const res = await axiosInstance.post('/api/test-data/generate-mass-data', null, {
      params: { ships, ports, visits, cargo, crew, assignments },
      timeout: 180000,
    });
    return res.data;
  },
  resetToInitial: async () => {
    const res = await axiosInstance.post('/api/test-data/reset-to-initial', null, {
      timeout: 60000,
    });
    return res.data;
  },
};

// ============================================================================
// OWASP TOP 10 & GÜVENLİK LABORATUVARI (SECURITY LAB)
// ============================================================================

export interface SecurityScenarioResult {
  scenarioId: number;
  scenarioName: string;
  mode: 'VULNERABLE' | 'SECURE';
  isVulnerabilityExploited: boolean;
  description: string;
  attackPayload: string;
  resultMessage: string;
  data?: any;
  mitigationExplanation: string;
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  userId?: string;
  username?: string;
  userRole?: string;
  action: string;
  entityName: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  isSuccess: boolean;
  severity?: string;
}

export interface AuditLogsResponse {
  items: AuditLogItem[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 101,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    username: 'admin',
    userRole: 'Admin',
    action: 'LOGIN_SUCCESS',
    entityName: 'Auth',
    entityId: '1',
    ipAddress: '192.168.1.10',
    details: 'Yönetici güvenli giriş yaptı. JWT Access & Refresh token üretildi.',
    isSuccess: true,
    severity: 'INFO',
  },
  {
    id: 102,
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    username: 'portmanager',
    userRole: 'PortManager',
    action: 'IDOR_ATTEMPT_BLOCKED',
    entityName: 'Port',
    entityId: '2',
    ipAddress: '192.168.1.45',
    details: 'IDOR Girişimi Engellendi! Kullanıcı yetki alanı (Liman 1) dışındaki Liman 2 verisine erişmeye çalıştı.',
    isSuccess: false,
    severity: 'CRITICAL',
  },
  {
    id: 103,
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    username: 'Anonymous',
    userRole: 'None',
    action: 'SQLI_DETECTED_BLOCKED',
    entityName: 'Ship',
    entityId: '0',
    ipAddress: '88.241.15.90',
    details: 'Arama kutusuna SQLi payload (" OR 1=1) enjekte edildi. Parametreli LINQ koruması ile düz metin olarak arandı.',
    isSuccess: false,
    severity: 'WARNING',
  },
  {
    id: 104,
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    username: 'operator',
    userRole: 'Operator',
    action: 'FILE_UPLOAD_BLOCKED',
    entityName: 'Documents',
    entityId: 'exploit.exe',
    ipAddress: '192.168.1.22',
    details: 'Güvensiz dosya uzantısı (.exe) tespit edildi ve sunucuya yazılmadan reddedildi.',
    isSuccess: false,
    severity: 'CRITICAL',
  },
  {
    id: 105,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    username: 'Anonymous',
    userRole: 'None',
    action: 'RATE_LIMIT_EXCEEDED',
    entityName: 'Ships',
    entityId: 'DoS',
    ipAddress: '104.28.19.4',
    details: 'IP adresinden 10 saniyede 18 istek gönderildi. 429 Too Many Requests ile geçici olarak engellendi.',
    isSuccess: false,
    severity: 'WARNING',
  },
];

export interface SecurityAuditExecutionResult {
  scenarioId: number;
  scenarioName: string;
  mode: 'VULNERABLE' | 'SECURE';
  isVulnerabilityExploited: boolean;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  requestUrl: string;
  requestMethod: string;
  requestPayload?: any;
  responseHeaders: Record<string, string>;
  securityHeadersCheck: {
    csp: string | null;
    xFrameOptions: string | null;
    xContentTypeOptions: string | null;
    xssProtection: string | null;
  };
  resultMessage: string;
  description: string;
  mitigationExplanation: string;
  data: any;
  rawResponse: any;
}

export const securityLabService = {
  testScenario: async (
    scenarioId: number,
    mode: 'vulnerable' | 'secure',
    customPayload?: any
  ): Promise<SecurityAuditExecutionResult> => {
    const isVuln = mode === 'vulnerable';
    const token = localStorage.getItem('liman_token');

    let endpoint = '';
    let method = 'GET';
    let body: any = null;
    let headers: Record<string, string> = {};

    if (!isVuln && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    switch (scenarioId) {
      case 1:
        endpoint = `/api/security-demo/access-control/${mode}`;
        break;
      case 2: {
        const portId = customPayload !== undefined && customPayload !== null && !isNaN(Number(customPayload))
          ? Number(customPayload)
          : (isVuln ? 1 : 2); // Secure modda portmanager için Port 2 yetkisiz erişim simüle edilir
        endpoint = `/api/security-demo/idor/${mode}/${portId}`;
        break;
      }
      case 3: {
        const searchTerm = customPayload ? String(customPayload) : "' OR '1'='1";
        endpoint = `/api/security-demo/sqli/${mode}?searchTerm=${encodeURIComponent(searchTerm)}`;
        break;
      }
      case 4:
        endpoint = `/api/security-demo/sensitive-data/${mode}`;
        break;
      case 5: {
        endpoint = `/api/security-demo/mass-assignment/${mode}`;
        method = 'POST';
        headers['Content-Type'] = 'application/json';
        const massData = typeof customPayload === 'object' && customPayload !== null
          ? customPayload
          : { username: 'denetim_kullanici', email: 'audit@liman.gov.tr', password: 'Password123!', role: 'Admin', isAdmin: true };
        body = JSON.stringify(massData);
        break;
      }
      case 6:
        endpoint = `/api/security-demo/broken-auth/${mode}`;
        break;
      case 7:
        endpoint = `/api/security-demo/error-handling/${mode}`;
        break;
      case 8: {
        endpoint = `/api/security-demo/file-upload/${mode}`;
        method = 'POST';
        const fileName = customPayload ? String(customPayload) : (isVuln ? 'exploit_shell.php' : 'guvenli_evrak.exe');
        const formData = new FormData();
        formData.append('file', new Blob(['ISPS Guvenlik Belgesi Icerigi'], { type: 'application/octet-stream' }), fileName);
        body = formData;
        break;
      }
      case 9: {
        endpoint = `/api/security-demo/xss/${mode}`;
        method = 'POST';
        headers['Content-Type'] = 'application/json';
        const desc = customPayload ? String(customPayload) : "<script>alert('XSS Saldırısı!')</script>";
        body = JSON.stringify({ shipName: 'Test Gemi', description: desc });
        break;
      }
      case 10: {
        const pageSize = customPayload && !isNaN(Number(customPayload)) ? Number(customPayload) : 1000000;
        endpoint = `/api/security-demo/dos/${mode}?pageSize=${pageSize}`;
        break;
      }
      default:
        endpoint = `/api/security-demo/access-control/${mode}`;
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    const startTime = performance.now();

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const respHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        respHeaders[key.toLowerCase()] = val;
      });

      let json: any = null;
      try {
        json = await response.json();
      } catch {
        json = { rawText: 'Yanıt metni okunamadı veya gövde boş.' };
      }

      const securityHeadersCheck = {
        csp: response.headers.get('content-security-policy'),
        xFrameOptions: response.headers.get('x-frame-options'),
        xContentTypeOptions: response.headers.get('x-content-type-options'),
        xssProtection: response.headers.get('x-xss-protection'),
      };

      const scenarioName = json?.scenarioName || `Güvenlik Politikası #${scenarioId}`;
      const isExploited = json?.isVulnerabilityExploited ?? isVuln;
      const resultMessage = json?.resultMessage || (response.status === 401
        ? '401 Unauthorized: Rol veya oturum doğrulaması eksik olduğu için korundu.'
        : response.status === 403
        ? '403 Forbidden: Kaynak sahipliği (IDOR / Rol) doğrulaması ile engellendi.'
        : response.status === 429
        ? '429 Too Many Requests: Trafik hız sınırı devrede, aşırı istek engellendi.'
        : `HTTP ${response.status} ${response.statusText}`);

      const description = json?.description || (response.ok ? 'Politika kuralı sunucuda başarıyla işletildi.' : 'Sunucu güvenlik katmanı isteğe müdahale etti.');
      const mitigationExplanation = json?.mitigationExplanation || 'Savunma politikası aktif denetim altında.';

      return {
        scenarioId,
        scenarioName,
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isExploited,
        statusCode: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Handled'),
        latencyMs,
        requestUrl: endpoint,
        requestMethod: method,
        requestPayload: body instanceof FormData ? 'Multipart Form Data (File)' : (body || null),
        responseHeaders: respHeaders,
        securityHeadersCheck,
        resultMessage,
        description,
        mitigationExplanation,
        data: json?.data !== undefined ? json.data : json,
        rawResponse: json,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const mock = getMockScenarioResult(scenarioId, mode, customPayload);
      return {
        scenarioId,
        scenarioName: mock.scenarioName,
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: mock.isVulnerabilityExploited,
        statusCode: isVuln ? 200 : 403,
        statusText: isVuln ? 'OK (Simulated)' : 'Forbidden (Simulated)',
        latencyMs,
        requestUrl: endpoint,
        requestMethod: method,
        requestPayload: body,
        responseHeaders: { 'x-simulation': 'true' },
        securityHeadersCheck: {
          csp: "default-src 'self'",
          xFrameOptions: 'DENY',
          xContentTypeOptions: 'nosniff',
          xssProtection: '1; mode=block',
        },
        resultMessage: mock.resultMessage,
        description: mock.description,
        mitigationExplanation: mock.mitigationExplanation,
        data: mock.data,
        rawResponse: mock,
      };
    }
  },

  getAuditLogs: async (
    pageNumber = 1,
    pageSize = 30,
    action?: string,
    severity?: string
  ): Promise<AuditLogsResponse> => {
    try {
      const params = new URLSearchParams();
      params.set('pageNumber', pageNumber.toString());
      params.set('pageSize', pageSize.toString());
      if (action) params.set('action', action);
      if (severity && severity !== 'ALL') params.set('severity', severity);

      const token = localStorage.getItem('liman_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE_URL}/api/security/audit-logs?${params.toString()}`, { headers });
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      let filtered = [...MOCK_AUDIT_LOGS];
      if (action) filtered = filtered.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
      if (severity && severity !== 'ALL') filtered = filtered.filter(l => l.severity === severity);

      return {
        items: filtered,
        totalCount: filtered.length,
        pageNumber,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
      };
    }
  },

  triggerSimulatedEvent: async (
    action: string,
    entity: string,
    details: string,
    severity = 'WARNING'
  ): Promise<void> => {
    try {
      const token = localStorage.getItem('liman_token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const params = new URLSearchParams({ action, entity, details, severity });
      await fetch(`${API_BASE_URL}/api/security/audit-logs/simulated-event?${params.toString()}`, {
        method: 'POST',
        headers,
      });
    } catch {
      MOCK_AUDIT_LOGS.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        username: 'Güvenlik Denetim Servisi',
        userRole: 'Auditor',
        action,
        entityName: entity,
        entityId: 'SEC-' + Math.floor(Math.random() * 89999 + 10000),
        ipAddress: '127.0.0.1',
        details,
        isSuccess: false,
        severity,
      });
    }
  },
};

function getMockScenarioResult(scenarioId: number, mode: 'vulnerable' | 'secure', customPayload?: any): SecurityScenarioResult {
  const isVuln = mode === 'vulnerable';

  switch (scenarioId) {
    case 1:
      return {
        scenarioId: 1,
        scenarioName: 'Broken Access Control',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Endpoint üzerinde [Authorize] bulunmadığı için kimliği doğrulanmamış istemci gizli operasyonel verilere erişti.' : 'Rol Tabanlı Erişim Denetimi (RBAC) başarıyla uygulandı.',
        attackPayload: 'GET /api/security-demo/access-control/' + mode,
        resultMessage: isVuln ? 'Yetki kontrolü atlandı, gizli liman bütçesi sızdırıldı!' : 'Yetki doğrulandı. Yalnızca Admin ve PortManager erişebilir.',
        data: isVuln ? { portBudget: 25000000.0, securityLevel: 'MARSEC 2' } : { status: 'Authorized', securityLevel: 'MARSEC 2' },
        mitigationExplanation: 'Endpoint [Authorize(Roles = "Admin,PortManager")] ile kilitlendi.',
      };
    case 2:
      return {
        scenarioId: 2,
        scenarioName: 'IDOR (Insecure Direct Object Reference)',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'URL’deki portId değiştirilerek başka limanın özel verilerine erişildi.' : 'Claims-based liman sahiplik denetimi yapıldı.',
        attackPayload: 'GET /api/security-demo/idor/' + mode + '/1',
        resultMessage: isVuln ? 'Saldırgan yetkisi olmayan limanın verilerini çekti!' : '403 FORBIDDEN: Başka limanın verilerine erişim engellendi ve CRITICAL audit log atıldı.',
        data: isVuln ? { port: 'Ambarlı Limanı', secretVisits: 14 } : { error: 'Forbidden' },
        mitigationExplanation: 'Servis katmanında kullanıcının PortId claimi doğrulandı.',
      };
    case 3:
      return {
        scenarioId: 3,
        scenarioName: 'SQL Injection (SQLi)',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? "SELECT * FROM Ships WHERE Name LIKE '%" + (customPayload || "' OR '1'='1") + "%' dinamik string birleştirme ile çalıştırıldı." : 'EF Core parametreli LINQ sorgusu ile arandı.',
        attackPayload: customPayload || "' OR '1'='1",
        resultMessage: isVuln ? 'SQL Injection başarılı! Filtre bypass edildi, 35 geminin tamamı sızdırıldı.' : 'SQLi engellendi! Girdi yalnızca kelime parametresi (@p0) olarak arandı.',
        data: isVuln ? [{ name: 'TCG Barbaros' }, { name: 'Aegean Voyager' }, { name: 'Marmara Pearl' }] : [{ name: 'Arama sonucu bulunamadı (0 kayıt)' }],
        mitigationExplanation: 'Parametreli LINQ sorguları kullanılarak SQL enjeksiyonu kesin olarak engellendi.',
      };
    case 4:
      return {
        scenarioId: 4,
        scenarioName: 'Hassas Bilgi Sızıntısı',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Personel entitysi doğrudan istemciye dönüldü, telefon ve kimlik bilgileri ifşa oldu.' : 'Kullanıcı rolüne göre DTO projeksiyonu ve veri maskeleme (***) uygulandı.',
        attackPayload: 'GET /api/security-demo/sensitive-data/' + mode,
        resultMessage: isVuln ? 'Tüm denizcilerin açık telefonları ve e-postaları herkese açık paylaşıldı!' : 'Hassas telefon ve e-posta verileri maskelendi (KVKK & GDPR uyumu).',
        data: isVuln ? [{ name: 'Ahmet Yılmaz', phone: '+90 532 111 2233', email: 'ahmet@liman.gov.tr', tckn: '12345678901' }] : [{ name: 'Ahmet Yılmaz', maskedPhone: '+90 532 *** ** 33', maskedEmail: 'a***@liman.gov.tr' }],
        mitigationExplanation: 'CrewPublicDto ve CrewMaskedDto katmanlı DTO mimarisi entegre edildi.',
      };
    case 5:
      return {
        scenarioId: 5,
        scenarioName: 'Mass Assignment (Over-Posting)',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'İstemciden gelen Role / IsAdmin parametreleri kontrolsüzce User varlığına kopyalandı.' : 'Katı DTO ile yetki yükseltme alanı sunucuda yok sayıldı.',
        attackPayload: '{"username":"attacker","role":"Admin","isAdmin":true}',
        resultMessage: isVuln ? 'Yetki Yükseltme Başarılı! Kullanıcı sisteme Admin olarak kaydedildi!' : 'Saldırı engellendi! Rol istemciden değil, sunucu kurallarıyla Viewer olarak atandı.',
        data: isVuln ? { username: 'attacker', role: 'Admin' } : { username: 'attacker', role: 'Viewer' },
        mitigationExplanation: 'Katı CreateUserRequest DTO ile over-posting engellendi.',
      };
    case 6:
      return {
        scenarioId: 6,
        scenarioName: 'Broken Authentication',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? '10 yıllık token ömrü, zayıf secret key ve logout anında token iptali desteği yok.' : '15 dakikalık Access Token + Rotasyonlu Refresh Token + Logout Revocation devrede.',
        attackPayload: 'Uzun ömürlü token çalınması simülasyonu',
        resultMessage: isVuln ? 'Çalınan token ile yıllarca yetkisiz erişim sağlanabilir.' : 'Kısa ömürlü token ve tek kullanımlık Refresh Token rotasyonu ile tam oturum güvenliği sağlandı.',
        data: isVuln ? { tokenLifetime: '10 Yıl', revocation: false } : { tokenLifetime: '15 Dakika', refreshTokenRotation: true, revocationOnLogout: true },
        mitigationExplanation: 'Kısa ömürlü JWT ve veritabanı kontrollü Refresh Token mimarisi kuruldu.',
      };
    case 7:
      return {
        scenarioId: 7,
        scenarioName: 'Güvensiz Hata Yönetimi',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Sunucu hatasında SQL connection string ve dosya yolları ekrana basıldı.' : 'GlobalExceptionMiddleware ile teknik detaylar gizlendi, güvenli trace ID dönüldü.',
        attackPayload: 'Tetiklenen Kritik İstisna',
        resultMessage: isVuln ? 'Veritabanı şifresi ve sunucu iç dizinleri istemciye sızdırıldı!' : 'Kullanıcıya yalnızca jenerik güvenli mesaj dönüldü, detaylar sunucuda loglandı.',
        data: isVuln ? { connectionString: 'Server=tcp:liman-db;User Id=sa;Password=SecretPass123!;' } : { message: 'Beklenmeyen bir hata oluştu.', traceId: 'a4b8f9e12' },
        mitigationExplanation: 'Global Exception Middleware entegre edildi.',
      };
    case 8:
      return {
        scenarioId: 8,
        scenarioName: 'Güvensiz Dosya Yükleme',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Uzantı ve boyut kontrolü yapılmadan sunucuya .php / .exe Web Shell yüklenebildi.' : 'Uzantı beyaz listesi (.pdf, .png), boyut sınırı (5MB) ve GUID isimlendirme uygulandı.',
        attackPayload: 'exploit_shell.php (8 MB)',
        resultMessage: isVuln ? 'Saldırgan sunucuya Web Shell yükleyerek uzaktan komut çalıştırma yetkisi kazandı!' : 'GEÇERSİZ DOSYA TİPİ: Yalnızca onaylı belgeler (.pdf, .png) kabul edildi.',
        data: isVuln ? { savedFile: '/wwwroot/uploads/exploit_shell.php' } : { safeName: 'a98b7-41fe-98d.pdf', maxSize: '5 MB' },
        mitigationExplanation: 'MIME Sniffing, uzantı beyaz listesi ve GUID isimlendirme sağlandı.',
      };
    case 9:
      return {
        scenarioId: 9,
        scenarioName: 'Cross-Site Scripting (XSS)',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Gemi açıklamasına girilen <script>alert("XSS")</script> doğrudan tarayıcıya basıldı.' : 'HTML Sanitization ve WebUtility.HtmlEncode ile script etkisiz hale getirildi.',
        attackPayload: "<script>alert('XSS')</script>",
        resultMessage: isVuln ? 'XSS Başarılı! Tarayıcıda yetkisiz JavaScript çalıştırıldı!' : 'Zararlı script etkisiz hale getirildi: &lt;script&gt; olarak kodlandı.',
        data: isVuln ? { raw: "<script>alert('XSS')</script>" } : { encoded: "&lt;script&gt;alert('XSS')&lt;/script&gt;" },
        mitigationExplanation: 'HTML Output Encoding ve Content Security Policy (CSP) uygulandı.',
      };
    case 10:
      return {
        scenarioId: 10,
        scenarioName: 'Denial of Service (DoS)',
        mode: isVuln ? 'VULNERABLE' : 'SECURE',
        isVulnerabilityExploited: isVuln,
        description: isVuln ? 'Tek istekte 1.000.000 kayıt talep edildi, rate limiting olmadığı için sunucu belleği tüketildi.' : 'Maksimum sayfa boyutu 100 ile sınırlandı ve IP başına Rate Limiting devreye girdi.',
        attackPayload: 'GET /api/ships?pageSize=1000000 (Ardışık 20 istek)',
        resultMessage: isVuln ? 'Aşırı Kaynak Tüketimi: Sunucu belleği ve işlemcisi kilitlenme riskiyle karşı karşıya!' : 'Sayfa boyutu 100’e çekildi. Hızlı ardışık isteklerde 429 Too Many Requests döndü.',
        data: isVuln ? { requestedRecords: 1000000, rateLimit: 'Yok' } : { cappedSize: 100, rateLimit: '10 sn / 5 istek' },
        mitigationExplanation: 'ASP.NET Core RateLimiter middleware ve Math.Min(size, 100) paging cap uygulandı.',
      };
    default:
      return {
        scenarioId: 1,
        scenarioName: 'Güvenlik Testi',
        mode: 'SECURE',
        isVulnerabilityExploited: false,
        description: 'Test tamamlandı.',
        attackPayload: '',
        resultMessage: 'İşlem başarılı.',
        mitigationExplanation: '',
      };
  }
}


