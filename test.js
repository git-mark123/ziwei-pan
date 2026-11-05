/**
 * 紫微斗数排盘 · 自测脚本
 * 基准：
 *  1. 起紫微星表 150 格（明灯易学转载《中州派安星诀》，紫微学院整理）——全量校验紫微星定位
 *  2. 王亭之《中州派》安星诀命例：1977 丁巳年五月寅时男命
 *     （命宫辰、身宫申、宫干甲辰…、火六局、大限 6-15 岁逆行）——完整排盘校验
 *  3. 《紫微斗数精成》口诀案例与四柱校验
 *  4. 闰月排盘口径（闰月作下月推算）
 * 运行：node test.js
 */
'use strict';
const Z = require('./ziwei-pan.js');
let SOL = null;
try { const m = require('solarlunar'); SOL = m.default || m; } catch (e) { /* 未安装时跳过交叉验证 */ }
let pass = 0, fail = 0;

function assert(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')); }
}

/* ===== 1. 起紫微星表 150 格（明灯《安星诀》原表） =====
 * 行序：水二局 / 木三局 / 金四局 / 土五局 / 火六局；列序：生日 1..30
 */
const ZW_TABLE = [
  // 1-15
  ['丑寅寅卯卯辰辰巳巳午午未未申申', '辰丑寅巳寅卯午卯辰未辰巳申巳午', '亥辰丑寅子巳寅卯丑午卯辰寅未辰', '午亥辰丑寅未子巳寅卯申丑午卯辰', '酉午亥辰丑寅戌未子巳寅卯亥申丑'],
  // 16-30
  ['酉酉戌戌亥亥子子丑丑寅寅卯卯辰', '酉午未戌未申亥申酉子酉戌丑戌亥', '巳卯申巳午辰酉午未巳戌未申午亥', '酉寅未辰巳戌卯申巳午亥辰酉午未', '午卯辰子酉寅未辰巳丑戌卯申巳午']
];
const JU_ROWS = [2, 3, 4, 5, 6]; // 局数
const ZHI0 = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };

console.log('== 1. 起紫微星表全量校验（5 局 × 30 日 = 150 格） ==');
{
  let total = 0, bad = 0;
  for (let r = 0; r < 5; r++) {
    const ju = JU_ROWS[r];
    for (let half = 0; half < 2; half++) {
      const row = ZW_TABLE[half][r];
      for (let c = 0; c < 15; c++) {
        const day = half * 15 + c + 1;
        const expectZhi = row.charAt(c); // 每格一个地支字
        const expect = ZHI0[expectZhi];
        const got = Z.ziweiIndex(ju, day);
        total++;
        if (got !== expect) { bad++; console.log(`    局${ju}日${day}: 期望${expectZhi} 实得${Z.ZHI[got]}`); }
      }
    }
  }
  assert(`150 格全对（错误 ${bad}/${total}）`, bad === 0, bad + ' 格不符');
}

/* ===== 2. 1977 丁巳年五月寅时男命（中州派安星诀命例） =====
 * 农历五月 → 需先找到对应公历日期（农历 1977 年五月初一）
 */
