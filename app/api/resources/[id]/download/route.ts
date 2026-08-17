import { NextResponse } from "next/server";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireOfficeNetwork } from "@/lib/networkAccess";
import {
  mimeFromExtension,
  readPrivateFile,
} from "@/lib/privateStorage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireOfficeNetwork("/api/resources/[id]/download");
  if (error) return error;

  const { id } = await params;

  try {
    const resource = await prisma.resource.findFirst({
      where: {
        id,
        isPublished: true,
        isEmployeeVisible: true,
        fileUrl: { not: null },
      },
    });

    if (!resource?.fileUrl) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const buffer = await readPrivateFile(resource.fileUrl);
    if (!buffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const filename = path.basename(resource.fileUrl);
    const mime = mimeFromExtension(filename);
    const safeDownloadName = filename.replace(/[^\w.\-()+ ]+/g, "_");

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${safeDownloadName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Resource download failed:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
