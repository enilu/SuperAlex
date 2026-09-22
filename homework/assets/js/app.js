const state = {
  collections: [],
  activeCollection: null,
  activeSubject: null,
  activeCategory: "全部",
  query: "",
  activeItem: null,
  filterYear: "全部",
  filterGrade: "全部"
};

const typeLabels = {
  pdf: "PDF",
  video: "视频",
  audio: "音频",
  image: "图片",
  text: "文字"
};

const typeMarks = {
  pdf: "PDF",
  video: "▶",
  audio: "♪",
  image: "图",
  text: "文"
};

function collectionPeriod(collection) {
  if (collection.holiday) return collection.holiday;
  return collection.semester || "归档";
}

const assetVersion = "20260618-pdfjs-classic";

const pdfReader = {
  pdfjs: null,
  document: null,
  pageNumber: 1,
  pageCount: 0,
  scale: 1.15,
  rendering: false,
  renderTask: null,
  loadingTimer: null,
  item: null
};

const els = {
  homeButton: document.querySelector("#homeButton"),
  homeView: document.querySelector("#homeView"),
  collectionsSection: document.querySelector("#collectionsSection"),
  stats: document.querySelector("#stats"),
  filterBar: document.querySelector("#filterBar"),
  yearFilters: document.querySelector("#yearFilters"),
  gradeFilters: document.querySelector("#gradeFilters"),
  collectionGroups: document.querySelector("#collectionGroups"),
  libraryView: document.querySelector("#libraryView"),
  backToHome: document.querySelector("#backToHome"),
  collectionMeta: document.querySelector("#collectionMeta"),
  categoryList: document.querySelector("#categoryList"),
  activeBreadcrumb: document.querySelector("#activeBreadcrumb"),
  activeTitle: document.querySelector("#activeTitle"),
  searchInput: document.querySelector("#searchInput"),
  subjectGrid: document.querySelector("#subjectGrid"),
  itemGrid: document.querySelector("#itemGrid"),
  viewerView: document.querySelector("#viewerView"),
  backToLibrary: document.querySelector("#backToLibrary"),
  viewerType: document.querySelector("#viewerType"),
  viewerTitle: document.querySelector("#viewerTitle"),
  downloadLink: document.querySelector("#downloadLink"),
  viewerFrame: document.querySelector("#viewerFrame"),
  videoNav: document.querySelector("#videoNav"),
  prevVideo: document.querySelector("#prevVideo"),
  nextVideo: document.querySelector("#nextVideo")
};

async function init() {
  const response = await fetch("data/homework.json?v=20260904-learning-library-6", {
    cache: "no-store"
  });
  const data = await response.json();
  state.collections = data.collections;

  const params = new URLSearchParams(window.location.search);
  const collectionId = params.get("collection");
  const itemId = params.get("item");
  state.filterYear = params.get("year") || "全部";
  state.filterGrade = params.get("grade") || "全部";

  renderHome();
  bindEvents();

  if (collectionId) {
    openCollection(collectionId);
  }
  if (collectionId && itemId) {
    const item = allItems().find((entry) => entry.id === itemId);
    if (item) openItem(item);
  }
}

function bindEvents() {
  els.homeButton.addEventListener("click", () => {
    state.filterYear = "全部";
    state.filterGrade = "全部";
    showHome();
    renderHome();
    updateUrl({});
  });
  els.backToHome.addEventListener("click", () => {
    state.filterYear = "全部";
    state.filterGrade = "全部";
    showHome();
    renderHome();
    updateUrl({});
  });
  els.backToLibrary.addEventListener("click", showLibrary);
  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderItems();
  });
  els.prevVideo.addEventListener("click", () => moveVideo(-1));
  els.nextVideo.addEventListener("click", () => moveVideo(1));
}

