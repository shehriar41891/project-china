/** Server uses 50% materials + 50% chapter quiz (quiz_done). */

function quizDone(c) {
  if (c.quiz_done != null) return !!c.quiz_done;
  return !!(c.quiz_best && String(c.quiz_best).length);
}

export function learnCardStatus(c, t) {
  if (c.completed_at) return t('learn.statusCompleted');
  if ((c.progress_pct || 0) >= 100 && !c.completed_at) return t('learn.statusReadyFinalize');
  if (c.materials_confirmed && !quizDone(c)) return t('learn.statusNeedQuiz');
  if (quizDone(c) && !c.materials_confirmed) return t('learn.statusNeedMaterials');
  if ((c.progress_pct || 0) > 0) return t('learn.statusInProgress');
  return t('learn.statusNotStarted');
}

export function profileChapterStatus(c, t) {
  if (c.completed_at) return t('profile.statusDone');
  if ((c.progress_pct || 0) >= 100) return t('profile.statusReadyFinalize');
  if (c.materials_confirmed && !quizDone(c)) return t('profile.statusNeedQuiz');
  if (quizDone(c) && !c.materials_confirmed) return t('profile.statusNeedMaterials');
  return t('profile.statusInProgress');
}

export function averageChapterProgress(chapters) {
  if (!chapters || !chapters.length) return 0;
  const sum = chapters.reduce((s, c) => s + (typeof c.progress_pct === 'number' ? c.progress_pct : 0), 0);
  return Math.round(sum / chapters.length);
}
