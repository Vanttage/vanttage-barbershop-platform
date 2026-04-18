/**
 * Path-based public booking: /kurvo/reservar
 * Passes the slug from the URL directly to BookingWizard so all API calls
 * include ?tenantSlug=xxx — no reliance on cookies or middleware headers.
 */
import BookingWizard from "@/app/(booking)/reservar/page";

interface Props {
  params: { slug: string };
}

export default function SlugBookingPage({ params }: Props) {
  return <BookingWizard tenantSlug={params.slug} />;
}
