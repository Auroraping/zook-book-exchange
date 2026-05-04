/**
 * zook 浙里淘书 - Pure JS (No Framework)
 * 复用编译好的 Tailwind CSS classes，视觉与 React 版一致
 */

const ITEMS_PER_PAGE = 24;
const state = { books: [], filteredBooks: [], cart: [], page: 1, currentView: 'home', loading: true };

// ========== 启动 ==========
document.addEventListener('DOMContentLoaded', () => {
  renderShell();
  loadData().then(() => navigate('home'));
});

// ========== Promise 异步加载 10万数据 ==========
function loadData() {
  state.loading = true;
  return fetch('/books_data.json')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(data => { state.books = data; state.filteredBooks = data; state.loading = false; console.log('[zook] 异步加载完成: ' + data.length + ' 条'); })
    .catch(e => { console.error(e); state.loading = false; });
}

// ========== 外壳（侧边栏 + 顶栏） ==========
function renderShell() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="min-h-screen flex bg-gray-50">
      <div class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] animate-pulse"></div>
      </div>
      <div class="w-24 flex flex-col items-center py-6 sticky top-0 h-screen z-50 bg-white/80 backdrop-blur-xl border-r border-gray-100/50" id="sidebar"></div>
      <div class="flex-1 flex flex-col relative z-10">
        <div class="h-24 px-16 flex items-center justify-between sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/20" id="topbar"></div>
        <div class="px-16 py-12" id="main-content"><div class="max-w-7xl mx-auto" id="page-content"></div></div>
      </div>
    </div>`;
  renderSidebar();
  renderTopbar();
}

function renderSidebar() {
  const items = [
    { icon: '🔍', label: '广场', page: 'books' }, { icon: '❤️', label: '心愿', page: 'wish' },
    { icon: '🛒', label: '清单', page: 'cart' }, { icon: '📅', label: '课表', page: 'schedule' },
    { icon: '📖', label: '社区', page: 'community' }, { icon: '🔔', label: '消息', page: 'messages' },
  ];
  document.getElementById('sidebar').innerHTML = `
    <a class="w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform mb-8 cursor-pointer" onclick="navigate('home')">
      <img src="/logo.png" class="h-12" />
    </a>
    <div class="flex flex-col gap-4 flex-1">
      ${items.map(i => `
        <div class="nav-btn relative group flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all cursor-pointer text-gray-400 hover:text-gray-800" data-page="${i.page}" onclick="navigate('${i.page}')">
          <span class="text-xl">${i.icon}</span>
          <span class="text-[10px] font-bold tracking-tighter uppercase">${i.label}</span>
        </div>`).join('')}
      <div class="flex flex-col items-center gap-1 p-2.5 rounded-2xl cursor-pointer" onclick="navigate('ai')">
        <img src="/taosu.png" class="w-8 h-8 object-contain" /><span class="text-[10px] font-bold text-gray-400">桃酥</span>
      </div>
    </div>
    <div class="w-12 h-12 bg-gray-900 rounded-[16px] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform cursor-pointer text-2xl" onclick="alert('发布功能开发中')">+</div>`;
}

function renderTopbar() {
  document.getElementById('topbar').innerHTML = `
    <div class="flex-1 max-w-3xl">
      <div class="group h-16 bg-white/85 border border-gray-100 rounded-[24px] px-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(60,64,67,0.08)] backdrop-blur-xl focus-within:bg-white focus-within:border-blue-100 transition-all">
        <div class="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">🔍</div>
        <input type="text" id="global-search" placeholder="搜索书名、作者、ISBN 或课程关键词" class="w-full bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-400 font-medium" onkeypress="if(event.key==='Enter'){navigate('books');doSearch()}" />
        <div class="flex items-center gap-3 pl-3 border-l border-gray-100">
          <span class="hidden lg:inline text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Global Search</span>
          <div class="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-blue-600 cursor-pointer transition-all" onclick="navigate('books');doSearch()">→</div>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-8 ml-12">
      <div class="btn-premium whitespace-nowrap shadow-2xl cursor-pointer" onclick="navigate('login')">立即登录淘书</div>
    </div>`;
}

// ========== 路由 ==========
function navigate(page) {
  state.currentView = page;
  state.page = 1;
  document.querySelectorAll('.nav-btn').forEach(el => {
    el.className = el.dataset.page === page
      ? 'nav-btn relative group flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all cursor-pointer text-blue-600 bg-blue-50'
      : 'nav-btn relative group flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all cursor-pointer text-gray-400 hover:text-gray-800';
  });
  const el = document.getElementById('page-content');
  switch(page) {
    case 'home': renderHome(el); break;
    case 'books': renderBooks(el); break;
    case 'cart': renderCart(el); break;
    case 'ai': renderAI(el); break;
    case 'login': renderLogin(el); break;
    default: el.innerHTML = `<div class="py-40 text-center"><h2 class="text-4xl font-black text-gray-900 mb-4">${page}</h2><p class="text-gray-400 text-lg">该页面功能开发中，请在 React 版本中查看完整体验。</p></div>`;
  }
  window.scrollTo(0, 0);
}

// ========== 首页 ==========
function renderHome(el) {
  const hotBooks = state.books.slice(0, 4);
  el.innerHTML = `
    <div class="flex flex-col gap-24 animate-google-in">
      <div class="relative py-20">
        <div class="flex flex-col items-center text-center relative z-10">
          <h1 class="text-8xl font-black mb-10 tracking-tight leading-tight">
            <span class="premium-gradient-text">好书淘不尽</span><br/>
            <span class="premium-gradient-text uppercase">浙里top three</span>
          </h1>
          <p class="text-2xl text-gray-500 mb-16 max-w-3xl leading-relaxed font-medium">
            告别昂贵的新书，拥抱传承的智慧。<br/>在"浙里淘书"，每一本教材都是学长留给你的通关秘籍。
          </p>
          <div class="flex items-center gap-6">
            <div class="btn-premium !px-12 !py-6 text-xl flex items-center gap-3 cursor-pointer" onclick="navigate('books')">立即探索广场 →</div>
            <div class="px-10 py-5 rounded-full border-2 border-gray-900 font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all text-xl cursor-pointer" onclick="alert('发布功能开发中')">我要出书</div>
          </div>
          <div class="mt-20 flex flex-col items-center cursor-pointer" onclick="navigate('ai')">
            <div class="relative"><div class="absolute inset-0 bg-orange-400 blur-2xl opacity-20 rounded-full"></div>
              <img src="/taosu.png" class="w-48 h-48 object-contain relative z-10 animate-float" />
              <div class="absolute -top-4 -right-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-float">
                <p class="text-xs font-bold text-gray-800 whitespace-nowrap">嗨！我是桃酥~ <br/><span class="text-orange-500">点我进入 AI 助手</span></p>
              </div>
            </div>
          </div>
        </div>
        <div class="absolute top-20 right-[15%] w-32 h-32 bg-blue-100 rounded-[30px] rotate-12 blur-sm -z-10 animate-pulse"></div>
        <div class="absolute bottom-20 left-[15%] w-24 h-24 bg-rose-100 rounded-[20px] -rotate-12 blur-sm -z-10 animate-float"></div>
      </div>
      <div class="py-20">
        <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div><div class="flex items-center gap-3 mb-4"><div class="w-12 h-[2px] bg-blue-600"></div><span class="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Trending Now</span></div>
            <h2 class="text-6xl font-black text-gray-900 leading-none">正在热卖</h2></div>
          <div class="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-800 flex items-center gap-2 hover:bg-gray-200 transition-all cursor-pointer" onclick="navigate('books')">查看全部广场 ›</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">${hotBooks.map(b => bookCard(b)).join('')}</div>
      </div>
      <div class="mb-20">
        <div class="bg-gray-900 rounded-[60px] p-24 text-center relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
          <div class="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-600 opacity-20 blur-[150px] rotate-45"></div>
          <div class="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-purple-600 opacity-20 blur-[150px] -rotate-45"></div>
          <div class="relative z-10">
            <h2 class="text-7xl font-black text-white mb-8 leading-none tracking-tight">加入求是园的<br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">知识文艺复兴</span></h2>
            <p class="text-gray-400 mb-16 max-w-2xl mx-auto text-xl font-medium">在这里，每一页翻过的纸张都有温度。好书淘不尽，浙里top three。</p>
            <div class="px-16 py-6 bg-white text-gray-900 rounded-full font-black text-2xl hover:scale-110 transition-transform shadow-2xl inline-block cursor-pointer" onclick="navigate('books')">立即开启寻书之旅</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ========== 购书广场 ==========
