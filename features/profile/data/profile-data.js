/* ================================================================
   作者プロフィール（自己紹介ページ）の表示内容。
   移植元: profile/index.html の <script> 冒頭にあった `profile` / `links`
   の2つのオブジェクト・配列を、値を一切変えずにそのままES moduleへ
   移した。site-dock/pf-modal/tools-drawer等の共有chrome向けのリンク
   （SITE_LINKS）とは別物で、こちらは「Links」セクション自体の見出し・
   説明文（サイト運営者向けの日本語コメントも含め、編集のしやすさを
   優先した元の1件ずつのオブジェクト形式）をそのまま保持する。

   icon フィールドのみ、元実装（<use href="#i-xxx"/>）から参照先を
   tai-hub側のアイコンID体系に合わせて更新している（表示は同一）：
   ・tai-hub共有スプライト(js/icon-sprite.js)に既にあるもの
     （i-folder/i-masks/i-pin/i-candle/i-star-candle/i-sparkle/i-wing/
     i-music-note/i-card/i-sync）はそのまま #i-xxx を参照。
   ・共有スプライトに無いもの（i-x-logo・i-box）だけ、このツール専用の
     ローカルスプライト（profile-view.js が注入。id先頭 pv-i-）を参照する
     よう #pv-i-xxx に差し替えた。
   ================================================================ */

export const PROFILE = {
  name: 'たい',
  tagline: 'ものづくりが好きです',
  // ▼ 英語表示用（空欄ならtaglineが代わりに表示されます）
  taglineEn: 'I love making things.',

  // MBTIタイプ（空欄なら非表示になります）
  mbti: 'ISTJ',

  // 年齢ステータス（空欄なら非表示になります）
  ageStatus: '成人済み',
  // ▼ 英語表示用（空欄ならageStatusが代わりに表示されます）
  ageStatusEn: 'Adult',

  // ゲーム内の名前（空欄なら非表示になります）
  gameName: 'Paㅋ',

  bio: '普段は自分が欲しいと思ったサイトを作って公開しています。\n効率化やちょっとしたグリッチ技を扱うのが好きです。\n含み笑いのスカウトマスクを愛用している方とフレンドになりたいです。',
  // ▼ 英語表示用（空欄ならbioが代わりに表示されます）
  bioEn: "I usually build and publish whatever websites I feel like I need myself.\nI enjoy efficiency tricks and the occasional small glitch technique.\nI'd love to be friends with anyone who wears the smirking Scout mask.",

  // 「もっと知りたい人向け」を押すと表示される追加情報（空欄なら非表示になります）
  extraInfo: 'Sky以外に、モンストやイナクロもプレイしている方仲良くしてくれると嬉しいです\n切り絵の作成やイラストを描いたりと、いろんなことに手を出しています！',
  // ▼ 英語表示用（空欄ならextraInfoが代わりに表示されます）
  extraInfoEn: "Besides Sky, I'd be happy to get along with anyone who also plays Monster Strike or Inazuma Eleven Climax.\nI also dabble in a bunch of other things, like paper cutting art and illustration!",

  // 写真を使いたい場合はここにファイル名やURLを入れてください
  avatarImage: 'https://pbs.twimg.com/profile_images/2056923572296437760/EnPe2tws_400x400.jpg',

  // 右上の小さなラベル文字
  label: 'SELF INTRODUCTION',

  // ページ下部の小さな文字（空欄なら「© 年 名前」が自動で入ります）
  footnote: '',
};

