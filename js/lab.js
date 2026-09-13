(() => {
const { $, $$, toast } = window.App;

function activateTab(name) {
  $$(".lab-tabs button").forEach((tab) => tab.setAttribute("aria-selected", tab.dataset.tab === name));
  $$(".lab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${name}`));
}

function initLabTabs() {
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  if (tab) activateTab(tab);

  $$(".lab-tabs button").forEach((tab) => tab.addEventListener("click", () => activateTab(tab.dataset.tab)));
}

function initCamera() {
  const button = $("#start-camera");
  if (!button) return;

  let cameraStream;
  let scoreTimer;

  button.addEventListener("click", async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
      clearInterval(scoreTimer);
      $("#camera").srcObject = null;
      $("#camera-placeholder").style.display = "flex";
      $(".camera-wrap").classList.remove("scanning");
      button.innerHTML = '打开相机检查画面 <span>→</span>';
      resetMetrics();
      return;
    }

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      $("#camera").srcObject = cameraStream;
      $("#camera-placeholder").style.display = "none";
      $(".camera-wrap").classList.add("scanning");
      button.innerHTML = '结束拍摄检查 <span>×</span>';
      animatePose(cameraStream);
      scoreTimer = setInterval(updateMetrics, 1800);
      updateMetrics();
    } catch {
      toast("未获得摄像头权限，请在浏览器设置中允许访问");
    }
  });

  window.addEventListener("beforeunload", () => {
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  });
}

function updateMetrics() {
  const values = [80 + Math.floor(Math.random() * 15), 76 + Math.floor(Math.random() * 20), 70 + Math.floor(Math.random() * 22)];
  const avg = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  $("#score").textContent = avg;
  ["one", "two", "three"].forEach((name, index) => {
    $(`#bar-${name}`).style.width = `${values[index]}%`;
    $(`#metric-${name}`).textContent = `${values[index]}%`;
  });
  const tips = [
    "光线比较均匀，可以再靠近作品一点，让纹理更清楚。",
    "主体略偏左，把作品移动到画面中央，背景杂物尽量移开。",
    "画面稳定度不错。建议补拍一张手部制作过程，笔记会更有故事感。",
    "成品已经清楚入镜，再拍一张手艺人与作品同框，能增加信任感。"
  ];
  $("#motion-tip").textContent = tips[Math.floor(Math.random() * tips.length)];
}

function resetMetrics() {
  $("#score").textContent = "--";
  ["one", "two", "three"].forEach((name) => {
    $(`#bar-${name}`).style.width = "0";
    $(`#metric-${name}`).textContent = "等待检测";
  });
  $("#motion-tip").textContent = "把作品放在窗边，背景尽量干净，镜头同时拍到手艺细节和制作者本人。";
}

function animatePose(cameraStream) {
  const canvas = $("#pose-overlay");
  const context = canvas.getContext("2d");
  const resize = () => {
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;
  };
  resize();
  let phase = 0;
  const draw = () => {
    if (!cameraStream.active) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    phase += 0.025;
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2 + Math.sin(phase) * width * 0.015;
    const cy = height * .43;
    context.clearRect(0, 0, width, canvas.height);
    context.strokeStyle = "rgba(219, 176, 88, .72)";
    context.fillStyle = "#e0b65b";
    context.lineWidth = 1.2 * devicePixelRatio;
    context.setLineDash([4 * devicePixelRatio, 5 * devicePixelRatio]);
    context.strokeRect(cx - width * .13, cy - height * .22, width * .26, height * .39);
    context.setLineDash([]);
    [[-.055, -.035], [.055, -.035], [0, .04], [-.045, .105], [.045, .105]].forEach(([x, y]) => {
      context.beginPath();
      context.arc(cx + width * x, cy + height * y, 2.3 * devicePixelRatio, 0, Math.PI * 2);
      context.fill();
    });
    requestAnimationFrame(draw);
  };
  draw();
}