function doSearch() {
  const q = (document.getElementById('global-search')?.value || '').trim().toLowerCase();
  state.filteredBooks = q ? state.books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)) : state.books;
  state.page = 1;
  if (state.currentView === 'books') renderBooks(document.getElementById('page-content'));
}

function renderBooks(el) {
  if (state.loading) { el.innerHTML = `<div class="py-40 text-center"><img src="/taosu.png" class="w-24 h-24 mx-auto mb-8 animate-float" /><h3 class="text-2xl font-black text-gray-900 mb-4">桃酥正在加载 10 万+ 数据...</h3><p class="text-gray-400 font-medium text-lg">Promise 异步加载中</p></div>`; return; }
  const visible = state.filteredBooks.slice(0, state.page * ITEMS_PER_PAGE);
  const hasMore = visible.length < state.filteredBooks.length;
  el.innerHTML = `
    <div class="animate-google-in pt-4">
      <div class="flex justify-between items-center mb-12">
        <div class="flex flex-wrap gap-3">
          <div class="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-blue-600 text-white shadow-xl">综合</div>
          <div class="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-white text-gray-400 cursor-pointer" onclick="sortBooks('price')">价格</div>
        </div>
        <div class="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
          <div class="p-3 rounded-2xl bg-blue-50 border border-blue-100 inline-block">已加载 <span class="text-blue-600 font-black">${state.filteredBooks.length.toLocaleString()}</span> 本</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" id="books-grid">${visible.map(b => bookCard(b)).join('')}</div>
      ${hasMore ? `<div class="text-center py-16"><div class="px-12 py-5 bg-gray-900 text-white rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-xl inline-block cursor-pointer" onclick="loadMore()">加载更多 (${visible.length.toLocaleString()} / ${state.filteredBooks.length.toLocaleString()})</div></div>` : ''}
    </div>`;
}

