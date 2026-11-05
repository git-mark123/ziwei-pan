/* 临时交叉验证脚本：本库 vs iztro（开源紫微斗数排盘库）。验证后删除。 */
'use strict';
const Z = require('./ziwei-pan.js');

const samples = [
  ['1977-6-20', 2, '男', '1977-6-20'],   // 1977 丁巳年五月初一寅时
  ['1990-6-15', 6, '男', '1990-6-15'],
  ['2000-8-16', 2, '女', '2000-8-16'],
  ['2023-3-22', 0, '男', '2023-3-22'],   // 闰二月初一
  ['1988-2-17', 5, '女', '1988-2-17']
];

(async () => {
  const { astro } = await import('iztro');
  let bad = 0;
  for (const [d, h, g, _] of samples) {
    const [y, m, dd] = d.split('-').map(Number);
    const iz = astro.bySolar(d, h, g, true, 'zh-CN');
    const mine = Z.calc({ year: y, month: m, day: dd, hourIndex: h, gender: g === '男' ? 'male' : 'female', yearRule: 'lichun' });
    const izPalace = {};
    iz.palaces.forEach(p => { izPalace[p.name] = p; });
    const errs = [];
    // iztro 宫名可能带"宫"字，去掉对比
    const norm = n => n.replace('宫', '');
    const izPillars = iz.pillars || {};
    const izP = p => p && p.name ? p.name : '';
    console.log(`\n${d} 时${h} ${g}`);
    if (iz.pillars) console.log('  四柱 iztro:', [izP(izPillars.year), izP(izPillars.month), izP(izPillars.day), izP(izPillars.hour)].join(' '), '| mine:', mine.pillars.year, mine.pillars.month, mine.pillars.day, mine.pillars.hour);
    console.log('  五行局 iztro:', iz.fiveElementsClass, '| mine:', mine.ju, '| 命主 iztro:', iz.soul, '| mine:', mine.mingZhu, '| 身主 iztro:', iz.body, '| mine:', mine.shenZhu);
    for (const p of mine.palaces) {
      const ip = izPalace[p.name] || izPalace[p.name + '宫'];
      if (!ip) { errs.push(p.name + ': iztro 无此宫'); continue; }
      const izMain = (ip.majorStars || []).map(s => s.name);
      const myMain = p.mainStars;
      const miss = izMain.filter(x => !myMain.includes(x));
      const extra = myMain.filter(x => !izMain.includes(x));
      if (miss.length || extra.length) errs.push(`${p.name}(${p.gan}${p.zhi}) 主星: iztro[${izMain.join(',')}] mine[${myMain.join(',')}]`);
      const izMinor = (ip.minorStars || []).map(s => s.name);
      const myMinor = p.minorStars;
      const missN = izMinor.filter(x => !myMinor.includes(x));
      const extraN = myMinor.filter(x => !izMinor.includes(x));
      if (missN.length || extraN.length) errs.push(`${p.name} 辅星: iztro[${izMinor.join(',')}] mine[${myMinor.join(',')}]`);
      if (ip.heavenlyStem + ip.earthlyBranch !== p.gan + p.zhi) errs.push(`${p.name} 宫干支: iztro[${ip.heavenlyStem}${ip.earthlyBranch}] mine[${p.gan}${p.zhi}]`);
    }
    const izSihua = {};
    iz.palaces.forEach(p => { (p.majorStars || []).forEach(s => { if (s.fourPillars && s.fourPillars.length) izSihua[s.name] = s.fourPillars.map(f => f.replace('化', '')).join(','); }); });
    if (errs.length) { bad += errs.length; errs.forEach(e => console.log('  ✗ ' + e)); }
    else console.log('  ✓ 十二宫主星/辅星/宫干支全部一致');
  }
  console.log(bad === 0 ? '\n✓ iztro 交叉验证全部一致' : `\n✗ ${bad} 处差异（需人工判断是否为口径差异）`);
  process.exit(bad ? 2 : 0);
})();
