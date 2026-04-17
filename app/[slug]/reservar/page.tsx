/**
 * Path-based public booking: /barberia-kurvo/reservar
 * Middleware extracts the slug from the path and sets x-tenant-slug header.
 * The booking wizard component is shared with the subdomain-based route.
 */
import BookingWizard from "@/app/(booking)/reservar/page";

export default BookingWizard;
