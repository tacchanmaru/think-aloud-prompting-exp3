import { email1, email2, email3, practiceEmail, Email } from './emails';

export enum ExperimentPageType {
  ManualEdit = 'manual-edit',
  ThinkAloud = 'think-aloud',
  TextPrompting = 'text-prompting'
}

export function getEmailForExperiment(userId: number | null, pageType: ExperimentPageType, isPractice: boolean = false): Email {
  // Practice mode always uses practice email
  if (isPractice) {
    return practiceEmail;
  }

  // If no userId, default to email1
  if (!userId) {
    return email1;
  }

  const remainder = userId % 12;

  if (pageType === ExperimentPageType.ManualEdit) {
    if (remainder === 0 || remainder === 3 || remainder === 6 || remainder === 9) {
      return email1; // 商品の状態について
    } else if (remainder === 1 || remainder === 4 || remainder === 7 || remainder === 10) {
      return email2; // 配送方法と梱包について
    } else {
      return email3; // 価格の相談について
    }
  } else if (pageType === ExperimentPageType.TextPrompting) {
    if (remainder === 2 || remainder === 4 || remainder === 7 || remainder === 11) {
      return email1; // 商品の状態について
    } else if (remainder === 0 || remainder === 5 || remainder === 8 || remainder === 9) {
      return email2; // 配送方法と梱包について
    } else {
      return email3; // 価格の相談について
    }
  } else if (pageType === ExperimentPageType.ThinkAloud) {
    if (remainder === 1 || remainder === 5 || remainder === 8 || remainder === 10) {
      return email1; // 商品の状態について
    } else if (remainder === 2 || remainder === 3 || remainder === 6 || remainder === 11) {
      return email2; // 配送方法と梱包について
    } else {
      return email3; // 価格の相談について
    }
  }

  // Fallback to email1
  return email1;
}