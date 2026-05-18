import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import fs from 'fs';

// 全局会话 CookieJar 缓存，实现单会话跨请求复用，彻底解决 CAS 重复登录冲突与流控限制
const activeJars = new Map(); // username -> CookieJar

/**
 * 大数模幂运算 (BigInt)
 */
function modPow(base, exp, mod) {
  let res = BigInt(1);
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = exp / 2n;
  }
  return res;
}

function getAcademicYearCode() {
  const now = new Date();
  const yearStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${yearStart}-${yearStart + 1}`;
}

function cleanHtmlText(str) {
  if (!str) return '';
  return String(str)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function writeCrawlerDebugFile(fileName, data) {
  if (process.env.DEBUG_CRAWLER !== '1') return;
  fs.writeFileSync(fileName, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

function toAbsoluteJwglxtUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const normalized = url.startsWith('/jwglxt') ? url : `/jwglxt${url.startsWith('/') ? url : `/${url}`}`;
  return `https://zdbk.zju.edu.cn${normalized}`;
}

function withMenuParams(url, username) {
  const target = new URL(url);
  if (!target.searchParams.has('gnmkdm')) target.searchParams.set('gnmkdm', 'N253535');
  if (!target.searchParams.has('su')) target.searchParams.set('su', username);
  return target.toString();
}

/**
 * 校验当前会话连接是否依然有效
 */
async function isSessionValid(instance) {
  try {
    const res = await instance.get('https://zdbk.zju.edu.cn/jwglxt/xtgl/index_initMenu.html', {
      timeout: 5000,
      validateStatus: (s) => s >= 200 && s < 500
    });
    const html = typeof res.data === 'string' ? res.data : '';
    // 如果页面重定向回统一身份认证或登录页，代表 Session 已过期
    if (html.includes('统一身份认证') || html.includes('用户登录') || html.includes('ssodl')) {
      return false;
    }
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

/**
 * 获取经过 ZJU CAS 统一认证且维持教务系统会话的 Axios 实例
 */
async function getAuthenticatedInstance(username, password) {
  let jar = activeJars.get(username);
  let isNew = false;
  if (!jar) {
    jar = new CookieJar();
    activeJars.set(username, jar);
    isNew = true;
  }

  const instance = wrapper(axios.create({
    timeout: 20000,
    jar,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    maxRedirects: 10,
    proxy: false
  }));

  // 如果会话已存在，检测其连通性
  if (!isNew) {
    const valid = await isSessionValid(instance);
    if (valid) {
      console.log(`[Session] 成功复用 ${username} 的活跃教务系统 Session！`);
      return instance;
    }
    console.log(`[Session] 用户 ${username} 的教务 Session 已过期，准备重新发起 CAS 登录流程...`);
  }

  // ===== 1. 获取 CAS 登录 execution 参数 =====
  const casLoginUrl = 'https://zjuam.zju.edu.cn/cas/login?service=https%3A%2F%2Fzdbk.zju.edu.cn%2Fjwglxt%2Fxtgl%2Flogin_ssologin.html';
  console.log('[Auth] Step 1: 正在拉取 ZJU CAS 登录网关...');
  const loginPage = await instance.get(casLoginUrl);
  const executionMatch = loginPage.data.match(/name="execution" value="(.+?)"/);
  if (!executionMatch) throw new Error('无法在 CAS 网关中抓取到 execution 校验参数');
  const execution = executionMatch[1];

  // ===== 2. 获取公钥并执行 Raw RSA 加密 =====
  console.log('[Auth] Step 2: 正在获取 CAS 加密公钥...');
  const pubKeyResponse = await instance.get('https://zjuam.zju.edu.cn/cas/v2/getPubKey');
  const { modulus, exponent } = pubKeyResponse.data;

  const pwdHex = Buffer.from(password, 'utf8').toString('hex');
  const pwdInt = BigInt('0x' + pwdHex);
  const modInt = BigInt('0x' + modulus);
  const expInt = BigInt('0x' + exponent);
  const encryptedInt = modPow(pwdInt, expInt, modInt);
  const encryptedPassword = encryptedInt.toString(16).padStart(modulus.length, '0');

  // ===== 3. 发送 CAS 授权 POST 请求 =====
  console.log('[Auth] Step 3: 正在向 CAS 统一认证中心提交密码凭证...');
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', encryptedPassword);
  formData.append('execution', execution);
  formData.append('_eventId', 'submit');
  formData.append('authcode', '');
  formData.append('rememberMe', 'true');

  const loginResponse = await instance.post(casLoginUrl, formData.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': casLoginUrl,
    },
    validateStatus: (status) => status >= 200 && status < 500,
  });

  // 判定登录响应中是否仍然被拦在登录页
  const loginHtml = typeof loginResponse.data === 'string' ? loginResponse.data : '';
  if (loginHtml.includes('统一身份认证') && loginHtml.includes('用户名') && !loginHtml.includes('login_ssologin')) {
    activeJars.delete(username); // 清空缓存
    throw new Error('学号或密码匹配失败，无法通过浙大统一身份认证网关！');
  }

  // ===== 4. 完成正方教务二次跳转握手 (SSO Ticket 兑换) =====
  console.log('[Auth] Step 4: CAS 登录成功，正在进行教务系统 SSO 门票兑换...');
  try {
    await instance.get('https://zdbk.zju.edu.cn/jwglxt/xtgl/index_initMenu.html', {
      validateStatus: (s) => s >= 200 && s < 500,
    });
  } catch (e) {
    console.log('[Auth] 教务 SSO 会话初始化状态:', e.message);
  }

  return instance;
}

