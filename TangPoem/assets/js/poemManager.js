import { CONFIG } from './config.js';
import { AudioManager } from './audioManager.js';
import { CacheManager, CacheType } from './cacheManager.js';

const PoemManager = {
    poems: [],
    currentIndex: 0,
    currentFilter: 'all',

    async init(onProgress) {
        try {
            const indexResponse = await fetch(CONFIG.POEMS_INDEX_PATH);
            const indexData = await indexResponse.json();

            // 使用CacheManager读取缓存的诗歌数据
            const cachedPoems = CacheManager.get(CacheType.POEMS_DATA);
            if (cachedPoems) {
                console.log('📦 [诗歌] 使用缓存的诗歌数据');
                this.poems = cachedPoems;
                // 即使使用缓存，也要通知加载完成
                if (onProgress) onProgress(this.poems.length, this.poems.length, true);
            } else {
                await this.loadAllPoems(indexData.poems, onProgress);
            }
            this.initCatalog();
        } catch (error) {
            console.error('Load poems failed:', error);
            this.poems = [];
        }
    },

    async loadAllPoems(poemsList, onProgress) {
        const loadedPoems = [];
        for (const poemInfo of poemsList) {
            try {
                const response = await fetch(CONFIG.POEMS_DATA_PATH + poemInfo.file);
                const poemData = await response.json();
                loadedPoems.push(poemData);
                if (onProgress) onProgress(loadedPoems.length, poemsList.length, false);
            } catch (error) {
                console.error('Load poem failed:', error);
            }
        }
        this.poems = loadedPoems;
        // 使用CacheManager保存诗歌数据
        CacheManager.set(CacheType.POEMS_DATA, this.poems);
        // 加载完成，通知回调
        if (onProgress) onProgress(loadedPoems.length, poemsList.length, true);
    },

    getAllPoems() {
        return this.poems;
    },

    getPoemById(id) {
        return this.poems.find(poem => poem.id === id);
    },

    getCurrentPoem() {
        return this.poems[this.currentIndex];
    },

    nextPoem() {
        if (this.currentIndex < this.poems.length - 1) {
            this.currentIndex++;
            this.renderCurrentPoem();
            this.updateCatalogHighlight();
        }
    },

    prevPoem() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentPoem();
            this.updateCatalogHighlight();
        }
    },

    renderCurrentPoem() {
        const poem = this.getCurrentPoem();
        if (!poem) return;

        const titleEl = document.getElementById('poemTitle');
        const authorEl = document.getElementById('poemAuthor');
        const contentEl = document.getElementById('poemContent');
        const translationEl = document.getElementById('poemTranslation');

        if (titleEl) titleEl.textContent = poem.title;
        if (authorEl) authorEl.textContent = poem.dynasty + ' · ' + poem.author;

        if (contentEl) {
            contentEl.innerHTML = poem.content.map(line =>
                '<div class="poem-line">' +
                '<div class="poem-pinyin">' + line.pinyin + '</div>' +
                '<div class="poem-text">' + line.text + '</div>' +
                '</div>'
            ).join('');
        }

        if (translationEl) {
            translationEl.innerHTML = '<strong>译文：</strong>' + poem.translation;
        }
    },

    initReciteMode() {
        this.currentIndex = 0;
        this.renderCurrentPoem();
        this.updateCatalogHighlight();
    },

    getRandomPoems(count) {
        const shuffled = [...this.poems].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    },

    // ==================== 目录相关功能 ====================

    initCatalog() {
        const catalogBtn = document.getElementById('catalogBtn');
        const catalogClose = document.getElementById('catalogClose');
        const catalogOverlay = document.getElementById('catalogOverlay');
        const catalogModal = document.getElementById('catalogModal');

        if (catalogBtn) {
            catalogBtn.addEventListener('click', () => this.openCatalog());
        }

        if (catalogClose) {
            catalogClose.addEventListener('click', () => this.closeCatalog());
        }

        if (catalogOverlay) {
            catalogOverlay.addEventListener('click', () => this.closeCatalog());
        }

        // 筛选按钮事件
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const grade = e.target.dataset.grade;
                this.filterCatalog(grade);

                // 更新激活状态
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 初始渲染目录
        this.renderCatalog();
    },

    openCatalog() {
        const catalogModal = document.getElementById('catalogModal');
        if (catalogModal) {
            catalogModal.classList.remove('hidden');
            this.renderCatalog();
            this.updateCatalogHighlight();
        }
    },

    closeCatalog() {
        const catalogModal = document.getElementById('catalogModal');
        if (catalogModal) {
            catalogModal.classList.add('hidden');
        }
    },

    renderCatalog(filter = 'all') {
        console.log('📋 [目录渲染] 开始渲染, 筛选条件:', filter);
        const catalogList = document.getElementById('catalogList');
        if (!catalogList) {
            console.warn('⚠️ [目录渲染] catalogList 元素未找到');
            return;
        }

        let filteredPoems = this.poems;

        if (filter !== 'all') {
            filteredPoems = this.poems.filter(poem => {
                const grade = poem.grade || '';
                if (filter === '初中') {
                    return grade.includes('初中') || grade.includes('初一') || grade.includes('初二') || grade.includes('初三');
                } else if (filter === '高中') {
                    return grade.includes('高中') || grade.includes('高一') || grade.includes('高二') || grade.includes('高三');
                } else {
                    return grade.includes(filter);
                }
            });
            console.log(`🔍 [目录筛选] "${filter}" 筛选结果: ${filteredPoems.length} 首`);
            // 打印前3首匹配的诗歌信息用于调试
            if (filteredPoems.length > 0) {
                console.log('📝 [目录筛选] 匹配的诗歌示例:', filteredPoems.slice(0, 3).map(p => `${p.id}.${p.title} (${p.grade})`));
            } else {
                console.warn('⚠️ [目录筛选] 没有找到匹配的诗歌！');
                // 打印所有诗歌的grade信息用于调试
                console.log('📚 所有诗歌的grade分布:', [...new Set(this.poems.map(p => p.grade || '未分类'))]);
            }
        }

        if (filteredPoems.length === 0) {
            catalogList.innerHTML = `
                <div class="catalog-empty">
                    <div class="catalog-empty-icon">📭</div>
                    <p>暂无该年级的唐诗</p>
                </div>
            `;
            return;
        }

        catalogList.innerHTML = filteredPoems.map(poem => `
            <div class="catalog-item" data-id="${poem.id}">
                <div class="catalog-item-number">${poem.id}</div>
                <div class="catalog-item-info">
                    <div class="catalog-item-title">${poem.title}</div>
                    <div class="catalog-item-meta">
                        <span class="catalog-item-author">${poem.author}</span>
                        <span class="catalog-item-grade">${poem.grade || '未分类'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // 添加点击事件
        catalogList.querySelectorAll('.catalog-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const poemId = parseInt(item.dataset.id);
                const poemTitle = item.querySelector('.catalog-item-title')?.textContent;
                console.log(`👆 [目录点击] 用户点击目录项: ID=${poemId}, 标题=${poemTitle}, 元素=`, e.target);
                this.jumpToPoem(poemId);
            });
        });
    },

    filterCatalog(grade) {
        console.log('📂 [目录筛选] 点击分类:', grade);
        this.currentFilter = grade;
        this.renderCatalog(grade);
    },

    jumpToPoem(poemId) {
        console.log('🎯 [目录跳转] 点击诗歌ID:', poemId);
        const poemIndex = this.poems.findIndex(poem => poem.id === poemId);
        if (poemIndex !== -1) {
            const poem = this.poems[poemIndex];
            console.log(`✅ [目录跳转] 跳转到: ${poem.id}.${poem.title} (${poem.grade || '未分类'})`);
            // 停止当前播放
            AudioManager.stopRecite();
            this.currentIndex = poemIndex;
            this.renderCurrentPoem();
            this.updateCatalogHighlight();
            this.closeCatalog();
        } else {
            console.error(`❌ [目录跳转] 未找到诗歌ID: ${poemId}`);
        }
    },

    updateCatalogHighlight() {
        const catalogItems = document.querySelectorAll('.catalog-item');
        catalogItems.forEach(item => {
            const poemId = parseInt(item.dataset.id);
            if (poemId === this.getCurrentPoem()?.id) {
                item.classList.add('current');
            } else {
                item.classList.remove('current');
            }
        });
    }
};

export { PoemManager };
