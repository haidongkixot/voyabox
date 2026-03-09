export const TOKEN_RULES = {
  TRIAL_REGISTER: 25,
  REVIEW: 75,
  PHOTO_BONUS: 25,
  FIRST_REVIEW_BONUS: 50,
} as const;

/** XP level names matching the mobile app */
const LEVEL_NAMES = ['Người mới', 'Thành viên', 'Reviewer', 'Chuyên gia', 'Đại sứ', 'Huyền thoại'];

export function getLevel(totalEarned: number) {
  const level = Math.floor(totalEarned / 500);
  const cappedLevel = Math.min(level, LEVEL_NAMES.length - 1);
  return {
    level: cappedLevel,
    levelName: LEVEL_NAMES[cappedLevel],
    xp: totalEarned,
    xpToNextLevel: cappedLevel < LEVEL_NAMES.length - 1 ? (cappedLevel + 1) * 500 - totalEarned : 0,
    progress: cappedLevel < LEVEL_NAMES.length - 1
      ? ((totalEarned - cappedLevel * 500) / 500) * 100
      : 100,
  };
}

export function calculateReviewTokens(hasPhoto: boolean, isFirstReview: boolean): number {
  let tokens = TOKEN_RULES.REVIEW;
  if (hasPhoto) tokens += TOKEN_RULES.PHOTO_BONUS;
  if (isFirstReview) tokens += TOKEN_RULES.FIRST_REVIEW_BONUS;
  return tokens;
}