/**
 * 浙大教务系统课表拉取服务
 */
export async function fetchSchedule(username, password) {
  const instance = await getAuthenticatedInstance(username, password);

  // ===== 5. 自动获取学年码 =====
  const xnm = getAcademicYearCode(); // 如 "2025-2026"

  const scheduleUrl = `https://zdbk.zju.edu.cn/jwglxt/kbcx/xskbcx_cxXsKb.html?gnmkdm=N253508&su=${username}`;
  console.log(`[Schedule] 正在拉取用户 ${username} 的全年课表 (学年码:${xnm})...`);

  const scheduleResponse = await instance.post(scheduleUrl, new URLSearchParams({
    xnm: xnm,
    xqm: '', // 拉取全年所有课表
  }).toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://zdbk.zju.edu.cn/jwglxt/kbcx/xskbcx_cxXskbcxIndex.html',
    },
    validateStatus: (s) => s >= 200 && s < 500,
  });

  if (scheduleResponse.status !== 200 || typeof scheduleResponse.data !== 'object') {
    console.log('[Schedule] 主拉取未返回标准JSON，尝试备用参数重试...');
    const retryResponse = await instance.post(scheduleUrl, new URLSearchParams({
      xnm: xnm,
    }).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (retryResponse.status !== 200 || typeof retryResponse.data !== 'object') {
      throw new Error('教务网课表接口数据异常，无法成功获取 JSON 结构！');
    }
    return parseScheduleData(retryResponse.data, username);
  }

  return parseScheduleData(scheduleResponse.data, username);
}

/**
 * 浙大教务系统教材预订拉取服务
 */
