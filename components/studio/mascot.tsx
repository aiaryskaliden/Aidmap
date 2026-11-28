import Image from "next/image";
import styles from "./mascot.module.css";

export function MascotMark({ size = 19 }: { size?: number }) {
  return (
    <span className={styles.mark} aria-hidden="true">
      <Image src="/icon.svg" width={size} height={size} alt="" unoptimized />
    </span>
  );
}
