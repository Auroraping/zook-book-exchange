document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------------
    // 核心沉浸式 UI 工具函数 (取代生硬的 alert)
    // ------------------------------------
    const showToast = (message, type = 'success') => {
        const container = document.getElementById("toast-container");
        if(!container) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        const icon = type === 'success' ? '<i class="ph-fill ph-check-circle"></i>' : '<i class="ph-fill ph-info"></i>';
        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add("fade-out");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const showModal = (title, content, confirmText = "好的，明白了", onConfirm = null) => {
        const overlay = document.getElementById("app-modal");
        if(!overlay) return;
        document.getElementById("modal-title").innerText = title;
        document.getElementById("modal-body").innerHTML = content;
        
        const confirmBtn = document.getElementById("modal-confirm-btn");
        confirmBtn.innerText = confirmText;
        
        // 绑定确认事件（先克隆节点以移除之前的旧事件）
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener("click", () => {
            if(onConfirm) onConfirm();
            closeModal();
        });

        overlay.classList.add("active");
    };

    const closeModal = () => {
        const overlay = document.getElementById("app-modal");
        if(overlay) overlay.classList.remove("active");
    };

    // 绑定所有的关闭触发器
    document.querySelectorAll(".modal-close, .modal-close-btn").forEach(btn => {
        btn.addEventListener("click", closeModal);
    });
    // 点击深色背景层也可关闭
    const modalOverlay = document.getElementById("app-modal");
    if(modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target.id === "app-modal") closeModal();
        });
    }

    // ------------------------------------
    // 1. 顶部导航与通用功能区交互
    // ------------------------------------
    const navLinks = document.querySelectorAll(".nav-links a");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            navLinks.forEach(n => n.classList.remove("active"));
            link.classList.add("active");
            if (link.innerText !== '首页') {
                showModal("功能导航", `<p>页面将为您加载【<strong style="color:white;">${link.innerText}</strong>】的模块数据集。<br><br><i>(当前演示原型仅展现最具备业务复杂度的首页大盘架构)</i></p>`);
            }
        });
    });

    const publishBtn = document.querySelector(".publish-btn");
    if(publishBtn) {
        publishBtn.addEventListener("click", () => {
            publishBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                publishBtn.style.transform = '';
                showModal(
                    "发布闲置 / 求书登记", 
                    `<div style="display:flex; flex-direction:column; gap:16px;">
                        <p>请选择您要处理的方式：</p>
                        <button class="btn-outline" style="width:100%; border-color:#3b82f6; color:#3b82f6; padding:12px; font-size:15px; border-radius:8px; cursor:pointer;"><i class="ph-fill ph-scan"></i> 扫描课本背面 ISBN 码极速填入</button>
                        <button class="btn-outline" style="width:100%; border:1px solid rgba(255,255,255,0.2); background:transparent; color:white; padding:12px; font-size:15px; border-radius:8px; cursor:pointer;"><i class="ph-fill ph-keyboard"></i> 手动输入书籍表单</button>
                    </div>`,
                    "暂不发布了"
                );
            }, 100);
        });
    }

    const scanBtn = document.querySelector(".scan-btn");
    if(scanBtn) {
        scanBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showModal("准备录入新教材", "<p>系统正在请求访问您的设备摄像头...</p><p style='margin-top:12px; font-size:12px; color:#ef4444; background:rgba(239,68,68,0.1); padding:8px; border-radius:6px;'>安全提示：当前为原型概念演示，未接驳底层真实 API，请放心操作。</p>", "授予权限");
        });
    }

    const searchInput = document.querySelector(".search-box input");
    if(searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                const keyword = searchInput.value.trim() || '任意内容';
                showToast(`正在为您全平台检索关于 “${keyword}” 的挂牌书籍与资料...`, 'success');
                searchInput.value = '';
                searchInput.blur();
            }
        });
    }

    const iconAction = document.querySelector(".icon-action");
    if(iconAction) {
        iconAction.addEventListener("click", () => {
             showModal("您的消息信箱未读通知", "<p>📚 您挂牌的二手书《线性代数》收到 <strong>1 个降价请求</strong>。<br><br>💬 用户 <strong>[同济小土豆]</strong> 刚刚在您的求书帖子下方留言：“学弟我这儿有笔记版，需要吗？”</p>", "全部清空已读");
        });
    }

    // ------------------------------------
    // 2. 主体区（左栏）核心逻辑
    // ------------------------------------
    const heroBtnOutline = document.querySelector(".hero-actions .btn-outline");
    const heroBtnSolid = document.querySelector(".hero-actions .btn-solid");
    if(heroBtnOutline) {
        heroBtnOutline.addEventListener("click", () => showModal("专业及选课绑定", "<p>当前绑定的推书规则身份为：<strong>大二 · 信息与电子工程学院</strong>。<br><br>在完善实际课表后，这块区域将无缝推断您下学期的核心用书需求。</p>"));
    }
    if(heroBtnSolid) {
        heroBtnSolid.addEventListener("click", () => {
            showToast("正在通过推荐算法分析必修课匹配...");
            setTimeout(() => showModal("生成一键打包采买方案", "<p>基于全网现有存书情况，已为您匹配了下周开课的 <strong>6门必修课</strong> 的高性价比二手书！<br><br>新书总计需 ¥289.0，现一键打包采买仅需 <strong style='font-size:18px; color:#f87171;'>¥112.5</strong>！</p>", "生成合并支付订单", () => {
                showToast("虚拟支付网关拉起成功...", "info");
            }), 800);
        });
    }

    const cBtns = document.querySelectorAll(".c-btn");
    cBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
                if (btn.classList.contains('primary-gradient')) {
                    showModal("精准现货匹配页面", "<p>当前大屏展示了 <strong>12 本该课程的学长学姐现货直发货源</strong>。<br><br>页面内置了 <strong>[同校区优先交付]</strong>、<strong>[底价优先]</strong> 等快速漏斗引擎引擎辅助筛选。</p>", "去浏览并挑选");
                } else {
                    showToast("您已订阅【到货极速通知】！当有人上传该书，立刻推送带图通知给您。");
                }
            }, 100);
        });
    });

    // 为你推荐的 筛选 Tabs 点击视觉切换
    const tabs = document.querySelectorAll(".tabs span");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            // 逼真的列表数据刷新刷新特效
            const bookGrid = document.querySelector(".books-grid");
            if(bookGrid) {
                bookGrid.style.opacity = '0';
                bookGrid.style.transform = 'translateY(15px)';
                setTimeout(() => {
                    bookGrid.style.transition = '0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                    bookGrid.style.opacity = '1';
                    bookGrid.style.transform = 'translateY(0)';
                }, 200);
            }
        });
    });

    const bookCards = document.querySelectorAll(".book-card");
    bookCards.forEach(card => {
        card.addEventListener("click", () => {
            const titleElement = card.querySelector(".title");
            const bookTitle = titleElement ? titleElement.innerText : "此书";
            const img = card.querySelector("img") ? card.querySelector("img").src : '';
            
            let imgHtml = img ? `<img src="${img}" style="width:110px; border-radius:8px; border:2px solid rgba(255,255,255,0.1); float:left; margin-right:20px; box-shadow:0 10px 20px rgba(0,0,0,0.5);">` : '';
            
            showModal(
                "商品详情及C2C聊天页", 
                `<div style="overflow:hidden; margin-bottom:16px;">
                    ${imgHtml}
                    <h4 style="color:#fff; margin-bottom:12px; font-size:16px;">${bookTitle}</h4>
                    <p style="margin-bottom:8px;">卖家位置：<strong>[紫金港西区快递点可面交]</strong> 计科大三学长</p>
                    <p>成色介绍：<br>书内基本整洁，前三章有用红笔做重点笔记。诚心低价出给有需学弟，可以大砍价！</p>
                </div>`, 
                "向卖家主动发起在线砍价",
                () => { showToast("已弹出私聊内嵌窗。", "info"); }
            );
        });
    });

    const cartBtns = document.querySelectorAll(".btn-cart");
    cartBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation(); 
            btn.classList.remove('ph-shopping-cart-simple');
            btn.classList.add('ph-check-circle');
            btn.style.color = '#10b981';
            btn.style.background = 'rgba(16, 185, 129, 0.2)';
            
            showToast("书本已打包放飞购物车容器中，可随到随买！");
            
            // 购物车数据视觉模拟绑定
            const dot = document.querySelector(".badge-dot");
            if(dot) dot.style.background = '#10b981';
        });
    });

    // ------------------------------------
    // 3. 侧边栏（右栏）功能交互反馈
    // ------------------------------------
    const scItems = document.querySelectorAll(".sc-item");
    scItems.forEach(item => {
        item.addEventListener("click", () => {
             const label = item.querySelector("span").innerText;
             if (label === '官方回收') {
                showModal("官方急速托底保障计划", "<p>觉得私下转售太麻烦？<br>我们可以将您囤积的全部教材<strong>一次性一口价收购</strong>，并提供免寄费的上门快速揽件服务，助您轻装上阵离校。</p>", "估算我的废旧教材大礼包");
             } else {
                showModal("知书循环公益行动", "<p>🌍 感谢您以实际行动为环保储能！<br><br>经统计，您在平台循环交易的 5 本书已经成功为地球省下相当于 <strong>850 毫克标准煤当量</strong>，我们在沙漠为您种下了一颗真实的小树苗！</p>", "去围观小树", () => {
                    showToast("小树成长值 + 5，感谢参与！", "success");
                });
             }
        });
    });

    const noteItems = document.querySelectorAll(".note-item");
    noteItems.forEach(item => {
        item.addEventListener("click", () => {
             const title = item.querySelector(".n-title").innerText;
             showModal("沉浸式笔记纯净阅读模式", `<p style="font-size:18px; color:#fff; font-weight:600; margin-bottom:12px; line-height:1.4;">${title}</p><p>这篇由资深学霸学姐撰写的“血泪避坑笔记”已获 1.2 万人受用点赞。内含历届校内期中期末最容易挂科的难点推导解析，极大削平了此课的复习曲线...</p>`, "投喂金币并收藏至我的人才库", () => {
                showToast("已悄悄加入收藏清单！", "success");
             });
        });
    });
    
    const allLinks = document.querySelectorAll('a[href="#"], .data-item, .view-more');
    allLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // 为没有明确弹窗的无效空链接加上默认 Toast 反馈而不是原地刷新
            if(!link.closest('.sc-item') && !link.classList.contains('active')) {
                 if(link.classList.contains('data-item')){
                      showToast("拉起数据分析与个人信息图表面板...", "info");
                 }
            }
        });
    });
});
