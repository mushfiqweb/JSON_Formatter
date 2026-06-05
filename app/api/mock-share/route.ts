import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MOCK_DB_DIR = path.join(process.cwd(), "tmp");
const MOCK_DB_PATH = path.join(MOCK_DB_DIR, "mock_snippets.json");

function readMockDB(): Record<string, any> {
  try {
    if (!fs.existsSync(MOCK_DB_DIR)) {
      fs.mkdirSync(MOCK_DB_DIR, { recursive: true });
    }
    if (fs.existsSync(MOCK_DB_PATH)) {
      const data = fs.readFileSync(MOCK_DB_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading mock DB:", error);
  }
  return {};
}

function writeMockDB(data: Record<string, any>) {
  try {
    if (!fs.existsSync(MOCK_DB_DIR)) {
      fs.mkdirSync(MOCK_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to mock DB:", error);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const db = readMockDB();
  const record = db[id];
  if (!record) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  return NextResponse.json({ data: record });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, record } = body;
    if (!id || !record) {
      return NextResponse.json({ error: "Missing id or record" }, { status: 400 });
    }

    const db = readMockDB();
    db[id] = record;
    writeMockDB(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
