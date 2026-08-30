import { GraduationCap } from "lucide-react";

export function HeroBadge() {
  return (
    <div className="relative mx-auto mb-7 h-[84px] w-[84px]">
      <div
        className="absolute inset-0 rounded-full border-2 border-dashed"
        style={{ borderColor: "var(--orange)" }}
      />
      {[0, 90, 180, 270].map((deg) => (
        <span
          key={deg}
          className="absolute h-1.5 w-1.5 rounded-full bg-orange"
          style={{
            top: "50%",
            left: "50%",
            transform: `rotate(${deg}deg) translate(42px) translate(-50%, -50%)`,
          }}
        />
      ))}
      <div className="absolute inset-[8px] flex items-center justify-center rounded-full bg-orange-soft text-orange">
        <GraduationCap size={30} />
      </div>
    </div>
  );
}
