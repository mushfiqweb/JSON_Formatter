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
  const idsParam = searchParams.get("ids");
  const db = readMockDB();

  // Batch fetch for history
  if (idsParam) {
    const ids = idsParam.split(",");
    const results = ids.map(i => db[i]).filter(Boolean);
    return NextResponse.json({ data: results });
  }

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  const record = db[id];
  if (!record) {
    return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
  }

  // NOTE: View incrementing is now explicitly handled by the RPC call, 
  // keeping the mock DB in sync with the real Supabase behavior.
  return NextResponse.json({ data: record });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, record, action } = body;
    
    const db = readMockDB();

    if (action === "track_view") {
      const { is_unique } = body;
      if (!id || !db[id]) {
        return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
      }
      if (is_unique) {
        db[id].views_count = (db[id].views_count || 0) + 1;
      }
      db[id].last_viewed_at = new Date().toISOString();
      writeMockDB(db);
      return NextResponse.json({ success: true });
    }

    if (!id || !record) {
      return NextResponse.json({ error: "Missing id or record" }, { status: 400 });
    }

    db[id] = {
      ...record,
      views_count: 0,
      last_viewed_at: null,
    };
    writeMockDB(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, token } = body;
    if (!id || !token) {
      return NextResponse.json({ error: "Missing id or token" }, { status: 400 });
    }

    const db = readMockDB();
    const record = db[id];
    
    if (!record) {
      return NextResponse.json({ error: "Snippet not found" }, { status: 404 });
    }

    if (record.creator_token !== token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    delete db[id];
    writeMockDB(db);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
