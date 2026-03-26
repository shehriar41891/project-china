import React from 'react';
import styles from './Background.module.css';

export default function Background() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.bgShape + ' ' + styles.bgShape1} />
      <div className={styles.bgShape + ' ' + styles.bgShape2} />
      <div className={styles.bgShape + ' ' + styles.bgShape3} />
      <div className={styles.bgLines} />
      <div className={styles.bgDots}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <span key={i} className={styles.bgDot + ' ' + styles['bgDot' + i]} />
        ))}
      </div>
    </div>
  );
}
