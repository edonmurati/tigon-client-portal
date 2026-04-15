import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: "#08090E",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#C8964A",
          fontWeight: 700,
          fontFamily: "serif",
          borderRadius: 6,
          letterSpacing: "-0.05em",
        }}
      >
        T
      </div>
    ),
    { ...size },
  );
}
