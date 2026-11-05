/**
 * 紫微斗数 · 排盘核心算法（紫微斗数安星法）
 *
 * 依据（均注明于 README）：
 *   - 《紫微斗数全书》安星法 / 王亭之《中州派紫微斗数初级讲义》（明灯易学整理转载）
 *   - 《紫微斗数精成》（口诀排盘法）
 *   - 公历转农历与节气数据表（1900–2100）取自开源项目 solarlunar（JJonline，MIT License）
 *
 * 安星流程：
 *   1. 公历 → 农历（闰月排盘口径：闰月作下月推算，另有流派以闰月十五日为界）
 *   2. 四柱：年柱（默认立春为年界，可切换正月初一）、月柱（五虎遁）、日柱、时柱（五鼠遁）
 *   3. 命宫/身宫：寅宫起正月顺数至生月，落宫起子时，逆数安命、顺数安身
 *   4. 十二宫：命宫起逆时针布 兄弟/夫妻/子女/财帛/疾厄/迁移/仆役/官禄/田宅/福德/父母
 *   5. 十二宫天干：年干按五虎遁定寅宫天干，顺排
 *   6. 五行局：命宫干支纳音五行（金四 / 水二 / 木三 / 土五 / 火六）
 *   7. 紫微星：局数除日数（只加不减到整除，阳退阴进）
 *   8. 十四主星：紫微星系逆布（天机、太阳、武曲、天同、廉贞），天府星系顺布（太阴、贪狼、巨门、天相、天梁、七杀、破军）
 *   9. 辅星：左辅右弼（月系）、文昌文曲（时系）、地空地劫（时系）、天魁天钺（年干）、
 *      禄存擎羊陀罗（年干）、火星铃星（年支+时支）、天马（年支）
 *  10. 四化：生年干四化（通行版：戊贪阴右机 / 庚阳武阴同 / 壬梁紫左武）
 *  11. 命主、身主；大限（起限岁数=五行局数，阳男阴女顺行、阴男阳女逆行）
 *
 * 零依赖，浏览器与 Node.js 通用。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ZiWeiPan = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- 基础表 ---------- */
  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var PALACE = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']; // 宫序，寅=0
  var WUXING = ['木', '金', '水', '火', '土'];

  /* 十二宫名（命宫起，逆时针） */
  var PALACE_NAMES = ['命宫', '兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'];

  /* ---------- 六十甲子纳音 ---------- */
  var NAYIN = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水', '甲午': '砂中金', '乙未': '砂中金',
    '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
  };
  var JU_OF_WUXING = { '金': '金四局', '水': '水二局', '木': '木三局', '土': '土五局', '火': '火六局' };
  var JU_NUM = { '金四局': 4, '水二局': 2, '木三局': 3, '土五局': 5, '火六局': 6 };

  /* ---------- 农历数据表 1900–2100（solarlunar，MIT） ---------- */
  var LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
    0x0d520
  ];

  var LTERM_INFO = [
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f',
    '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f',
    'b027097bd097c36b0b6fc9274c91aa', '9778397bd19801ec9210c965cc920e', '97b6b97bd19801ec95f8c965cc920f',
    '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd197c36c9210c9274c91aa',
    '97b6b97bd19801ec95f8c965cc920e', '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec95f8c965cc920e', '97bcf97c3598082c95f8e1cfcc920f',
    '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f',
    '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf97c359801ec95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd097bd07f595b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9210c8dc2', '9778397bd19801ec9210c9274c920e', '97b6b97bd19801ec95f8c965cc920f',
    '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
    '97b6b97bd19801ec95f8c965cc920f', '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bd07f1487f595b0b0bc920fb0722',
    '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f531b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
    '97bcf7f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b97bd19801ec9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '9778397bd097c36b0b6fc9210c91aa', '97b6b97bd197c36c9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
    '97b6b7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
    '9778397bd097c36b0b70c9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
    '97b6b7f0e47f531b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '9778397bd097c36b0b6fc9210c91aa', '97b6b7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '977837f0e37f149b0723b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c35b0b6fc9210c8dc2',
    '977837f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
    '7f0e397bd097c35b0b6fc9210c8dc2', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '977837f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
    '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd',
    '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
    '977837f0e37f14998082b0723b06bd', '7f07e7f0e37f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f595b0b0bb0b6fb0722', '7f0e37f0e37f14898082b0723b02d5',
    '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f531b0b0bb0b6fb0722',
    '7f0e37f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e37f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35',
    '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
    '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f149b0723b0787b0721',
    '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0723b06bd',
    '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722', '7f0e37f0e366aa89801eb072297c35',
    '7ec967f0e37f14998082b0723b06bd', '7f07e7f0e37f14998083b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
    '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14898082b0723b02d5', '7f07e7f0e37f14998082b0787b0721',
    '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66aa89801e9808297c35', '665f67f0e37f14898082b0723b02d5',
    '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66a449801e9808297c35',
    '665f67f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
    '7f0e36665b66a449801e9808297c35', '665f67f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
    '7f07e7f0e47f531b0723b0b6fb0721', '7f0e26665b66a449801e9808297c35', '665f67f0e37f1489801eb072297c35',
    '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722'
  ];

  /* ---------- 农历基础 ---------- */
  function leapMonth(y) { return LUNAR_INFO[y - 1900] & 0xf; }

  function leapDays(y) {
    return leapMonth(y) ? ((LUNAR_INFO[y - 1900] & 0x10000) ? 30 : 29) : 0;
  }

  function monthDays(y, m) {
    return (LUNAR_INFO[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  function lYearDays(y) {
    var i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) { sum += (LUNAR_INFO[y - 1900] & i) ? 1 : 0; }
    return sum + leapDays(y);
  }

  function getTerm(y, n) {
    if (y < 1900 || y > 2100 || n < 1 || n > 24) return -1;
    var table = LTERM_INFO[y - 1900];
    var info = [], k, s, i;
    for (k = 0; k < 6; k++) { info.push(parseInt('0x' + table.substr(k * 5, 5), 16).toString()); }
    var calDay = [];
    for (k = 0; k < 6; k++) {
      s = info[k];
      calDay.push(parseInt(s.substr(0, 1), 10), parseInt(s.substr(1, 2), 10),
        parseInt(s.substr(3, 1), 10), parseInt(s.substr(4, 2), 10));
    }
    return calDay[n - 1];
  }

  function solar2lunar(y, m, d) {
    if (y < 1900 || y > 2100) return null;
    if (y === 1900 && m === 1 && d < 31) return null;
    var offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
    var i, temp = 0;
    for (i = 1900; i < 2101 && offset > 0; i++) { temp = lYearDays(i); offset -= temp; }
    if (offset < 0) { offset += temp; i--; }
    var year = i;
    var leap = leapMonth(year);
    var isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && !isLeap) { i--; isLeap = true; temp = leapDays(year); }
      else { temp = monthDays(year, i); }
      if (isLeap && i === (leap + 1)) { isLeap = false; }
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) { isLeap = false; } else { isLeap = true; i--; }
    }
    if (offset < 0) { offset += temp; i--; }
    return { lYear: year, lMonth: i, lDay: offset + 1, isLeap: isLeap };
  }

  function ganZhiOfOffset(offset) {
    var o = ((offset % 60) + 60) % 60;
    return GAN[o % 10] + ZHI[o % 12];
  }

  /* 年柱：rule = 'lichun'（立春为年界，主流排盘口径）| 'newyear'（正月初一为年界） */
  function yearPillar(y, m, d, lunar, rule) {
    if (rule === 'newyear') { return ganZhiOfOffset(lunar.lYear - 4); }
    var idx = y - 4;
    var lichun = getTerm(y, 3);
    if (m < 2 || (m === 2 && d < lichun)) { idx -= 1; }
    return ganZhiOfOffset(idx);
  }

  /* 日柱：以 1900-01-31（农历庚子年正月初一，甲辰日）为基准 */
  function dayPillar(y, m, d) {
    var offset = (Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000;
    return ganZhiOfOffset(offset + 40); // 甲辰序 = 40
  }

  /* 五虎遁：年干 → 寅宫天干 */
  function yinGanOf(yearGanIdx) {
    var t = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0];
    return t[yearGanIdx];
  }

  /* 五鼠遁：日干 → 子时天干 */
  function ziGanOf(dayGanIdx) {
    var t = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8];
    return t[dayGanIdx];
  }

  /* ---------- 紫微星：局数除日数（《紫微斗数精成》口诀）。返回地支序（子=0） ---------- */
  function ziweiIndex(juNum, day) {
    var add = 0;
    while ((day + add) % juNum !== 0) { add++; }
    var q = (day + add) / juNum;
    var n = ((q - 1) % 12 + 12) % 12;      // 商 → 宫序（寅=0）
    n = (n + 2) % 12;                       // 转地支序（子=0）
    if (add === 0) { return n; }            // 整除：商所落宫
    if (add % 2 === 1) { return ((n - add) % 12 + 12) % 12; } // 单数：后退（逆）
    return (n + add) % 12;                  // 双数：前进（顺）
  }

  /* 天府：紫微 → 天府 对照（《安星诀》：唯有寅申同一位，其余丑卯互安星） */
  var ZIWEI_TIANFU = [4, 3, 2, 1, 0, 11, 10, 9, 8, 7, 6, 5]; // 以地支序（子=0）：紫微子→天府辰(4)…

  /* ---------- 十四主星 ---------- */
  function mainStars(ziwei, tianfu) {
    var m = {};
    m['紫微'] = ziwei;
    m['天机'] = (ziwei - 1 + 12) % 12;
    m['太阳'] = (ziwei - 3 + 12) % 12;
    m['武曲'] = (ziwei - 4 + 12) % 12;
    m['天同'] = (ziwei - 5 + 12) % 12;
    m['廉贞'] = (ziwei - 8 + 12) % 12;
    m['天府'] = tianfu;
    m['太阴'] = (tianfu + 1) % 12;
    m['贪狼'] = (tianfu + 2) % 12;
    m['巨门'] = (tianfu + 3) % 12;
    m['天相'] = (tianfu + 4) % 12;
    m['天梁'] = (tianfu + 5) % 12;
    m['七杀'] = (tianfu + 6) % 12;
    m['破军'] = (tianfu + 10) % 12; // 七杀后空三宫
    return m;
  }

  /* ---------- 四化（通行版） ---------- */
  var SIHUA = {
    '甲': ['廉贞', '破军', '武曲', '太阳'],
    '乙': ['天机', '天梁', '紫微', '太阴'],
    '丙': ['天同', '天机', '文昌', '廉贞'],
    '丁': ['太阴', '天同', '天机', '巨门'],
    '戊': ['贪狼', '太阴', '右弼', '天机'],
    '己': ['武曲', '贪狼', '天梁', '文曲'],
    '庚': ['太阳', '武曲', '太阴', '天同'],
    '辛': ['巨门', '太阳', '文曲', '文昌'],
    '壬': ['天梁', '紫微', '左辅', '武曲'],
    '癸': ['破军', '巨门', '太阴', '贪狼']
  };
  var SIHUA_NAME = ['禄', '权', '科', '忌'];

  /* ---------- 命主 / 身主（地支序，子=0） ---------- */
  var MING_ZHU = ['贪狼', '巨门', '禄存', '文曲', '廉贞', '武曲', '破军', '武曲', '廉贞', '文曲', '禄存', '巨门'];
  var SHEN_ZHU = ['铃星', '天相', '天梁', '天同', '文昌', '天机', '火星', '天相', '天梁', '天同', '文昌', '天机'];

  /* ---------- 辅星 ---------- */
  function minorStars(lunar, panMonth, hourIdx, yearGanIdx, yearZhiIdx) {
    var s = {};
    // 月系：左辅（辰宫起正月顺数）、右弼（戌宫起正月逆数）
    var chen = 4, xu = 10;
    s['左辅'] = (chen + panMonth - 1) % 12;
    s['右弼'] = ((xu - (panMonth - 1)) % 12 + 12) % 12;
    // 时系：文昌（戌宫起子时逆数）、文曲（辰宫起子时顺数）、地空（亥宫逆）、地劫（亥宫顺）
    s['文昌'] = ((xu - hourIdx) % 12 + 12) % 12;
    s['文曲'] = (chen + hourIdx) % 12;
    s['地空'] = ((11 - hourIdx) % 12 + 12) % 12;
    s['地劫'] = (11 + hourIdx) % 12;
    // 年干系：天魁天钺、禄存、擎羊、陀罗
    var kuiyue = [
      [1, 7], [0, 8], [11, 9], [11, 9], [1, 7], // 甲丑未 乙子申 丙亥酉 丁亥酉 戊丑未
      [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]   // 己子申 庚丑未 辛午寅 壬卯巳 癸卯巳
    ];
    s['天魁'] = kuiyue[yearGanIdx][0];
    s['天钺'] = kuiyue[yearGanIdx][1];
    var lu = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]; // 甲寅 乙卯 丙巳 丁午 戊巳 己午 庚申 辛酉 壬亥 癸子
    s['禄存'] = lu[yearGanIdx];
    s['擎羊'] = (lu[yearGanIdx] + 1) % 12;
    s['陀罗'] = ((lu[yearGanIdx] - 1) % 12 + 12) % 12;
    // 火星铃星（年支 + 时支）
    var huoStart, lingStart;
    if (yearZhiIdx === 2 || yearZhiIdx === 6 || yearZhiIdx === 10) { huoStart = 1; lingStart = 3; }      // 寅午戌：火丑 铃卯
    else if (yearZhiIdx === 8 || yearZhiIdx === 0 || yearZhiIdx === 4) { huoStart = 2; lingStart = 10; } // 申子辰：火寅 铃戌
    else if (yearZhiIdx === 5 || yearZhiIdx === 9 || yearZhiIdx === 1) { huoStart = 3; lingStart = 10; } // 巳酉丑：火卯 铃戌
    else { huoStart = 9; lingStart = 10; }                                                              // 亥卯未：火酉 铃戌
    s['火星'] = (huoStart + hourIdx) % 12;
    s['铃星'] = (lingStart + hourIdx) % 12;
    // 天马（年支）：寅午戌→申、申子辰→寅、巳酉丑→亥、亥卯未→巳
    var ma = [2, 11, 8, 5, 2, 11, 8, 5, 2, 11, 8, 5]; // 子寅 丑亥 寅申 卯巳 辰寅 巳亥 午申 未巳 申寅 酉亥 戌申 亥巳
    s['天马'] = ma[yearZhiIdx];
    return s;
  }

  /* ---------- 主入口 ----------
   * {year, month, day} 公历；hourIndex 时支（0=子…11=亥）；gender 'male'|'female'；
   * yearRule 'lichun' | 'newyear'
   */
  function calc(opt) {
    var y = opt.year, m = opt.month, d = opt.day;
    var hourIdx = opt.hourIndex | 0;
    var gender = opt.gender === 'female' ? 'female' : 'male';
    var rule = opt.yearRule === 'newyear' ? 'newyear' : 'lichun';

    var lunar = solar2lunar(y, m, d);
    if (!lunar) return null;
    var gzYear = yearPillar(y, m, d, lunar, rule);
    var gzDay = dayPillar(y, m, d);
    var yearGanIdx = GAN.indexOf(gzYear.charAt(0));
    var yearZhiIdx = ZHI.indexOf(gzYear.charAt(1));

    /* 排盘月：闰月两种流派口径
     *  - 'zhongzhou'（默认）：王亭之中州派/明灯——闰月十五（含）前作上月，十六后作下月
     *  - 'jingcheng'：《紫微斗数精成》——闰月一律作下月推算
     */
    var leapRule = opt.leapRule === 'jingcheng' ? 'jingcheng' : 'zhongzhou';
    var panMonth = lunar.lMonth;
    if (lunar.isLeap) {
      panMonth = (leapRule === 'jingcheng' || lunar.lDay >= 16) ? panMonth + 1 : panMonth;
    }
    if (panMonth > 12) panMonth = 12;

    /* 月柱：五虎遁（寅月干支顺推） */
    var yinGan = yinGanOf(yearGanIdx);
    var yueGan = (yinGan + panMonth - 1) % 10;
    var gzMonth = GAN[yueGan] + PALACE[panMonth - 1];

    /* 时柱：五鼠遁 */
    var ziGan = ziGanOf(GAN.indexOf(gzDay.charAt(0)));
    var shiGan = (ziGan + hourIdx) % 10;
    var gzHour = GAN[shiGan] + ZHI[hourIdx];

    /* 命宫 / 身宫 */
    var monthPos = (2 + (panMonth - 1)) % 12;   // 寅宫起正月
    var mingIdx = ((monthPos - hourIdx) % 12 + 12) % 12;
    var shenIdx = (monthPos + hourIdx) % 12;

    /* 十二宫（命宫起逆时针） */
    var palaceZhi = [], palaceName = [], i;
    for (i = 0; i < 12; i++) {
      palaceZhi.push((mingIdx - i + 12) % 12);
      palaceName.push(PALACE_NAMES[i]);
    }

    /* 十二宫天干（寅宫起顺排，按下地支序存储：palaceGan[2]=寅宫干 …） */
    var palaceGan = [];
    for (i = 0; i < 12; i++) { palaceGan.push(GAN[(yinGan + ((i - 2 + 12) % 12)) % 10]); }

    /* 五行局（命宫干支纳音） */
    var gzMing = palaceGan[mingIdx] + ZHI[mingIdx];
    var nayin = NAYIN[gzMing];
    var wuxing = nayin.charAt(nayin.length - 1);
    var juName = JU_OF_WUXING[wuxing];
    var juNum = JU_NUM[juName];

    /* 紫微 / 天府 / 十四主星 */
    var zw = ziweiIndex(juNum, lunar.lDay);
    var tf = ZIWEI_TIANFU[zw];
    var main = mainStars(zw, tf);

    /* 辅星 */
    var minor = minorStars(lunar, panMonth, hourIdx, yearGanIdx, yearZhiIdx);

    /* 四化（生年干） */
    var sihua = {};
    var hua = SIHUA[gzYear.charAt(0)];
    if (hua) { for (i = 0; i < 4; i++) { sihua[hua[i]] = SIHUA_NAME[i]; } }

    /* 命主身主 */
    var mingZhu = MING_ZHU[ZHI.indexOf(ZHI[mingIdx])];
    var shenZhu = SHEN_ZHU[yearZhiIdx];

    /* 大限：起限岁数 = 局数；阳男阴女顺、阴男阳女逆 */
    var yang = yearGanIdx % 2 === 0; // 甲丙戊庚壬 = 阳
    var forward = (yang && gender === 'male') || (!yang && gender === 'female');
    var limit = [], age = juNum;
    for (i = 0; i < 12; i++) {
      limit.push(age + '-' + (age + 9));
      age += 10;
    }

    /* 组装 12 宫输出 */
    var palaces = [];
    for (i = 0; i < 12; i++) {
      var idx = palaceZhi[i];
      var mainIn = [], minorIn = [], sihuaIn = [];
      var star;
      for (star in main) {
        if (Object.prototype.hasOwnProperty.call(main, star) && main[star] === idx) { mainIn.push(star); }
      }
      for (star in minor) {
        if (Object.prototype.hasOwnProperty.call(minor, star) && minor[star] === idx) { minorIn.push(star); }
      }
      for (star in sihua) {
        if (Object.prototype.hasOwnProperty.call(sihua, star) && main[star] === idx) {
          sihuaIn.push({ star: star, hua: sihua[star] });
        }
      }
      palaces.push({
        zhi: ZHI[idx],
        gan: palaceGan[idx],
        name: palaceName[i],
        isMing: idx === mingIdx,
        isShen: idx === shenIdx,
        mainStars: mainIn,
        minorStars: minorIn,
        sihua: sihuaIn,
        limit: forward ? limit[(12 - i) % 12] : limit[i] // 顺行：命宫→父母(11)→福德(10)…；逆行：命宫→兄弟(1)→夫妻(2)…
      });
    }

    return {
      solar: { year: y, month: m, day: d },
      lunar: lunar,
      panMonth: panMonth,
      pillars: { year: gzYear, month: gzMonth, day: gzDay, hour: gzHour },
      mingIndex: mingIdx,
      shenIndex: shenIdx,
      mingGz: gzMing,
      shenGz: palaceGan[shenIdx] + ZHI[shenIdx],
      nayin: nayin,
      wuxing: wuxing,
      ju: juName,
      juNum: juNum,
      ziweiIndex: zw,
      tianfuIndex: tf,
      mainStars: main,
      minorStars: minor,
      sihua: sihua,
      mingZhu: mingZhu,
      shenZhu: shenZhu,
      limitForward: forward,
      palaces: palaces
    };
  }

  /* 五行局 → 命宫干支清单（速查表用） */
  function juTable() {
    var res = { '水二局': [], '木三局': [], '金四局': [], '土五局': [], '火六局': [] };
    var gz;
    for (gz in NAYIN) {
      if (Object.prototype.hasOwnProperty.call(NAYIN, gz)) {
        res[JU_OF_WUXING[NAYIN[gz].charAt(NAYIN[gz].length - 1)]].push(gz);
      }
    }
    return res;
  }

  return {
    GAN: GAN, ZHI: ZHI, PALACE: PALACE, PALACE_NAMES: PALACE_NAMES,
    NAYIN: NAYIN,
    solar2lunar: solar2lunar,
    getTerm: getTerm,
    yearPillar: yearPillar,
    dayPillar: dayPillar,
    ziweiIndex: ziweiIndex,
    calc: calc,
    juTable: juTable
  };
});
