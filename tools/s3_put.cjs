#!/usr/bin/env node
/**
 * s3_put.cjs — MSW 리소스 업로드 2단계 중 "presigned URL 에 PUT" 만 담당한다.
 *
 *   node tools/s3_put.cjs <파일경로> <presignedUrl>
 *
 * presigned URL 은 Content-Length 가 서명에 포함돼 있으므로 파일 크기가
 * 1단계에서 넘긴 contentLength 와 정확히 같아야 한다.
 */

"use strict";

const fs = require("fs");

async function main() {
  const [file, url] = process.argv.slice(2);
  if (!file || !url) {
    console.error("usage: node tools/s3_put.cjs <file> <presignedUrl>");
    process.exit(2);
  }
  const body = fs.readFileSync(file);
  const res = await fetch(url, {
    method: "PUT",
    body,
    headers: { "Content-Length": String(body.length) },
    duplex: "half",
  });
  const text = await res.text().catch(() => "");
  console.log(`${res.status} ${res.statusText}  (${body.length} bytes)`);
  if (!res.ok) {
    console.error(text.slice(0, 2000));
    process.exit(1);
  }
}

main();