export async function fetchTextbooks(username, password) {
  const instance = await getAuthenticatedInstance(username, password);

  // ===== 5. 抓取教材预订入口页：路径必须是 XsxjcIndex，不能写成 XsjcIndex =====
  const textbookUrl = `https://zdbk.zju.edu.cn/jwglxt/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su=${username}`;
  console.log(`[Textbooks] 正在请求教材预订入口页面 (${textbookUrl})...`);

  const textbookResponse = await instance.get(textbookUrl, {
    headers: {
      'Referer': 'https://zdbk.zju.edu.cn/jwglxt/xtgl/index_initMenu.html',
    },
    validateStatus: (s) => s >= 200 && s < 500,
  });

  // 调试时可通过 DEBUG_CRAWLER=1 落盘保存原始页面
  writeCrawlerDebugFile('raw_textbooks.html', textbookResponse.data);
  console.log(`[Textbooks] 成功拉取真实教材网页 HTML，大小: ${textbookResponse.data.length} 字节`);

  const unavailableReason = extractTextbookUnavailableReason(textbookResponse.data);
  let textbooks = parseTextbooksHtml(textbookResponse.data);
  let gridResult = { textbooks: [], unavailableReason: '' };
  if (textbooks.length === 0) {
    gridResult = await fetchTextbooksFromGridApis(instance, username, textbookResponse.data);
    textbooks = gridResult.textbooks;
  }
  console.log(`[Textbooks] 成功清洗出 ${textbooks.length} 条真实教材数据`);

  const usableCount = textbooks.filter(hasConcreteTextbookName).length;
  const message = usableCount > 0
    ? `已从教务网同步 ${usableCount} 条官方教材记录`
    : textbooks.length > 0
      ? `教务网已返回 ${textbooks.length} 门课程，但教材名称、作者、出版社等详情字段为空，可能尚未开放预订或任课教师未填写教材。`
    : (gridResult.unavailableReason || unavailableReason || '当前没有从教务网同步到官方教材记录');

  return {
    textbooks,
    sourceUrl: textbookUrl,
    unavailableReason: usableCount > 0 ? '' : message,
    message,
  };
}

/**
 * 解析教务系统返回的课表 JSON
 */