console.log('\n== 2. 1977 丁巳年五月寅时男命（明灯/中州派例） ==');
{
  let found = null;
  for (let d = 1; d <= 31; d++) {
    const lunar = Z.solar2lunar(1977, 6, d);
    if (lunar && lunar.lYear === 1977 && lunar.lMonth === 5 && lunar.lDay === 1) { found = { y: 1977, m: 6, d: d }; break; }
  }
  assert('找到农历 1977 五月初一对应公历', !!found, JSON.stringify(found));
  if (found) {
    const r = Z.calc({ year: found.y, month: found.m, day: found.d, hourIndex: 2, gender: 'male', yearRule: 'lichun' });
    const mIdx = r.mingIndex, sIdx = r.shenIndex;
    assert('年柱丁巳', r.pillars.year === '丁巳', r.pillars.year);
    assert('命宫在辰', Z.ZHI[mIdx] === '辰', Z.ZHI[mIdx]);
    assert('身宫在申', Z.ZHI[sIdx] === '申', Z.ZHI[sIdx]);
    const byName = {};
    r.palaces.forEach(p => byName[p.name] = p);
    assert('兄弟在卯', byName['兄弟'].zhi === '卯', byName['兄弟'].zhi);
    assert('夫妻在寅', byName['夫妻'].zhi === '寅', byName['夫妻'].zhi);
    assert('子女在丑', byName['子女'].zhi === '丑', byName['子女'].zhi);
    assert('财帛在子', byName['财帛'].zhi === '子', byName['财帛'].zhi);
    assert('疾厄在亥', byName['疾厄'].zhi === '亥', byName['疾厄'].zhi);
    assert('迁移在戌', byName['迁移'].zhi === '戌', byName['迁移'].zhi);
    assert('仆役在酉', byName['仆役'].zhi === '酉', byName['仆役'].zhi);
    assert('官禄在申', byName['官禄'].zhi === '申', byName['官禄'].zhi);
    assert('田宅在未', byName['田宅'].zhi === '未', byName['田宅'].zhi);
    assert('福德在午', byName['福德'].zhi === '午', byName['福德'].zhi);
    assert('父母在巳', byName['父母'].zhi === '巳', byName['父母'].zhi);
    assert('命宫宫干甲', byName['命宫'].gan === '甲', byName['命宫'].gan);
    assert('兄弟宫干癸', byName['兄弟'].gan === '癸', byName['兄弟'].gan);
    assert('父母宫干乙', byName['父母'].gan === '乙', byName['父母'].gan);
    assert('官禄宫干戊', byName['官禄'].gan === '戊', byName['官禄'].gan);
    assert('五行局火六局', r.ju === '火六局', r.ju);
    assert('命宫纳音覆灯火', r.nayin === '覆灯火', r.nayin);
    assert('大限逆行（阴男）', r.limitForward === false, String(r.limitForward));
    assert('大限 6-15 起', byName['命宫'].limit === '6-15', byName['命宫'].limit);
    assert('大限 16-25 兄弟', byName['兄弟'].limit === '16-25', byName['兄弟'].limit);
    assert('大限 96-105 田宅', byName['田宅'].limit === '96-105', byName['田宅'].limit);
    console.log('    命盘摘要:', r.pillars.year, r.pillars.month, r.pillars.day, r.pillars.hour,
      '| 命宫', r.mingGz, '| 身宫', r.shenGz, '|', r.ju, '| 紫微', Z.ZHI[r.ziweiIndex]);
  }
}

