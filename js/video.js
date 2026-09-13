(() => {
const { $, $$ } = window.App;

function playVideo(bvid, title) {
  const iframe = $("#heritage-video");
  if (!iframe) return;
  iframe.src = `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&autoplay=1`;
  iframe.title = title;
  const cover = $(".video-cover");
  if (cover) cover.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  $$(".video-item").forEach((item) => item.addEventListener("click", () => {
    $$(".video-item").forEach((node) => node.classList.remove("active"));
    item.classList.add("active");
    playVideo(item.dataset.bvid, item.dataset.title);
    const coverTitle = $(".video-cover strong");
    if (coverTitle) coverTitle.textContent = item.dataset.title;
  }));

  $$("[data-play-video]").forEach((button) => button.addEventListener("click", () => {
    playVideo(button.dataset.bvid, button.dataset.title);
  }));
});
})();
