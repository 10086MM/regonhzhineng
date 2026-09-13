/**
 * 前端直连七牛云大模型（OpenAI 兼容 Chat Completions）
 * 文档：https://api.qnaigc.com/v1/chat/completions
 */
(() => {
  const API_KEY = "sk-310f0968d49f042fca60d6a428748a1b02d49a604df01859b5e7c5deb29df882";
  const BASE_URL = "https://api.qnaigc.com/v1";
  const MODEL = "deepseek-v3";

  const SYSTEM_SHUAYA = `你是「牙韵新生」项目的手艺人小红书营销助手，专注帮助宁海平调·耍牙传承人使用内容平台。
硬性要求：
1. 围绕小红书账号入门、图文笔记、短视频、标题、封面、话题、评论互动、数据复盘与合规表达回答。
2. 内容必须基于手艺人提供的事实，不虚构传承经历、疗效、销量或荣誉，不鼓励危险模仿。
3. 涉及耍牙时强调它属于宁海平调戏曲表演程式，并保留传承人和机构署名。
4. 回答用简体中文、短句和编号步骤，默认面对不熟悉智能手机营销功能的手艺人。
5. 若问题与平台营销无关，礼貌拉回「如何把真实手艺讲清楚并发布」这一目标。`;

  async function chat({ messages, temperature = 0.7, max_tokens = 1200 } = {}) {
    if (!API_KEY) throw new Error("未配置七牛云 API Key");

    let res;
    try {
      res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature,
          max_tokens,
          stream: false
        })
      });
    } catch (err) {
      throw new Error(
        "无法连接七牛云大模型。请确认已联网，并用浏览器打开网页（不要用受限的本地预览方式）。\n" +
        (err.message || String(err))
      );
    }

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`七牛云返回非 JSON（HTTP ${res.status}）`);
    }

    if (!res.ok) {
      const msg = data?.error?.message || data?.message || data?.error || `请求失败（${res.status}）`;
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("大模型未返回有效内容");
    return String(content).trim();
  }

  async function askShuaya(userText, extraSystem = "") {
    return chat({
      messages: [
        { role: "system", content: SYSTEM_SHUAYA + (extraSystem ? `\n${extraSystem}` : "") },
        { role: "user", content: userText }
      ],
      temperature: 0.6,
      max_tokens: 900
    });
  }

  async function generateScript({ topic, audience, duration }) {
    const prompt = `请把手艺人的真实素材整理成一套可直接修改的小红书图文笔记。
作品/故事：${topic}
目标读者：${audience}
笔记长度：${duration}

输出格式（用 Markdown 小标题，不要代码块）：
## 标题备选
给出 3 个自然、不过度夸张的标题，每个不超过 20 字。
## 正文
第一人称写作，结构为「作品亮相—怎么做—为什么坚持—邀请交流」，避免营销腔。
## 图片顺序
给出 6 张图的拍摄与排序建议，注明哪张做封面。
## 封面文字
给出 2 组 8—12 字封面字。
## 话题与地点
给出 5 个相关话题，并说明是否建议添加宁海本地地点。
## 发布前核对
列出署名、事实、错别字和安全提示四项。

语气真诚、具体、有生活感，不使用「震惊」「绝绝子」「全网第一」等夸张词。`;
    return askShuaya(prompt, "你现在是小红书内容编辑，目标是降低手艺人的发布门槛。");
  }

  async function generateSubtitleNotes({ text, style, maxLen }) {
    const prompt = `把下面这段手艺人口述整理成小红书标题与封面文字。
风格：${style}
封面建议不超过 ${maxLen} 字。
请输出：
1) 5 个标题（每个不超过 20 字，不夸张）
2) 3 组封面主标题 + 小字说明
3) 一句真实、克制的开头

原文：
${text}`;
    return askShuaya(prompt, "保留手艺人的口吻和事实，不编造细节。");
  }

  const REPORT_SOURCE_FACTS = `【本人材料：可作为事实来源】
1. 调查主题：结合家乡或所在地区特色，探索AI赋能经济与社会发展的具体方案。
2. 调查地点：浙江省宁波市宁海县平调艺术传承中心；详细版还提出辅助观察抖音、快手、B站等平台的“耍牙”“宁海平调”相关内容。
3. 调查对象：国家级非物质文化遗产代表性传承人叶全民及其弟子，包括第六代女传人薛巧萍；可兼顾传承中心管理人员与剧团演员。
4. 对接时间：2026年8月。
5. 对接原因：关注叶全民培养女性传人、打破旧规，以及“非遗热”中官方传承主体内容生产困难、文化解释不足、流量与收益难回到技艺本源的问题。
6. 材料中的核心问题：耍牙训练门槛高、口腔磨损风险明显；传统舞台机会有限，年轻群体认知较低；短视频常突出惊险片段而弱化宁海平调和剧目语境；传承人有本职演出与教学工作且不熟悉剪辑运营；搬运与二次剪辑使正版主体难以持续获益。
7. 材料中的原始方案：AI剪辑、语音转字幕和AIGC脚本降低内容生产门槛；以宁海平调、《金莲斩蛟》等为底本补充科普；分析评论与浏览数据形成选题；梳理原创保护、申诉和版权登记流程；探索官方主体运营、线下演出、研学与文创等连接。
8. 当前已经完成的网页原型：以宁海平调耍牙为示例，包含拍摄助手、小红书图文素材生成、平台发布课堂、运营复盘四个入口。生成器可输出标题、正文、封面字、图片顺序、话题标签与发布核对项；平台课堂覆盖注册、发布、话题、地点、评论和合规提醒；运营数据明确为课程模拟数据。
9. 当前聚焦方案：AI负责整理真实照片与口述，手艺人本人负责事实确认；目标是降低小红书内容生产和平台使用门槛，不承诺流量与收益。
10. 可选专业加分点：详细版材料提出结合本人柬埔寨语专业制作小语种字幕。只有在用户填写的专业信息能够支持时才可写入。

【本人材料中的待核验内容】
材料涉及具体牙齿来源、训练受伤经历、训练年限、人物生平、牙数和造型数量等细节。没有新增的访谈记录或权威来源时，只能写“选题材料记载”“公开资料有待进一步核验”或“拟在访谈中求证”，不得当作已完成调查结论。

【参考报告：只能借鉴形式】
参考文档是一份关于云南西双版纳傣族章哈和“薪火智联”AI非遗经纪人的课程报告。只可借鉴它的章节安排、调查方法说明、AI工具使用记录、人工复核、作品说明、应用价值、发布迭代和证据台账写法。禁止写入其中的傣族章哈、玉叫、曼袄村、薪火智联、王易选、供需匹配、酒店婚庆样本、政策数据、链接、参考文献或任何结论。`;

  async function generateReportSection({ section, profile, previousSummary = "" }) {
    const focusText = profile.focus === "full"
      ? "以本人选题表的内容生产、文化科普、数据选题、权益保护四环节为主线，同时把当前网页作为其中的轻量内容生产与教学原型。"
      : "以当前已经实现的‘AI生成小红书素材 + 教手艺人使用平台’为主线；原选题中的动作纠错、商用版权监测等仅作为方案收束过程或后续展望，不写成已经实现。";
    const lengthGuide = profile.length === "brief" ? "本节控制在300至450字" : "本节控制在550至800字";
    const specialLengths = {
      abstract: profile.length === "brief" ? "摘要约250字并附3至5个关键词" : "摘要约350至450字并附3至5个关键词",
      conclusion: profile.length === "brief" ? "结论约300字" : "结论约500至650字",
      records: profile.length === "brief" ? "约400字" : "约600至800字"
    };
    const authorLine = profile.author ? `姓名：${profile.author}` : "姓名未填写，不要编造姓名";
    const majorLine = profile.major ? `学院与专业：${profile.major}` : "学院与专业未填写，不要从参考报告借用专业信息";
    const notesLine = profile.notes ? `用户补充的已完成情况：${profile.notes}` : "用户没有补充访谈或发布结果，因此不得写成已完成访谈、已发布平台、已获得真实反馈或真实运营数据";
    const prompt = `请撰写课程报告中的“${section.title}”章节。

报告题目：${profile.title}
${authorLine}
${majorLine}
写作口径：${focusText}
${notesLine}
篇幅要求：${specialLengths[section.key] || lengthGuide}

${REPORT_SOURCE_FACTS}

已生成章节的末段上下文（仅用于衔接，不得覆盖事实边界）：
${previousSummary || "这是第一节"}

写作要求：
1. 只输出本章节正文，不重复报告题目，不使用代码块。
2. 使用正式、自然的大学课程报告语气，避免口号、夸大和模板腔。
3. 严格区分“材料记载”“计划开展”“已经完成”“模拟数据”。没有证据的成果不得写成已发生。
4. 不得出现参考报告的项目事实、人物、地点、数据、文献与结论。
5. 若本节需要来源标注但本人材料未提供可追溯链接，用“[来源待补]”标记；不得伪造参考文献。
6. 涉及AI时写清工具作用、人工修改和事实核验，不把AI输出当作数据来源。
7. “${section.title}”应围绕宁海平调耍牙、小红书素材生成、手艺人平台课堂和当前网页原型展开。`;
    return chat({
      messages: [
        { role: "system", content: SYSTEM_SHUAYA + "\n你现在是课程报告写作助手，必须执行来源隔离，绝不把参考范文内容当成用户事实。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.35,
      max_tokens: profile.length === "brief" ? 1200 : 1900
    });
  }

  async function health() {
    return {
      ok: Boolean(API_KEY),
      keyConfigured: Boolean(API_KEY),
      model: MODEL,
      provider: "qiniu",
      mode: "frontend-direct"
    };
  }

  async function generateInsight() {
    const prompt = `你是帮助非遗手艺人运营小红书的陪练。请基于模拟的收藏、评论与主页访问，输出容易理解的复盘建议，严格用下面 JSON（不要 markdown 代码块，不要多余文字）：
{
  "advice": "80-120字策略建议，说明下篇拍什么、为什么",
  "topics": [
    {"title":"选题A·标题","desc":"40-60字做法说明"},
    {"title":"选题B·标题","desc":"40-60字做法说明"},
    {"title":"选题C·标题","desc":"40-60字做法说明"},
    {"title":"选题D·标题","desc":"40-60字做法说明"}
  ],
  "comments": ["模拟评论1","模拟评论2","模拟评论3","模拟评论4"],
  "bars": [
    {"name":"制作过程","value":92},
    {"name":"细节特写","value":84},
    {"name":"手艺人故事","value":78},
    {"name":"使用场景","value":71},
    {"name":"学徒日常","value":63},
    {"name":"成品展示","value":48}
  ]
}
bars 的 value 可在合理范围内微调（整数百分比）。内容以宁海平调耍牙为例，但方法要让其他传统手艺人也能照着做。`;
    const raw = await askShuaya(prompt, "只输出合法 JSON。");
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("洞察结果解析失败");
    return JSON.parse(match[0]);
  }

  async function generateEditAdvice({ brief, duration }) {
    const prompt = `请为手艺人的小红书内容生成一份发布前检查清单。
现有素材：${brief}
发布形式：${duration}

输出 Markdown（不要代码块）：
## 素材排序
逐张说明图片/视频的顺序与作用。
## 发布设置
列出封面、标题、正文、话题、地点、原创声明的选择建议。
## 事实与合规
检查人物署名、机构名称、夸张宣传、危险模仿提示。
## 发布后 24 小时
列出查看评论、友好回复、记录数据三个动作。
要求步骤少、语言简单，手艺人能照着逐项打勾。`;
    return askShuaya(prompt, "你是耐心的小红书发布陪练。");
  }

  window.QiniuAI = {
    chat,
    askShuaya,
    generateScript,
    generateSubtitleNotes,
    generateEditAdvice,
    generateInsight,
    generateReportSection,
    health,
    SYSTEM_SHUAYA,
    MODEL
  };
})();
