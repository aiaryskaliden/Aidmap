import Image from "next/image";
import styles from "./mascot.module.css";

export function MascotMark({ size = 19 }: { size?: number }) {
  return (
    <span className={styles.mark} aria-hidden="true">
      <Image src="/icon.svg" width={size} height={size} alt="" unoptimized />
    </span>
  );
}

export function Mascot() {
  return (
    <div className={styles.artwork} aria-hidden="true">
      <Image
        src="/brand/wayfinder.webp"
        alt=""
        width={900}
        height={600}
        loading="eager"
        unoptimized
      />
    </div>
  );
}
