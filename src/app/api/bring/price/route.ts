import { NextRequest, NextResponse } from "next/server";

const API_UID = process.env.BRING_API_UID ?? "";
const API_KEY = process.env.BRING_API_KEY ?? "";

const RELEVANT_PRODUCTS = [
  "PAKKE_I_POSTKASSEN",
  "PAKKE_I_POSTKASSEN_SPORBAR",
  "PAKKE_TIL_HENTESTED",
  "PAKKE_LEVERT_HJEM",
  "PAKKE_LEVERT_HJEM_DORAS",
];

export type BringProduct = {
  id: string;
  name: string;
  price: number;
  currency: string;
  deliveryDays: number | null;
  deliveryDate: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const toPostal = searchParams.get("toPostal") ?? "";
  const fromPostal = searchParams.get("fromPostal") ?? "0001";
  const weightGrams = searchParams.get("weightGrams") ?? "2000";

  if (!/^\d{4}$/.test(toPostal)) {
    return NextResponse.json(
      { error: "Skriv inn et gyldig 4-sifret postnummer" },
      { status: 400 }
    );
  }

  if (!API_UID || !API_KEY) {
    return NextResponse.json(
      { error: "Bring API ikke konfigurert" },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    fromcountry: "NO",
    tocountry: "NO",
    frompostalcode: fromPostal,
    topostalcode: toPostal,
    weightInGrams: weightGrams,
  });

  let bringRes: Response;
  try {
    bringRes = await fetch(
      `https://api.bring.com/shippingguide/v2/products?${params}`,
      {
        headers: {
          "X-MyBring-API-Uid": API_UID,
          "X-MyBring-API-Key": API_KEY,
          "X-Bring-Client-URL": "https://sportsbyttet.no",
          Accept: "application/json",
        },
        next: { revalidate: 300 },
      }
    );
  } catch {
    return NextResponse.json({ error: "Nettverksfeil mot Bring" }, { status: 502 });
  }

  if (!bringRes.ok) {
    const text = await bringRes.text().catch(() => "");
    console.error("Bring API error", bringRes.status, text);
    return NextResponse.json({ error: "Bring API svarte med feil" }, { status: 502 });
  }

  const data = await bringRes.json();
  const rawProducts: unknown[] = data?.consignments?.[0]?.products ?? [];

  const products: BringProduct[] = rawProducts
    .filter((p) => {
      const prod = p as Record<string, unknown>;
      return RELEVANT_PRODUCTS.includes(prod.id as string);
    })
    .map((p) => {
      const prod = p as Record<string, unknown>;
      const gui = prod.guiInformation as Record<string, unknown> | null;
      const priceObj = (prod.price as Record<string, unknown> | null)
        ?.netPrice as Record<string, unknown> | null;
      const priceDetail = priceObj?.priceWithoutAdditionalServices as
        | Record<string, unknown>
        | null;
      const delivery = prod.deliveryOption as Record<string, unknown> | null;

      return {
        id: prod.id as string,
        name: (gui?.displayName as string) ?? (prod.id as string),
        price: Number(priceDetail?.amountWithVAT ?? 0),
        currency: (priceDetail?.currency as string) ?? "NOK",
        deliveryDays: (delivery?.workingDays as number | null) ?? null,
        deliveryDate: (delivery?.formattedExpectedDeliveryDate as string | null) ?? null,
      };
    })
    .sort((a, b) => a.price - b.price);

  return NextResponse.json({ products });
}
