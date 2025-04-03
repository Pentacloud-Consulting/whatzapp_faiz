import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();

    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const payload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message },
    };

    const response = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