function sortBooks(type) {
  if (type === 'price') state.filteredBooks = [...state.filteredBooks].sort((a, b) => a.price - b.price);
  state.page = 1;
  renderBooks(document.getElementById('page-content'));
}

function loadMore() { state.page++; renderBooks(document.getElementById('page-content')); }

function bookCard(book) {
  return `
    <div class="group cursor-pointer" onclick="addToCart('${book.id}')">
      <div class="premium-card !p-0 overflow-hidden !rounded-[40px] h-full flex flex-col">
        <div class="relative aspect-[3/4] overflow-hidden bg-gray-100">
          <img src="${book.cover}" alt="${book.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
          <div class="absolute top-6 left-6"><span class="px-4 py-1.5 bg-white/90 backdrop-blur text-[10px] font-black text-gray-900 rounded-full shadow-lg border border-white/50">${book.condition}</span></div>
          ${book.aiScore > 90 ? '<div class="absolute top-6 right-6"><span class="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg">PREMIUM</span></div>' : ''}
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div class="p-8 flex-1 flex flex-col">
          <div class="flex-1"><h3 class="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">${book.title}</h3>
            <p class="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">${book.campus} · ${book.author}</p></div>
          <div class="flex justify-between items-end border-t border-gray-50 pt-6 mt-auto">
            <div><p class="text-[10px] text-gray-400 font-black uppercase mb-1">Exchange</p><span class="text-3xl font-black text-gray-900">¥${book.price}</span></div>
            <div class="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl shadow-blue-500/40 text-2xl">›</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ========== 购物车 ==========
function addToCart(id) {
  const book = state.books.find(b => b.id === id);
  if (book && !state.cart.find(c => c.id === id)) { state.cart.push(book); alert('已将《' + book.title + '》加入清单'); navigate('cart'); }
}

function renderCart(el) {
  const total = state.cart.reduce((s, b) => s + b.price, 0);
  el.innerHTML = state.cart.length === 0
    ? `<div class="py-32 flex flex-col items-center text-center animate-google-in"><div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-8 text-4xl">🛒</div><h2 class="text-3xl font-black text-gray-900 mb-4">您的清单目前为空</h2><p class="text-gray-500 mb-12 max-w-sm text-lg">去发现更多由校友分享的优质学术资源。</p><div class="btn-premium px-10 cursor-pointer" onclick="navigate('books')">开始探索</div></div>`
    : `<div class="max-w-6xl mx-auto py-12 animate-google-in"><h1 class="text-5xl font-black text-gray-900 tracking-tight mb-12">购书清单 <span class="text-xl text-gray-400 font-normal">${state.cart.length} 个项目</span></h1>
      <div class="grid grid-cols-12 gap-12"><div class="col-span-8 flex flex-col gap-6">${state.cart.map(item => `
        <div class="bg-white rounded-[28px] p-6 flex gap-8 items-center border border-gray-100 hover:shadow-sm transition-all">
          <div class="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm"><img src="${item.cover}" class="w-full h-full object-cover" /></div>
          <div class="flex-1"><div class="flex items-center gap-2 mb-2"><span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">${item.campus}</span><span class="text-[10px] font-bold text-gray-400">· ${item.condition}</span></div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">${item.title}</h3></div>
          <span class="text-2xl font-black text-gray-900">¥${item.price}</span>
        </div>`).join('')}</div>
      <div class="col-span-4"><div class="bg-gray-100 rounded-[32px] p-10 sticky top-24">
        <h4 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">订单摘要</h4>
        <div class="space-y-6 mb-10"><div class="flex justify-between text-base font-medium text-gray-600"><span>商品金额</span><span>¥${total.toFixed(2)}</span></div>
          <div class="flex justify-between text-base font-medium text-gray-600"><span>校内转运</span><span class="text-blue-600">免运费</span></div></div>
        <div class="flex justify-between items-baseline mb-12"><span class="text-lg font-bold text-gray-800">应付总额</span><span class="text-4xl font-black text-gray-900">¥${total.toFixed(2)}</span></div>
        <div class="w-full py-6 bg-blue-600 text-white rounded-full font-black text-lg text-center shadow-xl cursor-pointer hover:bg-blue-700 transition-all" onclick="checkout()">确认并提交订单</div>
      </div></div></div></div>`;
}

