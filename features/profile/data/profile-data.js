/* ================================================================
 作者资料（自我介绍页）显示内容。
 字段留空则对应徽章/段落自动隐藏：
 mbti / ageStatus / gameName 为空不显示徽章；
 extraInfo 为空不显示折叠区；avatarImage 为空用名字首字做头像。
 ================================================================ */

export const PROFILE = {
  // 展示名（GitHub 账号名：夜悦）
  name: '夜悦',
  tagline: '喜欢捣鼓各种小工具',
  taglineEn: 'I like building little tools.',

  // MBTI
  mbti: 'INTJ',

  // 年龄状态
  ageStatus: '20',
  ageStatusEn: '20',

  // 游戏内昵称（留空则不显示）
  gameName: '',

  bio: '平时会把自己用得上的小工具做成网站或页面放出来。\n目前主要在维护光遇粉丝工具合集，也做过机器人菜单卡片、皮肤代码库和 AI 记忆模型相关的小项目。\n数据基本都存在本地浏览器，不经过服务器。',
  bioEn: "I usually build and publish whatever tools I find useful myself.\nI mainly maintain a Sky fan-tool collection, and have also built bot menu cards, a skin code library, and small AI memory-model projects.\nData stays in the local browser; nothing goes through a server.",

  // 折叠区「感兴趣的人」（留空则整块隐藏）
  extraInfo: '除了光遇，也在折腾 QQ 机器人、模型微调、游戏拆包这些方向，有同好欢迎交流。',
  extraInfoEn: 'Besides Sky, I dabble in QQ bots, model fine-tuning, and game data extraction. Feel free to reach out if we share an interest.',

  // 头像图片地址（留空用名字首字）
  avatarImage: '',

  // 卡片右上角小标签
  label: '自我介绍',

  // 页脚小字（留空自动生成 © 年份 名字）
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
