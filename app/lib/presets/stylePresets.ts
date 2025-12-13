export interface StylePreset {
  id: string
  label: string
  description: string
  promptHint: string
  category?: string
}

export interface StyleCategory {
  id: string
  label: string
}

// カテゴリは使用しないが、型互換性のために残す
export const styleCategories: StyleCategory[] = []

export const stylePresets: StylePreset[] = [
  {
    id: 'gentle',
    label: '優しい',
    description: 'やさしい雰囲気',
    promptHint: '優しい雰囲気、パステルカラー、丸みのある文字、温かみのある色合い、写真に馴染む',
  },
  {
    id: 'heartwarming',
    label: 'キュンとする',
    description: 'キュンとくる感じ',
    promptHint: 'キュンとする雰囲気、ハートや星の装飾、かわいらしい文字、ロマンチックな色合い',
  },
  {
    id: 'relaxed',
    label: 'ほっとする',
    description: 'ほっとする雰囲気',
    promptHint: 'ほっとする雰囲気、落ち着いた色合い、柔らかい印象、リラックスした感じ',
  },
  {
    id: 'nostalgic',
    label: '懐かしい',
    description: '懐かしい感じ',
    promptHint: '懐かしい雰囲気、ノスタルジックな色合い、レトロな印象、温かい雰囲気',
  },
  {
    id: 'angry',
    label: '怒っている',
    description: '怒っている感じ',
    promptHint: '怒っている雰囲気、強いコントラスト、太めの文字、赤や黒を基調とした色合い',
  },
  {
    id: 'crazy',
    label: 'イカれている',
    description: 'イカれた感じ',
    promptHint: 'イカれた雰囲気、派手な色、グラフィティ風、エネルギッシュ、目立つデザイン',
  },
  {
    id: 'wild',
    label: 'ぶっ飛んでいる',
    description: 'ぶっ飛んだ感じ',
    promptHint: 'ぶっ飛んだ雰囲気、ネオンカラー、激しいコントラスト、未来的、破壊的なデザイン',
  },
  {
    id: 'regretful',
    label: '悔しい',
    description: '悔しい感じ',
    promptHint: '悔しい雰囲気、少し暗めの色合い、力強い文字、感情的な印象',
  },
  {
    id: 'joyful',
    label: '嬉しい',
    description: '嬉しい感じ',
    promptHint: '嬉しい雰囲気、明るい色、元気な印象、楽しいデザイン、写真映えする',
  },
  {
    id: 'excited',
    label: 'テンション上がる',
    description: 'テンション上がる感じ',
    promptHint: 'テンション上がる雰囲気、カラフル、エネルギッシュ、躍動感のあるデザイン',
  },
  {
    id: 'cool',
    label: 'かっこいい',
    description: 'かっこいい感じ',
    promptHint: 'かっこいい雰囲気、シャープな文字、スタイリッシュ、洗練されたデザイン',
  },
  {
    id: 'cute',
    label: 'かわいい',
    description: 'かわいい感じ',
    promptHint: 'かわいい雰囲気、丸みのある文字、パステルカラー、ふんわりした印象',
  },
  {
    id: 'funny',
    label: '面白い',
    description: '面白い感じ',
    promptHint: '面白い雰囲気、遊び心のあるデザイン、コミカル、楽しい印象',
  },
  {
    id: 'sad',
    label: '悲しい',
    description: '悲しい感じ',
    promptHint: '悲しい雰囲気、落ち着いた色合い、控えめな印象、感情的なデザイン',
  },
  {
    id: 'surprised',
    label: 'びっくり',
    description: 'びっくりした感じ',
    promptHint: 'びっくりした雰囲気、インパクトのあるデザイン、目立つ色、驚きの表現',
  },
  {
    id: 'romantic',
    label: 'ロマンチック',
    description: 'ロマンチックな感じ',
    promptHint: 'ロマンチックな雰囲気、ハートや花の装飾、優しい色合い、温かい印象',
  },
  {
    id: 'energetic',
    label: 'エネルギッシュ',
    description: 'エネルギッシュな感じ',
    promptHint: 'エネルギッシュな雰囲気、動きのあるデザイン、カラフル、活気のある印象',
  },
  {
    id: 'calm',
    label: '落ち着いている',
    description: '落ち着いた感じ',
    promptHint: '落ち着いた雰囲気、シンプルなデザイン、上品な色合い、静かな印象',
  },
  {
    id: 'mysterious',
    label: '神秘的',
    description: '神秘的な感じ',
    promptHint: '神秘的な雰囲気、暗めの色合い、幻想的なデザイン、不思議な印象',
  },
  {
    id: 'cheerful',
    label: '明るい',
    description: '明るい感じ',
    promptHint: '明るい雰囲気、鮮やかな色、ポジティブな印象、楽しいデザイン',
  },
  {
    id: 'sexy',
    label: 'セクシー',
    description: 'セクシーな感じ',
    promptHint: 'セクシーな雰囲気、大人っぽい色合い、スタイリッシュ、魅力的なデザイン',
  },
  {
    id: 'super-sexy',
    label: '超セクシー',
    description: '超セクシーな感じ',
    promptHint: '超セクシーな雰囲気、洗練された色合い、エレガント、魅惑的なデザイン',
  },
  {
    id: 'extremely-sexy',
    label: 'やばいくらいセクシー',
    description: 'やばいくらいセクシーな感じ',
    promptHint: 'やばいくらいセクシーな雰囲気、強烈な印象、大胆なデザイン、魅力的',
  },
  {
    id: 'kimokawaii',
    label: 'キモかわいい',
    description: 'キモかわいい感じ',
    promptHint: 'キモかわいい雰囲気、独特なデザイン、インパクトのある色合い、個性的',
  },
  {
    id: 'surreal',
    label: 'シュール',
    description: 'シュールな感じ',
    promptHint: 'シュールな雰囲気、不思議なデザイン、非現実的な印象、アート的',
  },
  {
    id: 'dasshikawaii',
    label: 'ダサかわいい',
    description: 'ダサかわいい感じ',
    promptHint: 'ダサかわいい雰囲気、レトロな色合い、ノスタルジック、親しみやすい',
  },
  {
    id: 'happy',
    label: '幸せ',
    description: '幸せな感じ',
    promptHint: '幸せな雰囲気、明るい色、温かい印象、ポジティブなデザイン',
  },
  {
    id: 'super-happy',
    label: '超幸せな感じ',
    description: '超幸せな感じ',
    promptHint: '超幸せな雰囲気、とても明るい色、エネルギッシュ、最高にポジティブなデザイン',
  },
  {
    id: 'nostalgic-moment',
    label: 'あの時を思い出した時',
    description: 'あの時を思い出した時の感じ',
    promptHint: 'あの時を思い出した時の雰囲気、ノスタルジック、懐かしい色合い、温かい印象',
  },
  {
    id: 'space',
    label: '宇宙に行きたい',
    description: '宇宙に行きたい感じ',
    promptHint: '宇宙に行きたい雰囲気、星空、神秘的、未来的、幻想的なデザイン',
  },
  {
    id: 'ocean',
    label: '海',
    description: '海の感じ',
    promptHint: '海の雰囲気、青い色、爽やか、開放感、リラックスしたデザイン',
  },
  {
    id: 'sky',
    label: '空',
    description: '空の感じ',
    promptHint: '空の雰囲気、青空、爽やか、広がり、開放的なデザイン',
  },
  {
    id: 'mountain',
    label: '山',
    description: '山の感じ',
    promptHint: '山の雰囲気、自然、落ち着いた色合い、力強い印象、雄大なデザイン',
  },
  {
    id: 'american',
    label: 'アメリカン',
    description: 'アメリカンな感じ',
    promptHint: 'アメリカンな雰囲気、星条旗風、ポップ、エネルギッシュ、自由なデザイン',
  },
  {
    id: 'teyandei',
    label: 'てやんでい',
    description: 'てやんでいな感じ',
    promptHint: 'てやんでいな雰囲気、江戸っ子風、粋、シャレた、和風モダンなデザイン',
  },
  {
    id: 'onushi',
    label: 'お主、なかなかやるな',
    description: 'お主、なかなかやるな',
    promptHint: 'お主、なかなかやるな雰囲気、時代劇風、武士、誇らしげ、力強いデザイン',
  },
  {
    id: 'kuu-king',
    label: 'クゥーの王様',
    description: 'クゥーの王様',
    promptHint: 'クゥーの王様の雰囲気、王冠、高貴、威厳、豪華なデザイン',
  },
  {
    id: 'kuu-towa',
    label: 'クゥーとは',
    description: 'クゥーとは',
    promptHint: 'クゥーとはの雰囲気、哲学的、深い、思索的、知的なデザイン',
  },
  {
    id: 'kuu-next',
    label: 'クゥーの次は何',
    description: 'クゥーの次は何',
    promptHint: 'クゥーの次は何の雰囲気、疑問、探求、未来への期待、前向きなデザイン',
  },
  {
    id: 'yayoi',
    label: '弥生時代',
    description: '弥生時代',
    promptHint: '弥生時代の雰囲気、古代、原始、土器、自然、歴史的なデザイン',
  },
  {
    id: 'heian',
    label: '平安時代',
    description: '平安時代',
    promptHint: '平安時代の雰囲気、雅、優雅、和風、貴族、上品なデザイン',
  },
  {
    id: 'edo',
    label: '江戸時代',
    description: '江戸時代',
    promptHint: '江戸時代の雰囲気、粋、町人文化、浮世絵風、和風、親しみやすいデザイン',
  },
  {
    id: 'azuchi-momoyama',
    label: '安土桃山時代',
    description: '安土桃山時代',
    promptHint: '安土桃山時代の雰囲気、豪華絢爛、金箔、派手、権力、華やかなデザイン',
  },
  {
    id: 'sengoku',
    label: '戦国時代',
    description: '戦国時代',
    promptHint: '戦国時代の雰囲気、武将、力強い、戦い、勇ましい、迫力のあるデザイン',
  },
  {
    id: 'samurai',
    label: 'サムライ',
    description: 'サムライ',
    promptHint: 'サムライの雰囲気、武士、侍、刀、誇り、力強いデザイン',
  },
  {
    id: 'samurai-burger',
    label: 'サムライバーガー',
    description: 'サムライバーガー',
    promptHint: 'サムライバーガーの雰囲気、和洋折衷、ユニーク、面白い、カジュアルなデザイン',
  },
  {
    id: 'mcdonalds',
    label: 'マクドナルド',
    description: 'マクドナルド',
    promptHint: 'マクドナルドの雰囲気、ファストフード、赤と黄色、ポップ、親しみやすいデザイン',
  },
  {
    id: 'hungry',
    label: 'お腹へった',
    description: 'お腹へった',
    promptHint: 'お腹へった雰囲気、食べ物、食欲、温かい、親しみやすいデザイン',
  },
  {
    id: 'very-hungry',
    label: 'お腹と背中がくっつきそう',
    description: 'お腹と背中がくっつきそう',
    promptHint: 'お腹と背中がくっつきそうな雰囲気、とてもお腹が空いた、切実、ユーモラスなデザイン',
  },
]

