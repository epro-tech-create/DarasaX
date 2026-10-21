import { ImageResponse } from "next/og";

export const alt = "DarasaX — DIT notes, past papers, assignments and class timetables";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function SocialPreview() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px", background: "linear-gradient(135deg, #091521, #103b61)", color: "#ffffff" }}>
      <div style={{ display: "flex", fontSize: 86, fontWeight: 700, letterSpacing: -4 }}>Darasa<span style={{ color: "#39a6f6" }}>X</span></div>
      <div style={{ display: "flex", marginTop: 30, fontSize: 48, fontWeight: 600 }}>Everything for class. One place.</div>
      <div style={{ display: "flex", marginTop: 24, fontSize: 27, color: "#c1d5e6" }}>DIT notes · Past papers · Assignments · Timetables</div>
      <div style={{ display: "flex", marginTop: 52, fontSize: 25, color: "#59b6fa" }}>darasax.com</div>
    </div>, size,
  );
}