/* ===== 3. 四柱与紫微口诀案例（《紫微斗数精成》） ===== */
console.log('\n== 3. 精成口诀案例与四柱 ==');
{
  // 水二局 28 日 → 紫微卯；木三局 25 日 → 紫微子；火六局 15 日 → 紫微丑；土五局 20 日 → 紫微巳；水二局 10 日 → 紫微午；金四局 27 日 → 紫微未
  const cases = [[2, 28, '卯'], [3, 25, '子'], [6, 15, '丑'], [5, 20, '巳'], [2, 10, '午'], [4, 27, '未']];
  cases.forEach(([ju, day, zhi]) => {
    const got = Z.ZHI[Z.ziweiIndex(ju, day)];
    assert(`局${ju}日${day} → 紫微${zhi}`, got === zhi, got);
  });
  // 1990-06-15（1990 庚午年五月初…?）四柱 sanity：农历 1990 五月廿三
  const r = Z.calc({ year: 1990, month: 6, day: 15, hourIndex: 6, gender: 'male' });
  assert('1990-06-15 农历五月廿三', r.lunar.lMonth === 5 && r.lunar.lDay === 23 && !r.lunar.isLeap,
    `${r.lunar.lMonth}月${r.lunar.lDay}日${r.lunar.isLeap ? '闰' : ''}`);
  assert('1990-06-15 年柱庚午（立春界）', r.pillars.year === '庚午', r.pillars.year);
  // 时柱：1990-06-15 为辛亥日（与 solarlunar gzDay 交叉核对），辛日→戊子起，午时=戊+6=甲 → 甲午
  assert('时柱甲午（辛亥日午时）', r.pillars.hour === '甲午', r.pillars.hour);
  assert('五行局火六局（命宫戊子霹雳火）', r.ju === '火六局' && r.nayin === '霹雳火', r.ju + '/' + r.nayin);
  // 大限顺行（庚午年阳男）：1990-06-15 寅时命宫在辰 → 命宫4-13、父母14-23、兄弟114-123
  const r2 = Z.calc({ year: 1990, month: 6, day: 15, hourIndex: 2, gender: 'male' });
  const byName2 = {}; r2.palaces.forEach(p => byName2[p.name] = p);
  assert('大限顺行（庚午年阳男）', r2.limitForward === true, String(r2.limitForward));
  assert('顺行：命宫 4-13', byName2['命宫'].limit === '4-13', byName2['命宫'].limit);
  assert('顺行：父母 14-23', byName2['父母'].limit === '14-23', byName2['父母'].limit);
  assert('顺行：福德 24-33', byName2['福德'].limit === '24-33', byName2['福德'].limit);
  assert('顺行：兄弟 114-123', byName2['兄弟'].limit === '114-123', byName2['兄弟'].limit);
  assert('顺行：子女 94-103', byName2['子女'].limit === '94-103', byName2['子女'].limit);
  // 立春日界（按日，未细分时刻；与 solarlunar 口径一致）：2023 立春 = 2 月 4 日
  assert('2023-02-03 年柱壬寅（立春前）', Z.calc({ year: 2023, month: 2, day: 3, hourIndex: 0, gender: 'male' }).pillars.year === '壬寅');
  assert('2023-02-04 年柱癸卯（立春日界）', Z.calc({ year: 2023, month: 2, day: 4, hourIndex: 0, gender: 'male' }).pillars.year === '癸卯');
  assert('2023-02-04 年柱癸卯（初一界）', Z.calc({ year: 2023, month: 2, day: 4, hourIndex: 0, gender: 'male', yearRule: 'newyear' }).pillars.year === '癸卯');
}

/* ===== 4. 闰月排盘口径（默认中州派：十五前作上月；可选精成：一律作下月） ===== */
console.log('\n== 4. 闰月口径 ==');
{
  // 2023 年闰二月初一 = 公历 2023-03-22
  const lunar = Z.solar2lunar(2023, 3, 22);
  assert('2023-03-22 为闰二月', lunar && lunar.lMonth === 2 && lunar.isLeap, JSON.stringify(lunar));
  // 中州派（默认）：闰二月初一（十五前）作二月
  const r1 = Z.calc({ year: 2023, month: 3, day: 22, hourIndex: 0, gender: 'male' });
  assert('中州派：闰二月作二月排盘', r1.panMonth === 2, 'panMonth=' + r1.panMonth);
  assert('中州派：月柱乙卯（癸卯年二月）', r1.pillars.month === '乙卯', r1.pillars.month);
  // 精成：闰月一律作下月（三月）
  const r2 = Z.calc({ year: 2023, month: 3, day: 22, hourIndex: 0, gender: 'male', leapRule: 'jingcheng' });
  assert('精成：闰二月作三月排盘', r2.panMonth === 3, 'panMonth=' + r2.panMonth);
  assert('精成：月柱丙辰（癸卯年三月）', r2.pillars.month === '丙辰', r2.pillars.month);
  // 闰月十六后（作下月）：2023 闰二月十六 = 公历 2023-04-06
  const lunar2 = Z.solar2lunar(2023, 4, 6);
  assert('2023-04-06 为闰二月十六', lunar2 && lunar2.lMonth === 2 && lunar2.isLeap && lunar2.lDay === 16, JSON.stringify(lunar2));
  const r3 = Z.calc({ year: 2023, month: 4, day: 6, hourIndex: 0, gender: 'male' });
  assert('中州派：闰二月十六作三月', r3.panMonth === 3, 'panMonth=' + r3.panMonth);
}

