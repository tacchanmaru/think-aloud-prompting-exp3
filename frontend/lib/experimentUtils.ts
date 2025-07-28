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

// Generate reply template with quoted original message
export function generateReplyTemplate(originalMail: Mail): string {
  const quotedText = originalMail.text
    .split('\n')
    .map(line => `| ${line}`)
    .join('\n');
  
  return `

${quotedText}`;
}

// Generate received mail part (quoted with |)
export function generateReceivedMail(originalMail: Mail): string {
  return originalMail.text
    .split('\n')
    .map(line => `| ${line}`)
    .join('\n');
}

// Generate initial reply part (two empty lines)
export function generateInitialReply(): string {
  return '\n\n';
}

// Combine reply and received mail
export function combineReplyAndReceived(reply: string, receivedMail: string): string {
  return `${reply}${receivedMail}`;
}

// Separate combined text back into reply and received mail parts
export function separateReplyAndReceived(combinedText: string): { reply: string; receivedMail: string } {
  const lines = combinedText.split('\n');
  const firstQuoteLineIndex = lines.findIndex(line => line.startsWith('|'));
  
  if (firstQuoteLineIndex === -1) {
    // No quoted lines found, everything is reply
    return {
      reply: combinedText,
      receivedMail: ''
    };
  }
  
  const replyLines = lines.slice(0, firstQuoteLineIndex);
  const receivedLines = lines.slice(firstQuoteLineIndex);
  
  return {
    reply: replyLines.join('\n'),
    receivedMail: receivedLines.join('\n')
  };
}