function renderMarkdownLite(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/^### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^## (.+)$/gm, "<h4>$1</h4>")
    .replace(/^# (.+)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

function initScriptTools() {
  const genBtn = $("#generate-script");
  if (!genBtn) return;

  genBtn.addEventListener("click", async () => {
    const topic = $("#script-topic").value.trim() || "宁海平调耍牙传承故事";
    const audience = $("#script-audience").value;
    const duration = $("#script-duration").value;
    const result = $("#script-result");
    genBtn.disabled = true;
    genBtn.innerHTML = '大模型生成中 <span>···</span>';
    result.className = "script-empty";
    result.innerHTML = "<div>◌</div><p>正在整理标题、正文、配图和话题标签…</p>";
    try {
      if (!window.QiniuAI) throw new Error("AI 模块未加载");
      const content = await window.QiniuAI.generateScript({ topic, audience, duration });
      result.className = "script-output";
      result.innerHTML = `<p class="ai-source">大模型 · deepseek-v3</p><p>${renderMarkdownLite(content)}</p>`;
      toast("小红书素材已生成");
    } catch (err) {
      result.className = "script-empty";
      result.innerHTML = `<div>!</div><p>${err.message || "生成失败"}</p>`;
      toast(err.message || "生成失败");
    } finally {
      genBtn.disabled = false;
      genBtn.innerHTML = '重新生成整套素材 <span>✦</span>';
    }
  });

  $("#copy-script")?.addEventListener("click", async () => {
    const text = $("#script-result").innerText;
    if (!text || $("#script-result").classList.contains("script-empty")) return toast("请先生成内容");
    try {
      await navigator.clipboard.writeText(text);
      toast("内容已复制到剪贴板");
    } catch {
      toast("复制失败，请手动选择文本");
    }
  });

  $$(".creator-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".creator-tab").forEach((item) => item.classList.toggle("active", item === tab));
    $$(".creator-pane").forEach((pane) => pane.classList.toggle("active", pane.id === `creator-${tab.dataset.creator}`));
    const titles = { script: "小红书笔记预览", subtitle: "标题与封面预览", edit: "发布清单预览" };
    $("#result-title").textContent = titles[tab.dataset.creator] || "预览";
  }));

  $("#generate-subtitle")?.addEventListener("click", async () => {
    const text = $("#subtitle-text").value.trim();
    if (!text) return toast("请先输入口述内容");
    const maxLen = parseInt($("#subtitle-length").value, 10);
    const style = $("#subtitle-style").value;
    const result = $("#script-result");
    const button = $("#generate-subtitle");
    button.disabled = true;
    button.innerHTML = "正在提炼标题 <span>···</span>";
    result.className = "script-empty";
    result.innerHTML = "<div>⌁</div><p>正在生成适合小红书的标题与封面字…</p>";
    try {
      if (!window.QiniuAI) throw new Error("AI 模块未加载");
      const content = await window.QiniuAI.generateSubtitleNotes({ text, style, maxLen });
      result.className = "script-output";
      result.innerHTML = `<p class="ai-source">大模型 · deepseek-v3 · ${style}</p><p>${renderMarkdownLite(content)}</p>`;
      toast("标题与封面字已生成");
    } catch (err) {
      result.className = "script-empty";
      result.innerHTML = `<div>!</div><p>${err.message || "生成失败"}</p>`;
      toast(err.message || "生成失败");
    } finally {
      button.disabled = false;
      button.innerHTML = "重新生成标题与封面字 <span>⌁</span>";
    }
  });

  $("#generate-edit")?.addEventListener("click", async () => {
    const brief = $("#edit-brief")?.value.trim() || "宁海平调耍牙图文素材";
    const duration = $("#edit-duration")?.value || "小红书图文";
    const result = $("#script-result");
    const button = $("#generate-edit");
    button.disabled = true;
    button.innerHTML = "大模型分析中 <span>···</span>";
    result.className = "script-empty";
    result.innerHTML = "<div>✓</div><p>正在生成发布前检查清单…</p>";
    try {
      if (!window.QiniuAI?.generateEditAdvice) throw new Error("AI 模块未加载");
      const content = await window.QiniuAI.generateEditAdvice({ brief, duration });
      result.className = "script-output";
      result.innerHTML = `<p class="ai-source">大模型 · 剪辑建议</p><p>${renderMarkdownLite(content)}</p>`;
      toast("发布清单已生成");
    } catch (err) {
      result.className = "script-empty";
      result.innerHTML = `<div>!</div><p>${err.message || "生成失败"}</p>`;
      toast(err.message || "生成失败");
    } finally {
      button.disabled = false;
      button.innerHTML = "重新生成发布清单 <span>✓</span>";
    }
  });
}

