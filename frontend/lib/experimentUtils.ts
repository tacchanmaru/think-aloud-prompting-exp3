import { product1, product2, practiceData, Product } from './products';

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