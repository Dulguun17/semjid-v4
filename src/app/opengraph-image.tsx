import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Semjid Khujirt — rooms, services and arrival information";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function SocialImage() {
  const logo = await readFile(join(process.cwd(), "public/images/logo.png"));
  return new ImageResponse(<div style={{ display: "flex", width: "100%", height: "100%", background: "linear-gradient(135deg,#0d1e2a,#0a5559)", color: "white", padding: "65px", flexDirection: "column", justifyContent: "space-between" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
      {/* Existing approved brand asset, with no new business claims. */}
      <img src={`data:image/png;base64,${logo.toString("base64")}`} width="170" height="170" alt="" style={{ width: 170, height: 170, flexShrink: 0, background: "white", borderRadius: "85px", objectFit: "contain", padding: "16px" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}><div style={{ display: "flex", fontSize: "72px", fontWeight: 700 }}>SEMJID KHUJIRT</div><div style={{ display: "flex", fontSize: "30px", color: "#bce5e2" }}>Rooms · Services · Plan your stay</div></div>
    </div>
    <div style={{ display: "flex", borderTop: "2px solid #71b2b3", paddingTop: "30px", fontSize: "32px", color: "#e4f1ee" }}>Khujirt, Uvurkhangai · Mongolia</div>
  </div>, size);
}