function checkout() { 
  if (state.cart.length === 0) return;
  const orderData = { id: 'ORDER_' + Date.now(), date: new Date().toISOString(), items: state.cart, total: state.cart.reduce((s, b) => s + b.price, 0) };
  const blob = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zook_order_' + orderData.id + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('交易成功！您的订单数据已作为文件保存下载。'); 
  state.cart = []; 
  navigate('home'); 
}

// ========== 登录系统 ==========
function renderLogin(el) {
  el.innerHTML = `
    <div class="py-20 flex justify-center animate-google-in">
      <div class="bg-white p-12 rounded-[32px] shadow-xl w-96 border border-gray-100 flex flex-col gap-6">
        <h2 class="text-2xl font-black text-center mb-4 text-gray-900">欢迎来到浙里淘书</h2>
        <div class="flex flex-col gap-4">
          <input type="text" id="login-user" placeholder="买家/卖家账号" class="h-12 border border-gray-200 rounded-lg px-4 outline-none focus:border-blue-500" />
          <input type="password" placeholder="密码" class="h-12 border border-gray-200 rounded-lg px-4 outline-none focus:border-blue-500" />
          <div class="bg-blue-600 text-white text-center py-4 rounded-[16px] font-bold cursor-pointer mt-4 shadow-lg hover:bg-blue-700 transition-all" onclick="doLogin()">登录账户</div>
        </div>
      </div>
    </div>`;
}

function doLogin() {
  const user = document.getElementById('login-user').value;
  alert('登录成功！欢迎 ' + (user || '求是学子'));
  navigate('home');
}

// ========== 桃酥 AI ==========
function renderAI(el) {
  el.innerHTML = `
    <div class="animate-google-in"><h1 class="text-5xl font-black text-gray-900 mb-12">桃酥 AI 助手</h1>
      <div class="bg-white rounded-[32px] shadow-lg border border-gray-100 overflow-hidden" style="height:600px;display:flex;flex-direction:column">
        <div class="p-6 border-b border-gray-100 flex items-center gap-4"><img src="/taosu.png" class="w-12 h-12" /><div><p class="font-black text-lg">桃酥 (Taosu)</p><p class="text-xs text-green-500 font-bold">● 在线 · 已连接 ${state.books.length.toLocaleString()} 本书籍库</p></div></div>
        <div class="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col gap-4" id="chat-msgs">
          <div class="self-start max-w-[80%] p-4 rounded-2xl rounded-bl bg-white shadow-sm text-sm">你好！我是桃酥，你的浙大淘书智库。有什么我可以帮你的吗？</div>
        </div>
        <div class="p-6 border-t border-gray-100 flex gap-3">
          <input type="text" id="ai-input" class="flex-1 h-12 bg-gray-50 rounded-full px-6 border border-gray-200 focus:border-blue-500 outline-none font-medium" placeholder="问问桃酥：高数书怎么选？" onkeypress="if(event.key==='Enter')sendMsg()" />
          <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform" onclick="sendMsg()">↑</div>
        </div>
      </div>
    </div>`;
}

function sendMsg() {
  const input = document.getElementById('ai-input');
  const msg = input.value.trim();
  if (!msg) return;
  const container = document.getElementById('chat-msgs');
  container.innerHTML += `<div class="self-end max-w-[80%] p-4 rounded-2xl rounded-br bg-blue-600 text-white text-sm">${msg}</div>`;
  input.value = '';
  setTimeout(() => {
    container.innerHTML += `<div class="self-start max-w-[80%] p-4 rounded-2xl rounded-bl bg-white shadow-sm text-sm">关于"${msg}"，我在 ${state.books.length.toLocaleString()} 本藏书中找到了匹配结果，快去购书广场看看吧！</div>`;
    container.scrollTop = container.scrollHeight;
  }, 600);
}

// 暴露到全局
window.navigate = navigate;
window.doSearch = doSearch;
window.loadMore = loadMore;
window.addToCart = addToCart;
window.checkout = checkout;
window.sendMsg = sendMsg;
window.sortBooks = sortBooks;
window.doLogin = doLogin;
