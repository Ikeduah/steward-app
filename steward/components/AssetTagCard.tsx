import BrandedQrCode from "./BrandedQrCode";

interface AssetTagCardProps {
  qrValue: string;
  assetId: string;
  assetName: string;
  qrSize?: number;
}

export default function AssetTagCard({ qrValue, assetId, assetName, qrSize = 120 }: AssetTagCardProps) {
  return (
    <div
      className="w-[230px] bg-white rounded-2xl border overflow-hidden shrink-0"
      style={{ borderColor: "#D9DEDB", boxShadow: "0 18px 40px -22px rgba(6,20,14,.35)" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: "#06140E" }}>
        <div
          className="w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(150deg, #34D399, #059669)" }}
        >
          <svg width="14" height="14" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path
              d="M45 19 C45 13 39 10 31 10 C20 10 14 16 14 23 C14 30 20 33 30 35 C40 37 45 40 45 45 C45 52 39 55 30 55"
              stroke="#fff"
              strokeWidth="8.5"
              strokeLinecap="round"
            />
            <circle cx="45" cy="19" r="5" fill="#fff" />
            <circle cx="30" cy="55" r="5" fill="#fff" />
          </svg>
        </div>
        <span className="font-semibold text-[13px] text-white tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Steward
        </span>
      </div>

      <div className="flex justify-center p-[22px]">
        <BrandedQrCode id="asset-qr-svg" value={qrValue} size={qrSize} />
      </div>

      <div className="px-[18px] pb-[18px] text-center">
        <div
          className="text-[11px] mb-[3px] uppercase tracking-[.08em]"
          style={{ fontFamily: "var(--font-jetbrains-mono)", color: "#059669" }}
        >
          {assetId}
        </div>
        <div
          className="font-semibold text-[15px] tracking-tight"
          style={{ fontFamily: "var(--font-space-grotesk)", color: "#06140E" }}
        >
          {assetName}
        </div>
      </div>
    </div>
  );
}