function parseScheduleData(rawData, username) {
  const kbList = rawData.kbList || rawData.kblist || [];
  writeCrawlerDebugFile('raw_schedule.json', rawData);

  if (!kbList || kbList.length === 0) {
    console.log('[Schedule] 课表数据为空，可能是学期尚未开始或选课未完成');
    return { courses: [], raw: rawData, username };
  }

  console.log(`[Schedule] 成功获取 ${kbList.length} 条课程记录`);

  const courses = kbList.map((item, index) => {
    const kcb = item.kcb || '';
    const parts = kcb.split('<br>').map(s => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

    const parsedName = parts[0] || '未知课程';
    const parsedWeekText = parts[1] || '';
    const parsedTeacher = parts[2] || '未知教师';
    const parsedLocation = parts[3] || '未知地点';

    const name = item.kcmc || parsedName;
    const teacher = item.xm || parsedTeacher;
    const location = item.cdmc || item.jxdd || parsedLocation;

    const day = parseInt(item.xqj) || 0;
    const startPeriod = parseInt(item.djj) || parseInt(item.jcs?.split('-')[0]) || 1;

    let duration = parseInt(item.skcd);
    if (isNaN(duration)) {
      const jcRange = item.jcs || item.jc || '';
      if (jcRange.includes('-')) {
        const [s, e] = jcRange.split('-').map(Number);
        duration = e - s + 1;
      } else {
        duration = 2;
      }
    }

    const nameStr = String(name || '');
    const locationStr = String(location || '');
    const isSportsCourse = nameStr.includes('跆拳道') || 
                           nameStr.includes('体育') || 
                           nameStr.includes('羽毛球') || 
                           nameStr.includes('网球') || 
                           nameStr.includes('乒乓球') || 
                           nameStr.includes('游泳') || 
                           nameStr.includes('太极') || 
                           nameStr.includes('篮球') || 
                           nameStr.includes('足球') ||
                           locationStr.includes('体育') ||
                           locationStr.includes('馆') ||
                           locationStr.includes('房');
    if (isSportsCourse && duration === 3) {
      duration = 2;
    }

    const weekText = item.zcd || item.qsjsz || parsedWeekText;
    const xxq = item.xxqmc || item.xxq || '';

    const typeMap = {
      '必修': '专业必修',
      '选修': '专业选修',
      '通识': '公共必修',
    };
    const kcxz = item.kcxzmc || item.kcxz || '';
    let courseType = '专业必修';
    for (const [key, val] of Object.entries(typeMap)) {
      if (kcxz.includes(key)) { courseType = val; break; }
    }

    return {
      id: `real_c${index + 1}`,
      name,
      teacher,
      location,
      day,
      period: startPeriod,
      duration,
      weekText,
      type: courseType,
      term: '当前学期',
      xxq,
      bookIds: [],
      _raw: {
        kcb: item.kcb,
        xqj: item.xqj,
        djj: item.djj,
        jcs: item.jcs || item.jc,
        zcd: item.zcd,
        kcmc: item.kcmc,
        kcxzmc: item.kcxzmc,
        xxqmc: item.xxqmc,
        xxq: item.xxq,
      }
    };
  });

  return {
    courses,
    username,
    termInfo: {
      year: rawData.xnm || '',
      semester: rawData.xqmmc || rawData.xqm || '',
    },
    raw: rawData,
  };
}

/**
 * 解析教务系统教材预订 HTML 结构
 */
function extractTextbookUnavailableReason(html) {
  const text = cleanHtmlText(html);
  if (text.includes('现在不是预定教材时间')) {
    return '教务网提示：现在不是预定教材时间，官方教材预订列表暂未开放。';
  }
  if (text.includes('运行异常') || text.includes('系统异常')) {
    return '教务网教材页面当前返回系统异常，暂时无法同步官方教材。';
  }
  return '';
}

async function fetchTextbookScripts(instance, indexHtml) {
  const scripts = [];
  const scriptRegex = /<script[^>]+src=["']([^"']*xsxjc[^"']*\.js[^"']*)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    const url = toAbsoluteJwglxtUrl(match[1]);
    try {
      const response = await instance.get(url, {
        validateStatus: (s) => s >= 200 && s < 500,
      });
      if (response.status === 200 && typeof response.data === 'string') {
        scripts.push(response.data);
      }
    } catch (e) {
      console.warn(`[Textbooks] 教材业务脚本读取失败 ${url}: ${e.message}`);
    }
  }
  return scripts;
}

async function fetchTextbooksFromGridApis(instance, username, indexHtml) {
  const base = 'https://zdbk.zju.edu.cn/jwglxt';
  const xnm = getAcademicYearCode();
  const endpointSet = new Set([
    '/xsxjc/xsxjc_cxXsxjcIndex.html?doType=query',
    '/xsxjc/xsxjc_cxXsxjc.html',
    '/xsxjc/xsxjc_cxXsXjc.html',
    '/xsxjc/xsxjc_cxXsxjcxx.html',
    '/xsxjc/xsxjc_cxXsxjcList.html',
  ]);

  const scripts = await fetchTextbookScripts(instance, indexHtml);
  const searchableText = [indexHtml, ...scripts].join('\n');
  const urlRegex = /(?:url|href|action)\s*[:=]\s*['"]([^'"]*xsxjc[^'"]*)['"]/gi;
  let match;
  while ((match = urlRegex.exec(searchableText)) !== null) {
    endpointSet.add(match[1]);
  }

  const pathRegex = /['"]([^'"]*\/xsxjc\/[^'"]+)['"]/gi;
  while ((match = pathRegex.exec(searchableText)) !== null) {
    endpointSet.add(match[1]);
  }

  const endpoints = Array.from(endpointSet).map((item) => {
    if (item.startsWith('http')) return item;
    const path = item.startsWith('/jwglxt') ? item.slice('/jwglxt'.length) : item;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  });

  const postData = {
    xnm,
    xqm: '',
    page: 1,
    rows: 200,
    sidx: '',
    sord: 'asc',
    _search: false,
    nd: Date.now()
  };

  for (const endpoint of endpoints) {
    if (!endpoint.includes('cxXsxjcIndex') && !endpoint.includes('doType=query')) continue;
    const url = withMenuParams(endpoint, username);
    try {
      for (const method of ['post', 'get']) {
        const response = method === 'post'
          ? await instance.post(url, new URLSearchParams(postData).toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Referer': `https://zdbk.zju.edu.cn/jwglxt/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su=${username}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            validateStatus: (s) => s >= 200 && s < 500,
          })
          : await instance.get(url, {
            params: postData,
            headers: {
              'Referer': `https://zdbk.zju.edu.cn/jwglxt/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su=${username}`,
              'X-Requested-With': 'XMLHttpRequest'
            },
            validateStatus: (s) => s >= 200 && s < 500,
          });

        writeCrawlerDebugFile('raw_textbooks_grid.json', response.data);

        const courses = typeof response.data === 'object' ? parseTextbookCourseRows(response.data) : [];
        if (courses.length > 0) {
          console.log(`[Textbooks] 教材 jqGrid 接口命中: ${method.toUpperCase()} ${url}，课程 ${courses.length} 条`);
          const details = await fetchTextbookDetails(instance, username, courses);
          if (details.length > 0) return { textbooks: details, unavailableReason: '' };
          return {
            textbooks: courses.map(courseToUnavailableTextbook),
            unavailableReason: '教务网返回了课程列表，但教材详情为空，可能仍未开放预订或该课程未指定教材。',
          };
        }

        const parsed = typeof response.data === 'object'
          ? parseTextbooksJson(response.data)
          : parseTextbooksHtml(String(response.data || ''));

        if (parsed.length > 0) {
          console.log(`[Textbooks] 教材 jqGrid 接口命中: ${method.toUpperCase()} ${url}`);
          return { textbooks: parsed, unavailableReason: '' };
        }
      }
    } catch (e) {
      console.warn(`[Textbooks] 尝试教材接口失败 ${url}: ${e.message}`);
    }
  }

  return { textbooks: [], unavailableReason: extractTextbookUnavailableReason(indexHtml) };
}

