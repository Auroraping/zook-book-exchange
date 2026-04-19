// 提供各系统的模拟数据支持

export const MOCK_BOOKS = [
  { id: 'b1', title: '高等数学（第七版）上册', author: '同济大学数学系', condition: '9成新，有少量铅笔勾画', price: 15.5, originalPrice: 42.0, campus: '紫金港校区', seller: '计科王学长', credit: 4.8, hasNotes: true, courseId: 'c1', aiScore: 92, aiSummary: "该书为考研通用教辅，考研学生必备，流通率极高。", cover: "/book_calculus.png" },
  { id: 'b2', title: '微观经济学：现代观点', author: '哈尔·R·范里安', condition: '全新未拆封', price: 45.0, originalPrice: 88.0, campus: '西溪校区', seller: '经管李学姐', credit: 4.9, hasNotes: false, courseId: 'c2', aiScore: 88, aiSummary: "教师授课依据，内容艰深，建议购买以配合老师PPT阅读。", cover: "/book_economics.png" },
  { id: 'b3', title: '数据结构与算法分析 (C语言描述)', author: 'Mark Allen Weiss', condition: '7成新，边角有磨损', price: 20.0, originalPrice: 65.0, campus: '玉泉校区', seller: '软件小哥', credit: 4.5, hasNotes: true, courseId: 'c3', aiScore: 98, aiSummary: "核心硬课！这门课期末考试难度极大，含高分学长笔记的这本绝对物超所值。", cover: "/book_calculus.png" },
  { id: 'b4', title: '管理信息系统 (第七版)', author: '薛华成', condition: '8成新', price: 12.0, originalPrice: 45.0, campus: '紫金港校区', seller: '管院小张', credit: 4.2, hasNotes: false, courseId: 'c4', aiScore: 45, aiSummary: "往届同学反馈该书主要用于应付开卷考试，借阅即可，非考研方向不需要买。", cover: "/book_economics.png" }
];

export const MOCK_COURSES = [
  { id: 'c1', name: '高等数学 I', term: '大一秋冬学期', type: '公共必修' },
  { id: 'c2', name: '微观经济学', term: '大二春夏学期', type: '大类必修' },
  { id: 'c3', name: '数据结构基础', term: '大二秋冬学期', type: '专业必修' },
  { id: 'c4', name: '管理信息系统', term: '大三秋冬学期', type: '专业选修' },
];

export const MOCK_NOTES = [
  { id: 'n1', title: '高数上册期末突击复习提纲（手写扫描版）', course: '高等数学 I', author: '考研上岸学姐', likes: 1245, isPaid: false },
  { id: 'n2', title: '数据结构历年PAT过题代码解析与避坑', course: '数据结构基础', author: '玉泉ACM大牛', likes: 899, isPaid: true },
  { id: 'n3', title: '微观经济学全本名词解释汇总（考试必背）', course: '微观经济学', author: '经济1901_张同学', likes: 342, isPaid: false },
];