/* ===== 5. 十四主星布法（精成口诀 + 紫微天府对照） ===== */
console.log('\n== 5. 十四主星布法 ==');
{
  // 用真实生辰构造：紫微在子的完整盘（水二局、农历廿三日 → 对照表紫微在子）
  // 先找一个公历日期：农历 1990 年闰五月？直接找农历 1988 年（戊辰）…… 简便法：找农历某年某月 23 日且局=水二局
  // 更稳：直接调用 calc 并从输出核对 紫微/天府/主星 的绝对位置关系，不依赖特定生辰
  // 用 1977 例的盘核对（紫微在？）
  const r77 = (function () {
    for (let d = 1; d <= 31; d++) {
      const lu = Z.solar2lunar(1977, 6, d);
      if (lu && lu.lYear === 1977 && lu.lMonth === 5 && lu.lDay === 1) {
        return Z.calc({ year: 1977, month: 6, day: d, hourIndex: 2, gender: 'male' });
      }
    }
    return null;
  })();
  if (r77) {
    const zwIdx = r77.ziweiIndex, tfIdx = r77.tianfuIndex;
    const main = r77.mainStars;
    // 1977 农历五月初一，火六局 1 日 → 紫微酉；紫微→天府 对照（明灯）：酉→未
    assert(`紫微酉 → 天府未`, Z.ZHI[zwIdx] === '酉' && Z.ZHI[tfIdx] === '未', Z.ZHI[zwIdx] + '→' + Z.ZHI[tfIdx]);
    // 紫微星系逆布（精成口诀）：紫微酉 → 天机申、太阳午、武曲巳、天同辰、廉贞丑
    assert('天机申', Z.ZHI[main['天机']] === '申', Z.ZHI[main['天机']]);
    assert('太阳午', Z.ZHI[main['太阳']] === '午', Z.ZHI[main['太阳']]);
    assert('武曲巳', Z.ZHI[main['武曲']] === '巳', Z.ZHI[main['武曲']]);
    assert('天同辰', Z.ZHI[main['天同']] === '辰', Z.ZHI[main['天同']]);
    assert('廉贞丑', Z.ZHI[main['廉贞']] === '丑', Z.ZHI[main['廉贞']]);
    // 天府星系顺布：天府未 → 太阴申、贪狼酉、巨门戌、天相亥、天梁子、七杀丑、破军巳
    assert('太阴申', Z.ZHI[main['太阴']] === '申', Z.ZHI[main['太阴']]);
    assert('贪狼酉', Z.ZHI[main['贪狼']] === '酉', Z.ZHI[main['贪狼']]);
    assert('巨门戌', Z.ZHI[main['巨门']] === '戌', Z.ZHI[main['巨门']]);
    assert('天相亥', Z.ZHI[main['天相']] === '亥', Z.ZHI[main['天相']]);
    assert('天梁子', Z.ZHI[main['天梁']] === '子', Z.ZHI[main['天梁']]);
    assert('七杀丑', Z.ZHI[main['七杀']] === '丑', Z.ZHI[main['七杀']]);
    assert('破军巳', Z.ZHI[main['破军']] === '巳', Z.ZHI[main['破军']]);
    // 十四主星数量：14 颗
    assert('十四主星齐备', Object.keys(main).length === 14, String(Object.keys(main).length));
    // 1977 丁巳年四化：丁 → 太阴禄、天同权、天机科、巨门忌
    const sh = r77.sihua;
    assert('丁年四化 太阴化禄', sh['太阴'] === '禄', JSON.stringify(sh));
    assert('丁年四化 天同化权', sh['天同'] === '权', JSON.stringify(sh));
    assert('丁年四化 天机化科', sh['天机'] === '科', JSON.stringify(sh));
    assert('丁年四化 巨门化忌', sh['巨门'] === '忌', JSON.stringify(sh));
  }
}