export const LINKS = [
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-x-logo"/></svg>',
    title: 'X (Twitter)',
    titleEn: 'X (Twitter)',
    url: 'https://x.com/skyzztai',
    description: '日々のぼやきやスクショ、メモなど\nゆるい呟きを投稿しています！\n早く返信してほしい・確実に読んでほしい内容は、リプライ・引用・DMでお送りください！',
    descriptionEn: 'I post casual day-to-day musings, screenshots, and notes.\nIf you want a fast reply, or want to make sure I actually see something, please send it as a reply, quote tweet, or DM!',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-box"/></svg>',
    title: 'お題箱',
    titleEn: 'Odaibako (Question Box)',
    url: 'https://odaibako.net/u/Skyzztai',
    description: '感想やご意見はこちらへどうぞ。\nDMやリプで送りにくい内容も気軽にお送りください！',
    descriptionEn: "Feel free to send feedback or thoughts here.\nIt's also a good place for anything that feels awkward to send as a DM or reply!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-folder"/></svg>',
    title: 'アイテム所持管理',
    titleEn: 'Item Ownership Tracker',
    url: 'https://taipak5000.github.io/tai-item/',
    description: '所持しているアイテムの管理や、\n未所持アイテムの入手コストを確認できます。\nウィッシュリストも作れるので、集めたい方におすすめ！',
    descriptionEn: "Track which items you own and check the acquisition cost of items you don't.\nYou can also build a wishlist, so it's great if you're going for a collection!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-masks"/></svg>',
    title: 'エモート所持率管理',
    titleEn: 'Emote Collection Tracker',
    url: 'https://taipak5000.github.io/tai-emote/',
    description: '所持しているエモートの管理や、\nレベルごとの取得状況を確認できます。\nコンプリート状況を把握したい方におすすめ！',
    descriptionEn: 'Track which emotes you own and see your progress by level.\nGreat if you want to keep tabs on your completion rate!',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-pin"/></svg>',
    title: '創作物管理ツール',
    titleEn: 'Creation Deadline Manager',
    url: 'https://taipak5000.github.io/share/',
    description: 'シェアメモやスペース、メセボなどの\n期限を管理できるツールです。\n投稿の期限切れを見逃したくない方におすすめ！',
    descriptionEn: "A tool for tracking the expiry dates of Share Memos, Spaces, Message Boards, and the like.\nGreat if you don't want to accidentally miss a post's expiration!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-candle"/></svg>',
    title: 'ノマキャン計算機',
    titleEn: 'Normal Candle Calculator',
    url: 'https://taipak5000.github.io/tai-nomacan/',
    description: '目標本数と1日の集めペースを入力するだけで、\n達成予定日や必要なキャンドル本数がわかります。\nノーマルキャンドルを計画的に集めたい方におすすめ！',
    descriptionEn: "Just enter your target amount and your daily collection pace to see your projected completion date and how many candles you still need.\nGreat for planning out your Normal Candle collecting!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-star-candle"/></svg>',
    title: '星のキャンドル計算機',
    titleEn: 'Star Candle Calculator',
    url: 'https://taipak5000.github.io/star-candle/',
    description: '目標本数と所持本数を入力するだけで、\n達成時期の目安と赤闇の自動予測がわかります。\n目標達成日を知っておきたい方におすすめ！',
    descriptionEn: "Just enter your target amount and how many you currently own to get an estimated completion date and automatic shard predictions.\nGreat if you want to know roughly when you'll hit your goal!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-sparkle"/></svg>',
    title: '精霊同行ツール',
    titleEn: 'Spirit Companion Tool',
    url: 'https://taipak5000.github.io/companion/',
    description: '精霊の連れ歩き状況を管理できるサイトです。\nアイテム交換やツリーの進行度がひと目で分かります。\n欲しいアイテムを効率よく集めたい方におすすめ！',
    descriptionEn: 'A site for tracking which spirits you\'re currently taking with you.\nSee item trades and friendship tree progress at a glance.\nGreat if you want to efficiently collect the items you want!',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-wing"/></svg>',
    title: '羽トラッカー',
    titleEn: 'Wing Tracker',
    url: 'https://taipak5000.github.io/wings/',
    description: '初期の羽枚数や、\nまだ羽をもらえていない再訪を確認できます。\n羽の管理をしたい方におすすめ！',
    descriptionEn: "Check your starting wing count and which revisits you haven't claimed wings from yet.\nGreat if you want to keep your wing collection organized!",
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-wing"/></svg>',
    title: '再訪精霊データベース',
    titleEn: 'Revisit Spirit Database',
    url: 'https://taipak5000.github.io/tai-revisit/',
    description: '過去に来訪した精霊の来訪履歴を検索できる、\n閲覧専用の参考データベースです。\n過去の再訪情報をサクッと調べたい方におすすめ！',
    descriptionEn: 'A read-only reference database for looking up the visit history of past Traveling and Returning Spirits.\nGreat if you just want to quickly look up past revisit info!',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-music-note"/></svg>',
    title: '楽譜づくり',
    titleEn: 'Sheet Music Maker',
    url: 'https://taipak5000.github.io/tai-score/',
    description: 'Skyの楽器で演奏できる楽譜を、自由に作成・保存・共有・練習できるツールです。\nまだ動作に不安がある部分があるので、その点はご了承ください。',
    descriptionEn: 'A tool for freely creating, saving, sharing, and practicing sheet music playable on Sky\'s instruments.\nSome parts are still a bit unstable, so please keep that in mind!',
    badgeTest: true,
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-card"/></svg>',
    title: '星紡ぎカード',
    titleEn: 'Self-Intro Card Maker',
    url: 'https://taipak5000.github.io/tai-card/',
    description: '自己紹介カードを自由に作成・保存・共有できるツールです。',
    descriptionEn: 'A tool for freely creating, saving, and sharing self-intro cards.',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#i-sync"/></svg>',
    title: 'データ引継ぎ',
    titleEn: 'Data Transfer',
    url: 'https://taipak5000.github.io/tai-transfer/',
    description: '引き継ぎコードを使って、複数の端末間で\n各サイトのデータを移行できます。\n機種変更やブラウザの引っ越しをしたい方におすすめ！',
    descriptionEn: "Use a transfer code to move your data between devices across each site.\nGreat if you're switching phones or moving to a different browser!",
  },
];
