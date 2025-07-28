import { mail1, mail2, practiceData, Mail } from './mail';

export enum ExperimentPageType {
  ManualEdit = 'manual-edit',
  ThinkAloud = 'think-aloud'
}

export function getMailForExperiment(userId: number | null, pageType: ExperimentPageType, isPractice: boolean = false): Mail {
  // Practice mode always uses training material
  if (isPractice) {
    return practiceData;
  }

  // If no userId, default to mail1 (meeting schedule change)
  if (!userId) {
    return mail1;
  }

  const remainder = userId % 4;

  if (pageType === ExperimentPageType.ManualEdit) {
    if (remainder === 0 || remainder === 3) {
      return mail1; // 会議の日程変更
    } else { // remainder === 1 || remainder === 2
      return mail2; // 新商品発表会
    }
  } else if (pageType === ExperimentPageType.ThinkAloud) {
    if (remainder === 0 || remainder === 3) {
      return mail2; // 新商品発表会
    } else { // remainder === 1 || remainder === 2
      return mail1; // 会議の日程変更
    }
  }

  // Fallback to mail1
  return mail1;
}