function parseTextbooksJson(data) {
  const rows = Array.isArray(data)
    ? data
    : (data.rows || data.items || data.list || data.data || []);

  return rows
    .map((row) => normalizeTextbookRow(row))
    .filter((item) => item && item.courseName && item.bookName);
}

function getGridRows(data) {
  if (Array.isArray(data)) return data;
  return data?.rows || data?.items || data?.list || data?.data || [];
}

function parseTextbookCourseRows(data) {
  return getGridRows(data)
    .map((row) => normalizeTextbookCourseRow(row))
    .filter((course) => course.xkkh && course.courseName);
}

function normalizeTextbookCourseRow(row) {
  const source = Array.isArray(row?.cell) ? row.cell : row;
  if (Array.isArray(source)) {
    return {
      xkkh: cleanHtmlText(source[0] || row?.id || ''),
      reserved: cleanHtmlText(source[1] || ''),
      teacher: cleanHtmlText(source[2] || ''),
      courseName: cleanHtmlText(source[3] || ''),
      term: cleanHtmlText(source[4] || ''),
      classTime: cleanHtmlText(source[5] || ''),
      location: cleanHtmlText(source[6] || ''),
      orderTime: cleanHtmlText(source[7] || ''),
    };
  }

  const pick = (...keys) => {
    for (const key of keys) {
      if (source && source[key] !== undefined && source[key] !== null && cleanHtmlText(source[key])) {
        return cleanHtmlText(source[key]);
      }
    }
    return '';
  };

  return {
    xkkh: pick('xkkh', 'id'),
    reserved: pick('jcyd'),
    teacher: pick('jsxm', 'xm', 'teacher', 'rkjs'),
    courseName: pick('kcmc', 'courseName'),
    term: pick('xxq', 'xqmmc'),
    classTime: pick('sksj'),
    location: pick('skdd'),
    orderTime: pick('jcydsj', 'ydsj'),
  };
}

function courseToUnavailableTextbook(course) {
  return {
    courseName: course.courseName,
    teacher: course.teacher || '暂无',
    bookName: '教材详情暂未填写',
    author: '暂无',
    press: '暂无',
    version: '暂无',
    status: course.reserved === '1' ? '已预订' : '未预订',
    orderTime: course.orderTime || '',
    xkkh: course.xkkh,
  };
}

function hasConcreteTextbookName(item) {
  const name = cleanHtmlText(item?.bookName);
  return Boolean(name && name !== '无教材' && name !== '暂无教材详情' && name !== '教材详情暂未填写');
}

