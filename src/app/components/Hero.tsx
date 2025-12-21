import styles from '../page.module.css';

export default function Hero() {
  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>订单中心</h1>
      <p className={styles.heroDesc}>管理订单、模拟支付、发货与退款 — 简洁的控制台示例。</p>
    </div>
  );
}
