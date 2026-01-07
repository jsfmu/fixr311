import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getReportsCollection } from "@/lib/db";
import { toReportResponse } from "@/lib/reports";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const collection = await getReportsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toReportResponse(doc));
}