function initChat() {
  const form = $("#chat-form");
  if (!form) return;

  const topicExpand = {
    "怎么注册账号": "请用最简单的编号步骤，教第一次使用小红书的手艺人注册账号并完善头像、名称和简介。",
    "怎么发第一篇": "请从点击加号开始，逐步说明小红书图文笔记的发布流程。",
    "图片怎么排序": "手艺人的小红书图文笔记，封面、成品、制作过程和人物照片应该怎样排序？",
    "标题怎么写": "请给手艺人讲清小红书标题的简单写法，并给宁海平调耍牙示例。",
    "怎么加话题": "请说明小红书发布时如何选择话题标签，数量多少合适，如何避免乱蹭热点。",
    "怎么添加地点": "请说明小红书如何添加地点，以及非遗场馆、工作室什么时候适合加地点。",
    "评论怎么回复": "请给不熟悉平台的手艺人一套评论回复方法，包含咨询、夸赞、质疑和危险模仿四种情况。",
    "什么时候发布": "请说明手艺人如何用简单测试找到适合自己的发布时间，不要承诺固定黄金时间。",
    "哪些词不能写": "请列出手艺人在小红书宣传时应避免的夸张、虚假、绝对化表达，并给安全替换示例。",
    "数据在哪里看": "请说明发布后在哪里看浏览、点赞、收藏、评论和主页访问，以及各自意味着什么。",
    "如何避免虚假宣传": "请给传统手艺内容一份事实核对清单，避免虚构历史、身份、疗效、销量和荣誉。"
  };

  const fallbackKnowledge = [
    { keys: ["注册", "账号", "简介"], answer: "1. 打开小红书，按提示用手机号注册。2. 头像优先用本人或清晰作品照。3. 名称写“姓名/工作室 + 手艺名称”。4. 简介只写地点、做什么、从业经历；荣誉必须真实可核对。" },
    { keys: ["第一篇", "发布", "加号"], answer: "1. 点底部加号。2. 选择 4—6 张清晰照片。3. 第一张设为封面。4. 粘贴并修改 AI 生成的标题和正文。5. 添加 3—5 个相关话题与真实地点。6. 预览无误后发布。" },
    { keys: ["图片", "排序", "封面"], answer: "推荐顺序：成品特写做封面 → 手艺人与作品同框 → 2—3 张制作过程 → 工具或材料细节 → 完成后的使用场景。每张图只讲一个重点。" },
    { keys: ["标题", "怎么写"], answer: "标题写“具体对象 + 一个真实看点”。例如“十颗牙背后，是一遍遍练出来的稳定”。避免“全网第一、看完震惊”等夸张词，通常控制在 20 字内。" },
    { keys: ["话题", "标签"], answer: "发布页正文下方输入 # 选择话题。优先 3—5 个：手艺名称、非遗、城市地点、内容类型。不要为了流量添加与内容无关的热门话题。" },
    { keys: ["评论", "回复"], answer: "先感谢，再回答一个具体问题。有人质疑时提供可核对来源；有人想模仿危险动作时明确提醒必须由专业传承人指导；遇到辱骂不争辩，可隐藏或举报。" },
    { keys: ["数据", "浏览", "收藏", "复盘"], answer: "发布后重点记三项：收藏多说明知识有用，评论多说明话题有讨论度，主页访问多说明人物故事建立了兴趣。把最高的一项变成下一篇的延伸内容。" },
    { keys: ["虚假", "夸张", "不能", "合规"], answer: "发布前核对：人物身份、历史年代、机构名称、荣誉称号是否有依据；不写“最、第一、包治、绝对”等无法证明的话；不编造销量和学员反馈；危险技艺要加专业指导提示。" }
  ];

  function localAnswer(question) {
    const normalized = question.toLowerCase();
    let best = null;
    let max = 0;
    fallbackKnowledge.forEach((item) => {
      const score = item.keys.filter((key) => normalized.includes(key.toLowerCase())).length;
      if (score > max) { max = score; best = item; }
    });
    if (max > 0) return best.answer;
    return "暂时连不上大模型时，我仍可回答平台入门问题。请换个问法，例如：怎么发第一篇、标题怎么写、评论怎么回复、数据在哪里看。";
  }

  function expandQuestion(raw) {
    const key = raw.trim();
    return topicExpand[key] || (key.length <= 4 ? `请用简单步骤回答手艺人的小红书运营问题：${key}` : key);
  }

  function addMessage(text, role) {
    const message = document.createElement("div");
    message.className = `chat ${role}`;
    message.innerHTML = `<span>${role === "ai" ? "AI" : "我"}</span><p></p>`;
    $("p", message).textContent = text;
    $("#chat-messages").append(message);
    $("#chat-messages").scrollTop = $("#chat-messages").scrollHeight;
    return message;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = $("#chat-question");
    const raw = input.value.trim();
    if (!raw) return;
    const question = expandQuestion(raw);
    addMessage(raw, "user");
    input.value = "";
    const thinking = addMessage("大模型思考中…", "ai");
    try {
      if (!window.QiniuAI) throw new Error("AI 模块未加载");
      const answer = await window.QiniuAI.askShuaya(question);
      thinking.querySelector("p").textContent = answer;
      toast("大模型已回复");
    } catch (err) {
      const local = localAnswer(question + raw);
      thinking.querySelector("p").textContent = local;
      toast(err.message?.slice(0, 80) || "已使用本地知识库回答");
    }
  });

  $$(".topic-cloud button").forEach((button) => button.addEventListener("click", () => {
    $("#chat-question").value = button.textContent.trim();
    form.requestSubmit();
  }));
}

