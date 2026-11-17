import { getSession } from "@/lib/auth";
import { getExportData } from "@/lib/queries";

export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const data = await getExportData();
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="tuneboxd-${stamp}.json"`,
    },
  });
}
