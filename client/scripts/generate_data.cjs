const fs = require('fs');
const path = require('path');

const titles = [
    '高等数学（第七版）上册', '线性代数及其应用', '概率论与数理统计', '数据结构与算法分析',
    '算法导论', '计算机网络：自顶向下方法', '现代操作系统', '计算机组成原理',
    '离散数学及其应用', '编译原理', '软件工程导论', '数据库系统概念',
    '人工智能：一种现代方法', '机器学习（西瓜书）', '深度学习',
    '微观经济学：现代观点', '宏观经济学原理', '管理学原理', '市场营销学', '财务管理学',
    '大学英语综合教程', '物理化学', '有机化学', '理论力学', '材料力学',
    '信号与系统', '电路原理', '程序设计专题学习指导', '管理信息系统'
];

const authors = [
    '同济大学数学系', '哈尔·R·范里安', 'Mark Allen Weiss', '薛华成',
    'David C. Lay', '马文蔚', 'Andrew S. Tanenbaum', '邱关源',
    '周志华', 'Kenneth H. Rosen', 'James F. Kurose', '文秋芳',
    'Alan V. Oppenheim', '陈越', 'Ian Goodfellow', 'Alfred V. Aho'
];

const campuses = ['紫金港校区', '玉泉校区', '西溪校区', '华家池校区', '之江校区'];
const conditions = ['全新', '9.5成新', '9成新', '8.5成新', '8成新', '7.5成新', '7成新'];
const sellers = ['计科王学长', '经管李学姐', '软件小哥', '管院小张', '数学系学霸', '物理系小王', '研一学长', '电院老哥', 'AI实验室小李', '计科小赵', '网安大神', '外语系小美', '信通小陈', 'PAT高分选手'];
const covers = [
    "/book_calculus.png", "/book_economics.png", "/book_ds.png", "/book_mis.png",
    "/book_linear_algebra.png", "/book_physics.png", "/book_os.png", "/book_circuits.png",
    "/book_ml.png", "/book_discrete_math.png", "/book_networks.png", "/book_english.png",
    "/book_signals.png", "/book_programming.png"
];

function generateData(count) {
    const data = [];
    for (let i = 1; i <= count; i++) {
        const titleBase = titles[Math.floor(Math.random() * titles.length)];
        const edition = Math.floor(Math.random() * 10) + 1;
        const price = parseFloat((Math.random() * 80 + 10).toFixed(1));
        const originalPrice = parseFloat((price + Math.random() * 40 + 20).toFixed(1));
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        data.push({
            id: `vb${i}`, title: `${titleBase} (第${edition}版)`,
            author: authors[Math.floor(Math.random() * authors.length)],
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            price, originalPrice,
            campus: campuses[Math.floor(Math.random() * campuses.length)],
            seller, sellerId: `vu${(i % 100) + 1}`,
            aiScore: Math.floor(Math.random() * 50) + 50,
            cover: covers[Math.floor(Math.random() * covers.length)],
            status: "approved"
        });
    }
    return data;
}

const count = 100005;
const data = generateData(count);
const outputPath = path.resolve(__dirname, '..', 'public', 'books_data.json');
fs.writeFileSync(outputPath, JSON.stringify(data));
console.log(`Generated ${count} items to ${outputPath}`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