async function fetchTextbookDetails(instance, username, courses) {
  const detailUrl = withMenuParams('https://zdbk.zju.edu.cn/jwglxt/xsxjc/xsxjc_cxJcxx.html', username);
  const textbooks = [];

  for (const course of courses.slice(0, 120)) {
    try {
      const response = await instance.post(detailUrl, new URLSearchParams({ xkkh: course.xkkh }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': `https://zdbk.zju.edu.cn/jwglxt/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su=${username}`,
          'X-Requested-With': 'XMLHttpRequest',
        },
        validateStatus: (s) => s >= 200 && s < 500,
      });

      const parsed = parseTextbookDetailHtml(String(response.data || ''), course);
      if (process.env.DEBUG_CRAWLER === '1' && textbooks.length === 0) {
        writeCrawlerDebugFile('raw_textbook_detail.html', String(response.data || ''));
      }
      textbooks.push(...parsed);
    } catch (e) {
      console.warn(`[Textbooks] 教材详情读取失败 ${course.courseName}: ${e.message}`);
    }
  }

  return textbooks.filter((item) => item.courseName && item.bookName);
}

function parseTextbookDetailHtml(html, course) {
  const fromTable = parseTextbookDetailTable(html, course);
  if (fromTable.length > 0) return fromTable;

  const extracted = extractTextbookFromText(cleanHtmlText(html));
  if (!extracted.bookName || extracted.bookName === '无教材') return [];

  return [{
    courseName: course.courseName,
    teacher: course.teacher || extracted.teacher || '暂无',
    bookName: extracted.bookName,
    author: extracted.author || '暂无',
    press: extracted.press || '暂无',
    version: extracted.version || '暂无',
    status: course.reserved === '1' ? '已预订' : '未预订',
    orderTime: course.orderTime || extracted.orderTime || '',
    isbn: extracted.isbn || '',
    price: extracted.price || '',
    xkkh: course.xkkh,
  }];
}

function parseTextbookDetailTable(html, course) {
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;

  while ((match = trRegex.exec(html)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(match[1])) !== null) {
      cells.push(cleanHtmlText(cellMatch[1]));
    }

    const joined = cells.join(' ');
    if (!joined || /教材名称|作者|出版社|版本/.test(joined)) continue;
    if (cells.length < 2) continue;

    const extracted = extractTextbookFromText(joined, cells);
    const bookName = extracted.bookName || cells.find((cell) => cell && !cell.includes(course.courseName) && !cell.includes(course.teacher)) || '';
    if (!bookName || bookName.includes('暂无') || bookName.includes('无教材')) continue;

    rows.push({
      courseName: course.courseName,
      teacher: course.teacher || extracted.teacher || '暂无',
      bookName,
      author: extracted.author || cells[1] || '暂无',
      press: extracted.press || cells[2] || '暂无',
      version: extracted.version || cells[3] || '暂无',
      status: course.reserved === '1' ? '已预订' : '未预订',
      orderTime: course.orderTime || extracted.orderTime || '',
      isbn: extracted.isbn || '',
      price: extracted.price || '',
      xkkh: course.xkkh,
    });
  }

  return rows;
}

