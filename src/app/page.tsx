import styles from './page.module.css';
import Hero from './components/Hero';
import QuickActions from './components/QuickActions';

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Hero />

        <section className={styles.kpiRow} aria-label="概览">
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>6</div>
            <div className={styles.kpiLabel}>订单状态</div>
            <div className={styles.kpiHint}>pending / paid / shipped …</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>5</div>
            <div className={styles.kpiLabel}>核心事件</div>
            <div className={styles.kpiHint}>PAY / SHIP / REFUND …</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiValue}>3</div>
            <div className={styles.kpiLabel}>权限角色</div>
            <div className={styles.kpiHint}>admin / operator / viewer</div>
          </div>
        </section>

        <section className={styles.section} aria-label="能力一览">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>能力一览</h2>
            <p className={styles.sectionDesc}></p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>状态机驱动</h3>
                <span className={styles.badge}>FSM</span>
              </div>
              <p className={styles.cardDesc}>用有限状态机管理订单全生命周期，拆清守卫（guard）和副作用（effect）</p>
              <div className={styles.chips}>
                <span className={styles.chip}>PAY</span>
                <span className={styles.chip}>SHIP</span>
                <span className={styles.chip}>REFUND</span>
                <span className={styles.chip}>CANCEL</span>
                <span className={styles.chip}>CONFIRM_RECEIPT</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>角色权限</h3>
                <span className={styles.badge}>RBAC</span>
              </div>
              <p className={styles.cardDesc}>同一套订单操作，在不同角色下呈现不同可用性：可管理、可发货、只读。</p>
              <div className={styles.chips}>
                <span className={styles.chip}>admin</span>
                <span className={styles.chip}>operator</span>
                <span className={styles.chip}>viewer</span>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>API 路由</h3>
                <span className={styles.badge}>Next</span>
              </div>
              <p className={styles.cardDesc}>覆盖单单操作与批量操作，便于对照前端状态机与后端约束的边界。</p>
              <div className={styles.chips}>
                <span className={styles.chip}>/api/orders</span>
                <span className={styles.chip}>/api/orders/[id]</span>
                <span className={styles.chip}>/api/orders/batch</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} aria-label="快速操作">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>快速导航</h2>
            <p className={styles.sectionDesc}></p>
          </div>
          <QuickActions />
        </section>
      </main>
      <footer className={styles.footer}>© {new Date().getFullYear()} 订单中心</footer>
    </div>
  );
}