function renderHome() {
  const totals = state.collections.reduce(
    (acc, collection) => {
      acc.collections += 1;
      acc.files += collection.items.length;
      acc.documents += collection.items.filter((item) => ["pdf", "text"].includes(item.type)).length;
      acc.media += collection.items.filter((item) => ["audio", "video", "image"].includes(item.type)).length;
      acc.subjects += subjectsFor(collection).length;
      return acc;
    },
    { collections: 0, files: 0, documents: 0, media: 0, subjects: 0 }
  );

  els.stats.innerHTML = [
    ["资料集合", totals.collections],
    ["学科分类", totals.subjects],
    ["资料总数", totals.files],
    ["文档资料", totals.documents],
    ["音视频与图片", totals.media]
  ].map(([label, value]) => `
    <article class="stat-card">
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  renderFilters();
  renderCollectionGroups();
}

function renderFilters() {
  const years = ["全部", ...new Set(state.collections.map((c) => c.academicYear).filter(Boolean))].sort();
  const grades = ["全部", ...new Set(state.collections.map((c) => c.grade).filter(Boolean))];

  els.yearFilters.innerHTML = years.map((year) => `
    <button class="filter-button ${year === state.filterYear ? "is-active" : ""}" data-year="${year}">${year}</button>
  `).join("");

  els.gradeFilters.innerHTML = grades.map((grade) => `
    <button class="filter-button ${grade === state.filterGrade ? "is-active" : ""}" data-grade="${grade}">${grade}</button>
  `).join("");

  els.yearFilters.querySelectorAll("[data-year]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filterYear = button.dataset.year;
      renderHome();
      updateUrl(filterParams());
    });
  });

  els.gradeFilters.querySelectorAll("[data-grade]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filterGrade = button.dataset.grade;
      renderHome();
      updateUrl(filterParams());
    });
  });
}

function filterParams() {
  const params = {};
  if (state.filterYear !== "全部") params.year = state.filterYear;
  if (state.filterGrade !== "全部") params.grade = state.filterGrade;
  return params;
}

function renderCollectionGroups() {
  const filtered = state.collections.filter((c) => {
    const yearMatch = state.filterYear === "全部" || c.academicYear === state.filterYear;
    const gradeMatch = state.filterGrade === "全部" || c.grade === state.filterGrade;
    return yearMatch && gradeMatch;
  });

  if (!filtered.length) {
    els.collectionGroups.innerHTML = `<p class="empty-state">没有匹配的资料集合。</p>`;
    return;
  }

  const groups = {};
  filtered.forEach((c) => {
    const key = c.academicYear || "未分类";
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  const sortedYears = Object.keys(groups).sort();

  els.collectionGroups.innerHTML = sortedYears.map((year) => `
    <div class="collection-group">
      <h3 class="collection-group-title">${year} 学年 <span class="group-count">${groups[year].length} 个集合</span></h3>
      <div class="collection-grid">
        ${groups[year].map((collection) => collectionCardHtml(collection)).join("")}
      </div>
    </div>
  `).join("");

  els.collectionGroups.querySelectorAll("[data-collection-id]").forEach((button) => {
    button.addEventListener("click", () => openCollection(button.dataset.collectionId));
  });
}

function collectionCardHtml(collection) {
  const audioCount = collection.items.filter((item) => item.type === "audio").length;
  const mediaCount = collection.items.filter((item) => ["video", "image"].includes(item.type)).length;
  const subjects = subjectsFor(collection);
  return `
    <button class="collection-card" data-collection-id="${collection.id}">
      <span class="cover-mark">${collection.cover}</span>
      <span>
        <h3>${collection.title}</h3>
        <p>${collection.summary}</p>
        <span class="tag-row">
          <span class="tag">${collection.stage || "小学"}</span>
          <span class="tag">${collection.grade}</span>
          <span class="tag">${collectionPeriod(collection)}</span>
          <span class="tag">${subjects.length} 个学科</span>
          ${audioCount ? `<span class="tag">${audioCount} 个音频</span>` : ""}
          ${mediaCount ? `<span class="tag">${mediaCount} 个媒体</span>` : ""}
        </span>
      </span>
    </button>
  `;
}

function openCollection(collectionId) {
  state.activeCollection = state.collections.find((collection) => collection.id === collectionId);
  state.activeSubject = null;
  state.activeCategory = "全部";
  state.query = "";
  els.searchInput.value = "";
  renderLibrary();
  showLibrary();
  updateUrl({ collection: collectionId });
}

function renderLibrary() {
  const collection = state.activeCollection;
  if (!collection) return;

  els.collectionMeta.innerHTML = `
    <h2>${collection.title}</h2>
    <p>${collection.academicYear || collection.year} · ${collection.stage || "小学"} · ${collection.grade} · ${collectionPeriod(collection)}</p>
  `;

  const year = collection.academicYear || collection.year;
  const grade = collection.grade;
  const subject = state.activeSubject;

  els.activeBreadcrumb.className = "eyebrow breadcrumb";
  els.activeBreadcrumb.innerHTML = `
    <button data-breadcrumb="year" data-value="${year}">${year}</button>
    <span class="breadcrumb-sep">/</span>
    <button data-breadcrumb="grade" data-value="${grade}">${grade}</button>
    <span class="breadcrumb-sep">/</span>
    ${subject
      ? `<button data-breadcrumb="subject" data-value="${subject}">${subject}</button>`
      : `<span class="breadcrumb-current">学科</span>`
    }
  `;

  els.activeBreadcrumb.querySelectorAll("[data-breadcrumb]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.breadcrumb;
      const value = button.dataset.value;
      if (action === "year") {
        state.filterYear = value;
        state.filterGrade = "全部";
        showHome();
        renderHome();
        updateUrl({ year: value });
      } else if (action === "grade") {
        state.filterGrade = value;
        state.filterYear = "全部";
        showHome();
        renderHome();
        updateUrl({ grade: value });
      } else if (action === "subject") {
        state.activeSubject = null;
        state.activeCategory = "全部";
        state.query = "";
        els.searchInput.value = "";
        renderLibrary();
        updateUrl({ collection: state.activeCollection.id });
      }
    });
  });

  els.activeTitle.textContent = state.activeSubject ? `${state.activeSubject}资料目录` : "选择学科";
  renderSubjects();
  renderCategories();
  renderItems();
}

function renderSubjects() {
  const subjects = subjectsFor(state.activeCollection);
  els.subjectGrid.classList.toggle("is-hidden", Boolean(state.activeSubject));
  els.subjectGrid.innerHTML = subjects.map((subject) => {
    const items = itemsForSubject(subject);
    const audioCount = items.filter((item) => item.type === "audio").length;
    const documentCount = items.filter((item) => ["pdf", "text"].includes(item.type)).length;
    return `
      <button class="subject-card" data-subject="${subject}">
        <span class="subject-mark">${subject.slice(0, 1)}</span>
        <span>
          <h3>${subject}</h3>
          <p>${items.length} 个资料 · ${documentCount} 个文档 · ${audioCount} 个音频</p>
        </span>
      </button>
    `;
  }).join("");

  els.subjectGrid.querySelectorAll("[data-subject]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSubject = button.dataset.subject;
      state.activeCategory = "全部";
      state.query = "";
      els.searchInput.value = "";
      renderLibrary();
    });
  });
}

function renderCategories() {
  const items = state.activeSubject ? itemsForSubject(state.activeSubject) : [];
  const categories = ["全部", ...new Set(items.map((item) => item.category))];
  els.categoryList.classList.toggle("is-hidden", !state.activeSubject);
  els.categoryList.innerHTML = categories.map((category) => {
    const count = category === "全部"
      ? items.length
      : items.filter((item) => item.category === category).length;
    const activeClass = category === state.activeCategory ? "is-active" : "";
    return `<button class="${activeClass}" data-category="${category}"><span>${category}</span><strong>${count}</strong></button>`;
  }).join("");

  els.categoryList.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      renderCategories();
      renderItems();
    });
  });
}

function renderItems() {
  if (!state.activeSubject) {
    els.itemGrid.innerHTML = "";
    return;
  }

  const items = filteredItems();
  if (!items.length) {
    els.itemGrid.innerHTML = `<p class="empty-state">没有找到匹配的资料。</p>`;
    return;
  }

  const groups = [...new Set(items.map((item) => item.group || item.category))]
    .sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }));
  els.itemGrid.innerHTML = groups.map((group) => {
    const groupItems = items.filter((item) => (item.group || item.category) === group);
    const cards = groupItems.map((item) => {
      const note = item.note || "点击查看资料。";
      return `
        <button class="item-card" data-item-id="${item.id}">
          <span class="item-type ${item.type}">${typeMarks[item.type] || "文"}</span>
          <h3>${item.title}</h3>
          <p>${note}</p>
          <span class="tag-row">
            <span class="tag">${item.category}</span>
            <span class="tag">${typeLabels[item.type] || "资料"}</span>
          </span>
        </button>
      `;
    }).join("");
    return `
      <section class="item-group">
        <div class="item-group-heading">
          <h3>${group}</h3>
          <span>${groupItems.length} 个资料</span>
        </div>
        <div class="item-group-grid">${cards}</div>
      </section>
    `;
  }).join("");

  els.itemGrid.querySelectorAll("[data-item-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = allItems().find((entry) => entry.id === button.dataset.itemId);
      openItem(item);
    });
  });
}

function filteredItems() {
  return itemsForSubject(state.activeSubject).filter((item) => {
    const inCategory = state.activeCategory === "全部" || item.category === state.activeCategory;
    const text = `${item.title} ${item.subject} ${item.category} ${item.group || ""} ${item.note || ""}`.toLowerCase();
    return inCategory && (!state.query || text.includes(state.query));
  });
}

function openItem(item) {
  if (!item) return;
  cleanupPdfReader();
  state.activeItem = item;
  els.viewerTitle.textContent = item.title;
  els.viewerType.textContent = `${typeLabels[item.type] || "资料"}${["audio", "video"].includes(item.type) ? "播放" : "预览"}`;
  els.downloadLink.href = item.path;
  els.downloadLink.setAttribute("download", "");
  els.videoNav.classList.toggle("is-hidden", !["audio", "video"].includes(item.type));

  if (item.type === "pdf") {
    if (shouldUsePdfJs()) {
      openPdfReader(item);
    } else {
      openNativePdfViewer(item);
    }
  } else if (item.type === "text") {
    openTextViewer(item);
  } else if (item.type === "video") {
    els.viewerFrame.innerHTML = `<video controls preload="metadata" src="${encodeURI(item.path)}"></video>`;
    updateMediaNav();
  } else if (item.type === "audio") {
    els.viewerFrame.innerHTML = `
      <div class="audio-viewer">
        <span class="audio-mark" aria-hidden="true">♪</span>
        <h3>${item.title}</h3>
        <p>${item.group || item.category}</p>
        <audio controls preload="metadata" src="${encodeURI(item.path)}"></audio>
      </div>`;
    updateMediaNav();
  } else if (item.type === "image") {
    els.viewerFrame.innerHTML = `<div class="image-viewer"><img src="${encodeURI(item.path)}" alt="${item.title}"></div>`;
  }

  showViewer();
  updateUrl({ collection: state.activeCollection.id, item: item.id });
}

function openNativePdfViewer(item) {
  els.viewerFrame.innerHTML = `
    <iframe title="${item.title}" src="${encodeURI(item.path)}"></iframe>
  `;
}


function openTextViewer(item) {
  fetch(item.path)
    .then(r => r.text())
    .then(text => {
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      els.viewerFrame.innerHTML = `<div class="text-viewer">${escaped}</div>`;
    })
    .catch(() => {
      els.viewerFrame.innerHTML = `<div class="text-viewer text-viewer--error">加载失败，请下载后查看。</div>`;
    });
}

function shouldUsePdfJs() {
  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const smallScreen = window.matchMedia?.("(max-width: 760px)")?.matches;
  return Boolean(coarsePointer || smallScreen);
}

async function openPdfReader(item) {
  pdfReader.item = item;
  pdfReader.pageNumber = 1;
  pdfReader.pageCount = 0;
  pdfReader.scale = getInitialPdfScale();
  els.viewerFrame.innerHTML = `
    <div class="pdf-reader">
      <div class="pdf-controls" aria-label="PDF 阅读工具">
        <button id="pdfPrevPage" type="button" title="上一页">上一页</button>
        <span class="pdf-page-status" id="pdfPageStatus">加载中</span>
        <button id="pdfNextPage" type="button" title="下一页">下一页</button>
        <span class="pdf-control-spacer"></span>
        <button id="pdfZoomOut" type="button" title="缩小">-</button>
        <span class="pdf-zoom-status" id="pdfZoomStatus">100%</span>
        <button id="pdfZoomIn" type="button" title="放大">+</button>
      </div>
      <div class="pdf-message" id="pdfMessage">
        <strong>正在加载 PDF</strong>
        <span>如果长时间无法预览，可以先下载原文件。</span>
        <a href="${item.path}" download>下载 PDF</a>
      </div>
      <div class="pdf-canvas-wrap">
        <canvas id="pdfCanvas"></canvas>
      </div>
    </div>
  `;

  bindPdfControls();
  setPdfLoadingTimeout();

  try {
    const pdfjs = await loadPdfJs();
    const pdfUrl = new URL(encodeURI(item.path), window.location.href).href;
    const loadingTask = pdfjs.getDocument({ url: pdfUrl, disableWorker: true });
    pdfReader.document = await loadingTask.promise;
    pdfReader.pageCount = pdfReader.document.numPages;
    clearPdfLoadingTimeout();
    await renderPdfPage();
  } catch (error) {
    showPdfFallback("当前浏览器无法在线预览这个 PDF，可以下载后查看。", true);
    console.error(error);
  }
}

async function loadPdfJs() {
  if (pdfReader.pdfjs) return pdfReader.pdfjs;
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) {
    throw new Error("PDF.js 没有加载成功");
  }
  const pdfWorkerUrl = new URL(`assets/vendor/pdfjs/pdf.worker.min.js?v=${assetVersion}`, window.location.href).href;
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  pdfReader.pdfjs = pdfjs;
  return pdfjs;
}

function bindPdfControls() {
  document.querySelector("#pdfPrevPage")?.addEventListener("click", () => movePdfPage(-1));
  document.querySelector("#pdfNextPage")?.addEventListener("click", () => movePdfPage(1));
  document.querySelector("#pdfZoomOut")?.addEventListener("click", () => zoomPdf(-0.15));
  document.querySelector("#pdfZoomIn")?.addEventListener("click", () => zoomPdf(0.15));
}

async function renderPdfPage() {
  if (!pdfReader.document || pdfReader.rendering) return;
  pdfReader.rendering = true;
  const canvas = document.querySelector("#pdfCanvas");
  const message = document.querySelector("#pdfMessage");
  if (!canvas) return;

  try {
    const page = await pdfReader.document.getPage(pdfReader.pageNumber);
    const viewport = page.getViewport({ scale: pdfReader.scale });
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    if (pdfReader.renderTask) {
      pdfReader.renderTask.cancel();
    }
    pdfReader.renderTask = page.render({ canvasContext: context, viewport });
    await pdfReader.renderTask.promise;
    message?.classList.add("is-hidden");
    updatePdfControls();
  } catch (error) {
    if (error?.name !== "RenderingCancelledException") {
      showPdfFallback("PDF 预览加载失败，可以下载后查看。", true);
      console.error(error);
    }
  } finally {
    pdfReader.rendering = false;
    pdfReader.renderTask = null;
  }
}

async function movePdfPage(direction) {
  const nextPage = pdfReader.pageNumber + direction;
  if (nextPage < 1 || nextPage > pdfReader.pageCount) return;
  pdfReader.pageNumber = nextPage;
  await renderPdfPage();
}

async function zoomPdf(delta) {
  pdfReader.scale = Math.min(2.2, Math.max(0.6, Number((pdfReader.scale + delta).toFixed(2))));
  await renderPdfPage();
}

function updatePdfControls() {
  const pageStatus = document.querySelector("#pdfPageStatus");
  const zoomStatus = document.querySelector("#pdfZoomStatus");
  const prev = document.querySelector("#pdfPrevPage");
  const next = document.querySelector("#pdfNextPage");
  if (pageStatus) pageStatus.textContent = `第 ${pdfReader.pageNumber} / ${pdfReader.pageCount} 页`;
  if (zoomStatus) zoomStatus.textContent = `${Math.round(pdfReader.scale * 100)}%`;
  if (prev) prev.disabled = pdfReader.pageNumber <= 1;
  if (next) next.disabled = pdfReader.pageNumber >= pdfReader.pageCount;
}

function showPdfFallback(message, markFailed = false) {
  clearPdfLoadingTimeout();
  const messageBox = document.querySelector("#pdfMessage");
  if (!messageBox || !pdfReader.item) return;
  messageBox.classList.toggle("is-error", markFailed);
  messageBox.classList.remove("is-hidden");
  messageBox.innerHTML = `
    <strong>${markFailed ? "无法在线预览" : "PDF 加载较慢"}</strong>
    <span>${message}</span>
    <a href="${pdfReader.item.path}" download>下载 PDF</a>
  `;
}

function setPdfLoadingTimeout() {
  clearPdfLoadingTimeout();
  pdfReader.loadingTimer = window.setTimeout(() => {
    showPdfFallback("加载较慢，可以继续等待，或先下载 PDF。");
  }, 10000);
}

function clearPdfLoadingTimeout() {
  if (pdfReader.loadingTimer) {
    window.clearTimeout(pdfReader.loadingTimer);
    pdfReader.loadingTimer = null;
  }
}

function cleanupPdfReader() {
  clearPdfLoadingTimeout();
  if (pdfReader.renderTask) {
    pdfReader.renderTask.cancel();
  }
  pdfReader.document = null;
  pdfReader.pageNumber = 1;
  pdfReader.pageCount = 0;
  pdfReader.rendering = false;
  pdfReader.renderTask = null;
  pdfReader.item = null;
}

function getInitialPdfScale() {
  return window.innerWidth <= 560 ? 0.85 : 1.15;
}

function mediaSiblings() {
  return itemsForSubject(state.activeItem?.subject).filter((item) =>
    item.type === state.activeItem?.type && (item.group || item.category) === (state.activeItem?.group || state.activeItem?.category)
  );
}

function moveVideo(direction) {
  const media = mediaSiblings();
  const currentIndex = media.findIndex((item) => item.id === state.activeItem?.id);
  const next = media[currentIndex + direction];
  if (next) openItem(next);
}

function updateMediaNav() {
  const media = mediaSiblings();
  const currentIndex = media.findIndex((item) => item.id === state.activeItem?.id);
  els.prevVideo.disabled = currentIndex <= 0;
  els.nextVideo.disabled = currentIndex >= media.length - 1;
}

function showHome() {
  state.activeCollection = null;
  state.activeSubject = null;
  state.activeItem = null;
  els.homeView.classList.remove("is-hidden");
  els.collectionsSection.classList.remove("is-hidden");
  els.libraryView.classList.add("is-hidden");
  els.viewerView.classList.add("is-hidden");
}

function showLibrary() {
  els.homeView.classList.add("is-hidden");
  els.collectionsSection.classList.add("is-hidden");
  els.libraryView.classList.remove("is-hidden");
  els.viewerView.classList.add("is-hidden");
}

function showViewer() {
  els.homeView.classList.add("is-hidden");
  els.collectionsSection.classList.add("is-hidden");
  els.libraryView.classList.add("is-hidden");
  els.viewerView.classList.remove("is-hidden");
}

function subjectsFor(collection) {
  return collection.subjects?.length
    ? collection.subjects
    : [...new Set(collection.items.map((item) => item.subject).filter(Boolean))];
}

function allItems() {
  return state.activeCollection?.items || [];
}

function itemsForSubject(subject) {
  return allItems().filter((item) => item.subject === subject);
}

function updateUrl(params) {
  const search = new URLSearchParams(params).toString();
  const url = search ? `${location.pathname}?${search}` : location.pathname;
  history.replaceState({}, "", url);
}

init().catch((error) => {
  document.body.innerHTML = `<main class="error"><h1>学习资料加载失败</h1><p>${error.message}</p></main>`;
});