/* ===== 6. 辅星口诀抽查 ===== */
console.log('\n== 6. 辅星抽查 ==');
{
  const r77 = (function () {
    for (let d = 1; d <= 31; d++) {
      const lu = Z.solar2lunar(1977, 6, d);
      if (lu && lu.lYear === 1977 && lu.lMonth === 5 && lu.lDay === 1) {
        return Z.calc({ year: 1977, month: 6, day: d, hourIndex: 2, gender: 'male' });
      }
    }
    return null;
  })();
  if (r77) {
    const s = r77.minorStars;
    // 丁巳年（丁干）→ 天魁亥、天钺酉；禄存午；擎羊未、陀罗巳
    assert('丁年天魁在亥', Z.ZHI[s['天魁']] === '亥', Z.ZHI[s['天魁']]);
    assert('丁年天钺在酉', Z.ZHI[s['天钺']] === '酉', Z.ZHI[s['天钺']]);
    assert('丁年禄存在午', Z.ZHI[s['禄存']] === '午', Z.ZHI[s['禄存']]);
    assert('擎羊在未（禄前）', Z.ZHI[s['擎羊']] === '未', Z.ZHI[s['擎羊']]);
    assert('陀罗在巳（禄后）', Z.ZHI[s['陀罗']] === '巳', Z.ZHI[s['陀罗']]);
    // 月系：农历五月（排盘月 5）→ 左辅：辰宫起正月顺数至五月 = 申；右弼：戌宫起正月逆数至五月 = 午
    assert('左辅在申（五月）', Z.ZHI[s['左辅']] === '申', Z.ZHI[s['左辅']]);
    assert('右弼在午（五月）', Z.ZHI[s['右弼']] === '午', Z.ZHI[s['右弼']]);
    // 时系：寅时 → 文昌：戌起子时逆数至寅 = 申；文曲：辰起子时顺数至寅 = 午
    assert('文昌在申（寅时）', Z.ZHI[s['文昌']] === '申', Z.ZHI[s['文昌']]);
    assert('文曲在午（寅时）', Z.ZHI[s['文曲']] === '午', Z.ZHI[s['文曲']]);
    // 命主（命宫辰）→ 廉贞；身主（年支巳）→ 天机
    assert('命主廉贞', r77.mingZhu === '廉贞', r77.mingZhu);
    assert('身主天机', r77.shenZhu === '天机', r77.shenZhu);
  }
}

/* ===== 7. 与 solarlunar 交叉核对（日柱 / 年柱 / 月柱） ===== */
console.log('\n== 7. solarlunar 交叉核对 ==');
{
  const samples = [
    [1990, 6, 15], [1977, 6, 20], [2000, 1, 1], [2023, 3, 22],
    [1988, 2, 17], [1950, 10, 1], [2010, 8, 8], [1900, 1, 31]
  ];
  if (SOL) {
    let bad = 0;
    samples.forEach(([y, m, d]) => {
      const s = SOL.solar2lunar(y, m, d);
      const r = Z.calc({ year: y, month: m, day: d, hourIndex: 0, gender: 'male' });
      if (s.gzDay !== r.pillars.day) {
        bad++; console.log(`    ${y}-${m}-${d}: gzDay 期望${s.gzDay} 实得${r.pillars.day}`);
      }
      if (s.gzYear !== r.pillars.year) {
        bad++; console.log(`    ${y}-${m}-${d}: gzYear 期望${s.gzYear} 实得${r.pillars.year}`);
      }
    });
    assert(`日柱/年柱与 solarlunar 一致（${samples.length} 组）`, bad === 0, bad + ' 处不符');
  } else {
    console.log('    （solarlunar 未安装，跳过——可 npm i solarlunar 后重跑）');
  }
}

console.log('\n===== ' + pass + ' 通过 / ' + fail + ' 失败 =====');
process.exit(fail ? 1 : 0);