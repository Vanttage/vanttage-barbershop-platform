export type {
  Appointment,
  AppointmentStatus,
  Barber,
  Barbershop,
  Client,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Plan,
  Schedule,
  Service,
  ServiceCategory,
  Tenant,
  User,
  UserRole,
} from "@prisma/client";

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  error?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AppointmentWithRelations {
  id: string;
  tenantId: string;
  barbershopId: string;
  barberId: string;
  serviceId: string;
  clientId: string;
  startsAt: string | Date;
  endsAt: string | Date;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes: string | null;
  price: number;
  total: number;
  cancelReason: string | null;
  confirmationSentAt: string | Date | null;
  reminder24hSentAt: string | Date | null;
  reminder1hSentAt: string | Date | null;
  reviewRequestSentAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  barber: BarberBasic;
  service: ServiceBasic;
  client: ClientBasic;
}

export interface BarberBasic {
  id: string;
  name: string;
  photoUrl: string | null;
  specialty?: string | null;
  rating?: number;
  appointmentsToday?: number;
  initials?: string;
}

export interface ServiceBasic {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active?: boolean;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface ClientBasic {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

export interface DashboardMetric {
  label: string;
  value: number;
}

export interface DashboardStats {
  citasHoy: number;
  citasSemana: number;
  ingresosHoy: number;
  ingresosMes: number;
  ingresosSemana: number;
  clientesActivos: number;
  clientesNuevos: number;
  tasaAsistencia: number;
  citasHoyDelta: number;
  ingresosMonthDelta: number;
  weeklyData: WeeklyDataPoint[];
  topServices: DashboardMetric[];
  topBarber: {
    id: string;
    name: string;
    reservations: number;
  } | null;
  clientesFrecuentes: Array<{
    id: string;
    name: string;
    visits: number;
  }>;
}

export interface WeeklyDataPoint {
  day: string;
  citas: number;
  ingresos: number;
}

export interface CreateAppointmentDTO {
  barberId: string;
  serviceId: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  startsAt: string;
  notes?: string;
}

export interface UpdateAppointmentDTO {
  status?: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  cancelReason?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "owner" | "client";
  tenantId: string | null;
  tenantSlug: string | null;
  barbershopId: string | null;
  barbershopSlug: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "owner" | "client";
  phone: string | null;
  avatarUrl: string | null;
  tenantId: string | null;
  tenantSlug: string | null;
  barbershopId: string | null;
  barbershopSlug: string | null;
}

export interface PublicBarbershop {
  tenantName: string;
  tenantSlug: string;
  barbershopName: string;
  barbershopSlug: string;
  city: string | null;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  openingTime: string | null;
  closingTime: string | null;
}

export const STATUS_CONFIG: Record<
  AppointmentWithRelations["status"],
  {
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  confirmed: {
    label: "Confirmada",
    color: "#3AAF7B",
    bg: "rgba(58,175,123,0.1)",
    border: "rgba(58,175,123,0.2)",
  },
  pending: {
    label: "Pendiente",
    color: "#C9A84C",
    bg: "rgba(201,168,76,0.1)",
    border: "rgba(201,168,76,0.2)",
  },
  in_progress: {
    label: "En proceso",
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.2)",
  },
  completed: {
    label: "Completada",
    color: "#9B9690",
    bg: "rgba(155,150,144,0.1)",
    border: "rgba(155,150,144,0.2)",
  },
  cancelled: {
    label: "Cancelada",
    color: "#E74C3C",
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.2)",
  },
};

export const formatCOP = (value: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    currencyDisplay: "symbol",
  }).format(value);

export const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
