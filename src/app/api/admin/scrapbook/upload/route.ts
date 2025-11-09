import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, type PutObjectCommandInput } from "@aws-sdk/client-s3";

export async function POST(request: Request) {
  try {
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const bucket = process.env.AWS_S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!region) return NextResponse.json({ error: "Missing AWS_REGION (or AWS_DEFAULT_REGION)" }, { status: 500 });
    if (!bucket) return NextResponse.json({ error: "Missing AWS_S3_BUCKET" }, { status: 500 });
    if (!accessKeyId || !secretAccessKey) return NextResponse.json({ error: "Missing AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY" }, { status: 500 });

    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

    const contentType = request.headers.get("content-type") || "application/octet-stream";
    const url = new URL(request.url);
    const fileName = url.searchParams.get("filename") || `upload-${Date.now()}`;
    const album = (url.searchParams.get("album") || "uncategorized").replace(/[^a-z0-9-_/]/gi, "-");
    const ext = fileName.includes(".") ? fileName.split(".").pop() : undefined;
    const key = `scrapbook/${album}/${Date.now()}-${Math.random().toString(36).slice(2)}${ext ? `.${ext}` : ""}`;

    const Body = Buffer.from(await request.arrayBuffer());

    const params: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body,
      ContentType: contentType,
    };
    if (process.env.AWS_S3_USE_ACL === "true") {
      (params as PutObjectCommandInput).ACL = "public-read";
    }
    await s3.send(new PutObjectCommand(params));

    const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    const urlOut = `${baseUrl}/${key}`;
    return NextResponse.json({ url: urlOut, key });
  } catch (e) {
    console.error(e);
    return new NextResponse("Upload failed", { status: 500 });
  }
}


