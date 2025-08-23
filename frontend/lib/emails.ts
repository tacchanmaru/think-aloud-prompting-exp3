// lib/emails.ts
export interface Email {
  id: string;
  subject: string;
  content: string;
  sender: string;
}

export const email1: Email = {
  id: 'email1',
  subject: '商品の状態について教えてください',
  content: `いつもお世話になっております。

先日、こちらの商品を拝見させていただきました。とても素敵な商品だと思うのですが、いくつか質問がございます。

商品の使用感や傷の有無について詳しく教えていただけますでしょうか。また、ペットを飼っているのですが、ペットの毛やにおいなどは付着していないでしょうか。

お忙しい中恐れ入りますが、ご回答いただけますと幸いです。

よろしくお願いいたします。`,
  sender: 'user@example.com'
};

export const email2: Email = {
  id: 'email2',
  subject: '配送方法と梱包について',
  content: `お疲れ様です。

こちらの商品の購入を検討しております。

配送方法はどのようなものをお考えでしょうか。できれば匿名配送を希望しているのですが、対応可能でしょうか。また、梱包はどのような形で行っていただけるのか教えてください。

プレゼント用に購入を考えているため、できるだけ丁寧な梱包をお願いできればと思います。

ご確認のほど、よろしくお願いいたします。`,
  sender: 'buyer123@example.com'
};

export const email3: Email = {
  id: 'email3',
  subject: '価格の相談について',
  content: `こんにちは。

こちらの商品に興味を持っております。

現在の価格設定について、少しご相談があります。予算の都合もあり、もし可能でしたら少しお値下げしていただくことは可能でしょうか。

失礼な質問で申し訳ございませんが、ご検討いただければ幸いです。

どうぞよろしくお願いいたします。`,
  sender: 'bargain@example.com'
};

// Practice mode data
export const practiceEmail: Email = {
  id: 'practice',
  subject: '購入させていただきたいです',
  content: `はじめまして。

こちらの商品に興味があり、ぜひ購入させていただきたいと思っています。

即購入は可能でしょうか。また、他にも同じような商品をお持ちでしたら、合わせて拝見させていただきたいです。

お返事をお待ちしております。

よろしくお願いいたします。`,
  sender: 'practice@example.com'
};