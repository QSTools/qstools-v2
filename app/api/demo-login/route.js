import { NextResponse } from "next/server";

export async function POST(request) {
  const demo_password = process.env.DEMO_PASSWORD;

  if (!demo_password) {
    return NextResponse.json(
      { error: "Demo password is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const submitted_password = body?.password;

  if (submitted_password !== demo_password) {
    return NextResponse.json(
      { error: "Incorrect password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("qs_tools_demo_access", demo_password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}