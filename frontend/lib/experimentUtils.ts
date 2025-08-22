import { product1, product2, practiceData, Product } from './products';
import { email1, email2, practiceEmail, Email } from './emails';

export enum ExperimentPageType {
  ManualEdit = 'manual-edit',
  ThinkAloud = 'think-aloud',
  TextPrompting = 'text-prompting'
}

export function getProductForExperiment(userId: number | null, pageType: ExperimentPageType, isPractice: boolean = false): Product {
  // Practice mode always uses pencil
  if (isPractice) {
    return practiceData;
  }

  // If no userId, default to product1 (ferret)
  if (!userId) {
    return product1;
  }

  const remainder = userId % 4;

  if (pageType === ExperimentPageType.ManualEdit) {
    if (remainder === 0 || remainder === 3) {
      return product1; // フェレット
    } else { // remainder === 1 || remainder === 2
      return product2; // ペンギン
    }
  } else if (pageType === ExperimentPageType.ThinkAloud) {
    if (remainder === 0 || remainder === 3) {
      return product2; // ペンギン
    } else { // remainder === 1 || remainder === 2
      return product1; // フェレット
    }
  } else if (pageType === ExperimentPageType.TextPrompting) {
    if (remainder === 0 || remainder === 3) {
      return product2; // ペンギン
    } else { // remainder === 1 || remainder === 2
      return product1; // フェレット
    }
  }

  // Fallback to product1
  return product1;
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

  const remainder = userId % 4;

  if (pageType === ExperimentPageType.ManualEdit) {
    if (remainder === 0 || remainder === 3) {
      return email1; // 商品の状態について
    } else { // remainder === 1 || remainder === 2
      return email2; // 配送方法と梱包について
    }
  } else if (pageType === ExperimentPageType.ThinkAloud) {
    if (remainder === 0 || remainder === 3) {
      return email2; // 配送方法と梱包について
    } else { // remainder === 1 || remainder === 2
      return email1; // 商品の状態について
    }
  } else if (pageType === ExperimentPageType.TextPrompting) {
    if (remainder === 0 || remainder === 3) {
      return email2; // 配送方法と梱包について
    } else { // remainder === 1 || remainder === 2
      return email1; // 商品の状態について
    }
  }

  // Fallback to email1
  return email1;
}