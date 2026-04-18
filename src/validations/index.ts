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

export const CreatePaymentSchema = z.object({
  appointmentId: z.string().min(1, "appointmentId es obligatorio"),
  method: z.enum(["cash", "transfer", "card", "nequi", "daviplata"]),
  amount: z.number().int().min(0),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("paid"),
  reference: z.string().max(120).optional(),
});

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora invalida");

const optionalUrlSchema = z.union([z.string().url(), z.literal(""), z.undefined()]);

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
