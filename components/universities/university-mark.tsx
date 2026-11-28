import Image from "next/image";
import type { University } from "@/types/domain";
import marks from "@/data/university-marks.json";
import styles from "./university-mark.module.css";

export function UniversityMark({
  university,
  large = false,
}: {
  university: Pick<University, "id" | "initials" | "color">;
  large?: boolean;
}) {
  const official = Object.hasOwn(marks, university.id);
  const size = large ? 58 : 40;
  const initialsLength = university.initials.length;
  if (official) {
    return (
      <span
        className={`university-mark ${styles.tile}${large ? " university-mark-large" : ""}`}
        aria-hidden="true"
      >
        <Image
          alt=""
          src={`/university-marks/${university.id}.webp`}
          width={size}
          height={size}
          unoptimized
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`university-mark university-mark-type ${styles.monogram}${large ? " university-mark-large" : ""}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${university.color} 44%, #172821)`,
        fontSize:
          initialsLength > 3
            ? Math.min(
                large ? 15 : 10,
                Math.floor((size - 8) / (initialsLength * 0.66)),
              )
            : undefined,
      }}
    >
      {university.initials}
    </span>
  );
}