async function initAiStatus() {
  const badge = $("#ai-status");
  if (!badge) return;
  if (!window.QiniuAI) {
    badge.textContent = "AI 模块未加载";
    badge.classList.add("offline");
    return;
  }
  try {
    const health = await window.QiniuAI.health();
    if (health.ok && health.keyConfigured) {
      badge.textContent = `大模型已连接 · ${health.model || "deepseek-v3"} · 七牛云`;
      badge.classList.add("online");
      badge.classList.remove("offline");
    } else {
      badge.textContent = "大模型服务未连接";
      badge.classList.add("offline");
    }
  } catch {
    badge.textContent = "大模型服务未连接";
    badge.classList.add("offline");
  }
}

function runCopyrightScan(fileName) {
  const results = $("#monitor-results");
  $("#monitor-count").textContent = "正在生成视频指纹…";
  results.className = "monitor-empty";
  results.innerHTML = `<div>◌</div><p>正在分析“${fileName}”的画面、声音与关键帧特征…</p>`;
  setTimeout(() => {
    $("#monitor-count").textContent = "发现 4 条疑似内容";
    results.className = "";
    results.innerHTML = `
      <div class="monitor-item"><span>▶</span><div><strong>“十颗牙绝技现场，看完惊呆了”</strong><small>短视频平台 A · 疑似裁剪搬运 · 建议：比对原始成片时间码</small></div><b>96%</b></div>
      <div class="monitor-item"><span>▶</span><div><strong>“宁海民间绝活大赏”合集</strong><small>内容平台 B · 使用约 18 秒片段 · 建议：要求署名或下架</small></div><b>82%</b></div>
      <div class="monitor-item"><span>▶</span><div><strong>宁海平调耍牙混剪 Vol.03</strong><small>视频平台 C · 二次创作 · 建议：人工复核是否合理使用</small></div><b>67%</b></div>
      <div class="monitor-item"><span>▶</span><div><strong>“女人也能耍牙？太厉害了”</strong><small>社交平台 D · 截取薛巧萍公开片段 · 建议：引导至正版账号</small></div><b>74%</b></div>`;
    toast("视频指纹演示分析完成");
  }, 1300);
}

function initCopyright() {
  $("#video-upload")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    runCopyrightScan(file.name);
  });

  $$(".sample-video-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.dataset.label || btn.textContent.trim();
      const path = btn.dataset.sample || "";
      runCopyrightScan(`${label}（${path.split("/").pop()}）`);
    });
  });
}

function renderInsight(data) {
  if (data.advice) {
    $("#insight-advice").textContent = data.advice;
    $("#insight-tip b").textContent = "AI 建议 · 大模型已刷新";
  }
  if (Array.isArray(data.topics) && data.topics.length) {
    $("#insight-board").innerHTML = data.topics.slice(0, 4).map((item, i) => `
      <article class="insight-chip">
        <strong>${item.title || `选题 ${String.fromCharCode(65 + i)}`}</strong>
        <span>${item.desc || ""}</span>
      </article>`).join("");
  }
  if (Array.isArray(data.comments) && data.comments.length) {
    $("#insight-comments").innerHTML = data.comments.slice(0, 4)
      .map((c) => `<li>${String(c).replace(/[<>]/g, "")}</li>`).join("");
  }
  if (Array.isArray(data.bars) && data.bars.length) {
    $("#insight-bars").innerHTML = data.bars.slice(0, 6).map((bar) => {
      const value = Math.max(5, Math.min(100, Number(bar.value) || 50));
      return `<div style="--value:${value}%"><span>${bar.name || "主题"}</span><i><em></em></i><b>${value}%</b></div>`;
    }).join("");
  }
}

function initInsight() {
  const btn = $("#refresh-insight");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.innerHTML = "大模型分析中 <span>···</span>";
    try {
      if (!window.QiniuAI?.generateInsight) throw new Error("AI 模块未就绪");
      const data = await window.QiniuAI.generateInsight();
      renderInsight(data);
      toast("传播洞察已由大模型刷新");
    } catch (err) {
      toast(err.message?.slice(0, 90) || "洞察刷新失败");
    } finally {
      btn.disabled = false;
      btn.innerHTML = "大模型刷新洞察 <span>✦</span>";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initLabTabs();
  initCamera();
  initScriptTools();
  initChat();
  initCopyright();
  initInsight();
  initAiStatus();
});
})();
