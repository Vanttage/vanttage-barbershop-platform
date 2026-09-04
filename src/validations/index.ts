import { z } from "zod";

const appointmentStatuses = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const CreateAppointmentSchema = z
  .object({
    barberId: z.string().min(1, "barberId es obligatorio"),
    serviceId: z.string().min(1, "serviceId es obligatorio"),
    startsAt: z.string().datetime("startsAt debe ser una fecha ISO valida"),
    notes: z.string().max(500).optional(),
    clientId: z.string().optional(),
    clientName: z.string().min(2, "Nombre muy corto").max(100).optional(),
    clientPhone: z.string().min(7, "Telefono invalido").max(20).optional(),
    clientEmail: z.string().email("Email invalido").optional(),
  })
  .refine((data) => data.clientId || (data.clientName && data.clientPhone), {
    message: "Debes proveer clientId o (clientName + clientPhone)",
  });

export const UpdateAppointmentSchema = z.object({
  status: z.enum(appointmentStatuses).optional(),
  notes: z.string().max(500).optional(),
  cancelReason: z.string().max(300).optional(),
  // Reprogramar: cualquiera de estos tres dispara una revalidación de
  // disponibilidad (ver PATCH /api/appointments/[id]).
  startsAt: z.string().datetime("startsAt debe ser una fecha ISO valida").optional(),
  barberId: z.string().optional(),
  serviceId: z.string().optional(),
  // Solo junto con status: "completed" — corrige el servicio realmente
  // prestado y/o el precio final a cobrar. No dispara revalidación de
  // horario/doble-reserva (la cita ya ocurrió).
  finalPrice: z.number().int().min(0).optional(),
});

export const CreateClientSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  email: z.union([z.string().email(), z.literal(""), z.undefined()]),
  notes: z.string().max(500).optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const CreateBarberSchema = z.object({
  name: z.string().min(2).max(100),
  specialty: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  bio: z.string().max(500).optional(),
  photoUrl: z.string().url().optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
});

export const UpdateBarberSchema = CreateBarberSchema.partial().extend({
  active: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  rating: z.number().min(0).max(5).optional(),
});

export const CreateServiceCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(250).optional(),
  icon: z.string().max(50).optional(),
});

export const CreateServiceSchema = z.object({
  name: z.string().min(2).max(100),
  categoryId: z.string().optional(),
  durationMin: z.number().int().min(15).max(480),
  price: z.number().int().min(0),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const UpdateServiceSchema = CreateServiceSchema.partial().extend({
  active: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

const paymentMethodSchema = z.enum(["cash", "transfer", "card", "nequi", "daviplata"]);

export const CreatePaymentSchema = z
  .object({
    appointmentId: z.string().min(1, "appointmentId es obligatorio"),
    method: paymentMethodSchema.optional(),
    amount: z.number().int().min(0),
    status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
    reference: z.string().max(120).optional(),
  })
  .refine((d) => d.status !== "paid" || !!d.method, {
    message: "El método de pago es obligatorio para marcar un pago como pagado",
    path: ["method"],
  });

export const RegisterPaymentSchema = z.object({
  method: paymentMethodSchema,
  reference: z.string().max(120).optional(),
});

// ── Caja ─────────────────────────────────────────────────────────────────

export const OpenCashSessionSchema = z.object({
  openingAmount: z.number().int().min(0, "El efectivo inicial no puede ser negativo"),
});

export const CloseCashSessionSchema = z.object({
  countedCash: z.number().int().min(0, "El efectivo contado no puede ser negativo"),
  note: z.string().max(300).optional(),
});

export const CreateCashMovementSchema = z.object({
  type: z.enum(["expense", "adjustment"]),
  // Magnitud siempre positiva en el request — el signo lo decide `direction`
  // (para "expense" se fuerza a salida sin importar lo que llegue aquí).
  amount: z.number().int().positive("El monto debe ser mayor a cero"),
  direction: z.enum(["in", "out"]).default("out"),
  method: paymentMethodSchema,
  concept: z.string().min(2, "Describe el movimiento").max(150),
  category: z.string().max(50).optional(),
  note: z.string().max(300).optional(),
});

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida");

const optionalUrlSchema = z.union([z.string().url(), z.literal(""), z.undefined()]);

const scheduleDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isAvailable: z.boolean(),
    startTime: timeSchema,
    endTime: timeSchema,
  })
  .refine((d) => !d.isAvailable || d.startTime < d.endTime, {
    message: "La hora de inicio debe ser antes que la hora de fin",
    path: ["endTime"],
  });

export const UpdateScheduleSchema = z.object({
  schedules: z
    .array(scheduleDaySchema)
    .length(7, "Debes enviar los 7 dias de la semana")
    .refine(
      (days) => new Set(days.map((d) => d.dayOfWeek)).size === 7,
      { message: "Cada dia de la semana debe aparecer una sola vez" },
    ),
});

export const UpdateBarbershopSettingsSchema = z.object({
  tenantName: z.string().min(2).max(100),
  barbershopName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  address: z.string().max(150).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(80).optional(),
  phone: z.string().max(20).optional(),
  whatsapp: z.string().max(20).optional(),
  instagram: z.string().max(100).optional(),
  openingTime: timeSchema,
  closingTime: timeSchema,
  logoUrl: optionalUrlSchema,
  bannerUrl: optionalUrlSchema,
});

export const LoginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Contrasena muy corta"),
});

export const RegisterSchema = z
  .object({
    tenantName: z.string().min(2).max(100),
    slug: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
    city: z.string().max(100).optional(),
    country: z.string().max(80).optional(),
    phone: z.string().max(20).optional(),
    instagram: z.string().max(100).optional(),
    plan: z.enum(["basico", "pro", "premium"]).default("pro"),
    email: z.string().email(),
    password: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma tu contrasena"),
    name: z.string().min(2).max(100).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

// Registro completado tras "Continuar con Google": nombre, email y
// verificación ya los dio Google — solo falta lo que Google no sabe.
export const CompleteGoogleRegistrationSchema = z.object({
  tenantName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Solo letras minusculas, numeros y guiones"),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(80).optional(),
  instagram: z.string().max(100).optional(),
  plan: z.enum(["basico", "pro", "premium"]).default("pro"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(20),
    password: z.string().min(8, "Minimo 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirma tu contrasena"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contrasenas no coinciden",
    path: ["confirmPassword"],
  });

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Nombre muy corto").max(100).optional(),
  email: z.string().email("Email invalido").optional(),
  phone: z.string().min(7, "Telefono invalido").max(20).optional(),
  avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

export const AppointmentsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  barberId: z.string().optional(),
  status: z.enum(appointmentStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const ClientsQuerySchema = z.object({
  search: z.string().max(100).optional(),
  inactive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
):
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const message = result.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join(" · ");

  return { success: false, error: message };
}