function normalizeTextbookRow(row) {
  const source = Array.isArray(row?.cell) ? row.cell : row;
  if (Array.isArray(source)) {
    const text = source.map(cleanHtmlText).join(' ');
    return extractTextbookFromText(text, source);
  }

  const pick = (...keys) => {
    for (const key of keys) {
      if (source && source[key] !== undefined && source[key] !== null && cleanHtmlText(source[key])) {
        return cleanHtmlText(source[key]);
      }
    }
    return '';
  };

  const joined = Object.values(source || {}).map(cleanHtmlText).join(' ');
  const extracted = extractTextbookFromText(joined);
  const bookName = pick('jcmc', 'jcmcText', 'jcmcstr', 'jcxx', 'textbookName', 'bookName') || extracted.bookName;
  const courseName = pick('kcmc', 'kch', 'courseName', 'kcmcText') || extracted.courseName;

  if (!bookName && !courseName) return null;
  return {
    courseName,
    teacher: pick('jsxm', 'xm', 'teacher', 'rkjs') || extracted.teacher,
    bookName: bookName || '无教材',
    author: pick('zz', 'author', 'jczz') || extracted.author || '暂无',
    press: pick('cbs', 'press', 'publisher') || extracted.press || '暂无',
    version: pick('bb', 'bc', 'version') || extracted.version || '1',
    status: pick('zt', 'sfyd', 'ydzt', 'status') || extracted.status || '未预定',
    orderTime: pick('ydsj', 'orderTime') || extracted.orderTime || '',
    isbn: pick('isbn', 'ISBN') || extracted.isbn || '',
    price: pick('dj', 'jcdj', 'price') || extracted.price || ''
  };
}

function extractTextbookFromText(text, cells = []) {
  const cleaned = cleanHtmlText(text);
  const take = (labels) => {
    const labelGroup = labels.join('|');
    const regex = new RegExp(`(?:${labelGroup})[：:]\\s*(.*?)(?=\\s*(教材名称|课程名称|课程|教师|任课教师|作者|出版社|版本|ISBN|定价|价格|状态|预订|$))`, 'i');
    const match = cleaned.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    courseName: take(['课程名称', '课程']) || cleanHtmlText(cells[1]),
    teacher: take(['任课教师', '教师']) || cleanHtmlText(cells[0]),
    bookName: take(['教材名称', '教材', '书名']) || cleanHtmlText(cells[3]),
    author: take(['作者']),
    press: take(['出版社']),
    version: take(['版本', '版次']),
    status: take(['状态', '预订状态']),
    orderTime: take(['预订时间', '时间']),
    isbn: take(['ISBN', 'isbn']),
    price: take(['定价', '价格'])
  };
}

function parseTextbooksHtml(html) {
  const textbooks = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  
  while ((match = trRegex.exec(html)) !== null) {
    const trContent = match[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const tds = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      tds.push(tdMatch[1]);
    }
    
    if (tds.length >= 4) {
      let detailsIndex = -1;
      for (let i = 0; i < tds.length; i++) {
        if (tds[i].includes('教材名称：') || tds[i].includes('教材名称:')) {
          detailsIndex = i;
          break;
        }
      }
      
      if (detailsIndex !== -1) {
        const detailsRaw = tds[detailsIndex];
        const text = cleanHtmlText(detailsRaw);
        
        const courseName = cleanHtmlText(tds[detailsIndex - 2] || tds[1] || '');
        const teacher = cleanHtmlText(tds[detailsIndex - 3] || tds[0] || '');
        const orderTime = cleanHtmlText(tds[detailsIndex - 1] || tds[2] || '');
        const status = cleanHtmlText(tds[detailsIndex + 1] || tds[4] || '未预定');
        
        if (courseName && !courseName.includes('课程') && !courseName.includes('教师')) {
          const nameMatch = text.match(/教材名称[：:]\s*(.*?)(?=\s*(作者|出版社|版本|$))/i);
          const authorMatch = text.match(/作者[：:]\s*(.*?)(?=\s*(出版社|版本|教材名称|$))/i);
          const pressMatch = text.match(/出版社[：:]\s*(.*?)(?=\s*(版本|作者|教材名称|$))/i);
          const verMatch = text.match(/版本[：:]\s*(.*?)(?=\s*(教材名称|作者|出版社|$))/i);
          
          const bookName = nameMatch ? nameMatch[1].trim() : '无教材';
          const author = authorMatch ? authorMatch[1].trim() : '暂无';
          const press = pressMatch ? pressMatch[1].trim() : '暂无';
          const version = verMatch ? verMatch[1].trim() : '1';
          
          textbooks.push({
            courseName,
            teacher,
            bookName,
            author,
            press,
            version,
            status,
            orderTime
          });
        }
      }
    }
  }
  return textbooks;
}
