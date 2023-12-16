import styles from "./Flag.module.css";

export type Flag = { char: string; name: string };

export default function Options({
  flags,
  selected,
  onChange,
}: {
  flags: Flag[];
  selected: Flag;
  onChange?: (option: Flag) => void;
}) {
  return (
    <div className={styles.flag}>
      {flags.map((flag) => (
        <Option
          key={flag.char}
          flag={flag}
          selected={selected.char == flag.char}
          onClick={() => onChange && onChange(flag)}
        />
      ))}
    </div>
  );
}

function Option({
  flag: { char, name },
  selected,
  onClick,
}: {
  flag: Flag;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <>
      <span className={`${styles.char} ${selected ? styles.selected : ""}`}>
        {char}
      </span>
      <div
        onClick={onClick}
        title={!selected ? `use ${name}` : `using ${name}`}
        className={`${styles.toggle} ${selected ? styles.selected : ""}`}
      >
        {name}
      </div>
    </>
  );
}
