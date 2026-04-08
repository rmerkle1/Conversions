import styles from './NumberPanel.module.css';

export default function NumberPanel() {
  return (
    <div className={styles.panel}>
      <span className={styles.label}>Numbers</span>
      <span className={styles.inactive}>— coming soon —</span>
    </div>
  );
}
