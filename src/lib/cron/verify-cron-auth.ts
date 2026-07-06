import { NextResponse } from "next/server";

export type CronAuthFailure = {
  response: NextResponse;
};

export function verifyCronAuth(req: Request, secret: string | undefined): CronAuthFailure | null {
  if (!secret) {
    return {
      response: NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 }),
    };
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return {
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  return null;
}
