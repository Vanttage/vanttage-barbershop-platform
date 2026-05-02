import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const review = await prisma.review.findUnique({
    where: { token },
    include: {
      barber:  { select: { id: true, name: true, specialty: true, photoUrl: true } },
      client:  { select: { id: true, name: true } },
      barbershop: { select: { id: true, name: true, logoUrl: true } },
      appointment: { select: { startsAt: true, service: { select: { name: true } } } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "Reseña no encontrada o token inválido" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      alreadySubmitted: review.submittedAt !== null,
      rating: review.rating,
      comment: review.comment,
      barber: review.barber,
      client: review.client,
      barbershop: review.barbershop,
      serviceName: review.appointment.service.name,
      appointmentDate: review.appointment.startsAt,
    },
  });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const review = await prisma.review.findUnique({
    where: { token },
    select: { id: true, submittedAt: true, barberId: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Token inválido" }, { status: 404 });
  }
  if (review.submittedAt) {
    return NextResponse.json({ error: "Esta reseña ya fue enviada" }, { status: 409 });
  }

  const body = await req.json();
  const rating = Number(body.rating);
  const comment = typeof body.comment === "string" ? body.comment.trim() : null;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating inválido (1-5)" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.review.update({
      where: { id: review.id },
      data: { rating, comment: comment || null, submittedAt: new Date() },
    });

    // Actualizar rating promedio del barbero
    const allRatings = await tx.review.findMany({
      where: { barberId: review.barberId, submittedAt: { not: null } },
      select: { rating: true },
    });
    const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
    await tx.barber.update({
      where: { id: review.barberId },
      data: { rating: Math.round(avg * 10) / 10 },
    });

    return saved;
  });

  return NextResponse.json({ data: { ok: true, rating: updated.rating } });
}
