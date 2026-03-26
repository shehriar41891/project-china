import React from 'react';
import styles from './About.module.css';

export default function About() {
  return (
    <div className={styles.main}>
      <div className={styles.card}>
        <h1>About Neural Network Playground</h1>
        <p>
          A learning platform for neural networks and deep learning. Build and train networks visually in the browser,
          follow a structured learning path with 10 chapters, and take adaptive quizzes that focus on your weak areas.
        </p>
        <p>
          The Network Builder lets you drag nodes, connect layers, and run training with no code. The learning path
          covers basics (neurons, activation, layers), loss and optimization, CNNs, RNNs, and best practices.
        </p>
      </div>
    </div>
  );
}
