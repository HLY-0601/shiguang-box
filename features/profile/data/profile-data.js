/* ================================================================
 作者资料（自我介绍页）显示内容。
 字段留空则对应徽章/段落自动隐藏：
 mbti / ageStatus / gameName 为空不显示徽章；
 extraInfo 为空不显示折叠区；avatarImage 为空用名字首字做头像。
 ================================================================ */

export const PROFILE = {
  name: '夜悦',
  tagline: '我不想恨海情天，我想我的生活如日中天',
  taglineEn: 'I do not want a love-torn sky; I want my life in full daylight.',
  mbti: 'INTJ',
  ageStatus: '20',
  ageStatusEn: '20',
  gameName: '',
  bio: '',
  bioEn: '',
  extraInfo: '',
  extraInfoEn: '',
  avatarImage: 'data:image/jpeg;base64,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',
  label: '自我介绍',
  footnote: '',
};

export const LINKS = [
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-link"/></svg>',
    title: '时光盒 · 光遇工具合集',
    titleEn: 'Shiguang-Box · Sky Fan Tools',
    url: 'https://hly-0601.github.io/shiguang-box/',
    description: '物品、表情、光翼、先祖树、复刻先祖、乐谱、蜡烛计算等整合在一个 PWA 里，数据保存在本机。',
    descriptionEn: 'Items, emotes, wings, spirit trees, visits, music sheets and candle calculators in one PWA; data stays local.',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-link"/></svg>',
    title: '讳序 · 功能菜单',
    titleEn: 'Huixu · Bot Menu',
    url: 'https://hly-0601.github.io/',
    description: '香江助手菜单卡片静态页，共 139 项功能入口。',
    descriptionEn: 'Static menu-card page for the bot, with 139 feature entries.',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-link"/></svg>',
    title: '超自然 · 皮肤代码库',
    titleEn: 'Skin Code Library',
    url: 'https://hly-0601.github.io/skin-code-library/',
    description: '全角色皮肤代码收录：133 款员工皮肤 + 176 款道具，苹果风界面，邮箱认证。',
    descriptionEn: 'All-character skin codes: 133 character skins + 176 items, Apple-style UI with email auth.',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-link"/></svg>',
    title: 'Mnemo Sonnet Agent',
    titleEn: 'Mnemo Sonnet Agent',
    url: 'https://github.com/HLY-0601/mnemo-sonnet-agent',
    description: '记忆驱动的自我进化模型：纯 numpy Transformer + ReAct Agent + 记忆引擎 + 自动进化闭环。',
    descriptionEn: 'Memory-driven self-evolving agent: pure-numpy Transformer + ReAct + memory engine + auto-evolution loop.',
  },
  {
    icon: '<svg class="inline-icon" width="20" height="20"><use href="#pv-i-link"/></svg>',
    title: 'GitHub 主页',
    titleEn: 'GitHub Profile',
    url: 'https://github.com/HLY-0601',
    description: '全部公开项目都在这里。',
    descriptionEn: 'All public projects are here.',
  },
];
