import Link from 'next/link';
import styles from '../page.module.css';

export default function QuickActions() {
  return (
    <div className={styles.actions}>
      <Link href="/orders" className={styles.button}>
        订单列表
      </Link>
    </div>
  );
}
