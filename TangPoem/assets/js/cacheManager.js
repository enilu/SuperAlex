// ==================== 缓存管理器 ====================
// 统一管理所有localStorage缓存，支持版本控制和一键清除

/**
 * 缓存类型定义
 * @enum {string}
 */
const CacheType = {
    /** 诗歌数据缓存 - 大文件，需要版本控制 */
    POEMS_DATA: 'poems_data',
    /** 学习进度 - 用户数据，保留 */
    PROGRESS: 'progress',
    /** 成就数据 - 用户数据，保留 */
    ACHIEVEMENTS: 'achievements',
    /** 统计数据 - 用户数据，保留 */
    STATS: 'stats',
    /** 音频设置 - 用户设置，保留 */
    AUDIO_SETTINGS: 'audio_settings',
    /** 应用设置 - 用户设置，保留 */
    APP_SETTINGS: 'app_settings'
};

/**
 * 缓存元数据定义
 * 包含：存储key、默认值、是否用户数据、缓存描述
 */
const CACHE_META = {
    [CacheType.POEMS_DATA]: {
        key: 'tangpoem_poems_data',
        default: null,
        isUserData: false,
        description: '诗歌数据缓存'
    },
    [CacheType.PROGRESS]: {
        key: 'tangpoem_progress',
        default: {},
        isUserData: true,
        description: '学习进度'
    },
    [CacheType.ACHIEVEMENTS]: {
        key: 'tangpoem_achievements',
        default: {},
        isUserData: true,
        description: '成就数据'
    },
    [CacheType.STATS]: {
        key: 'tangpoem_stats',
        default: { totalRecited: 0, totalGames: 0, highScore: 0 },
        isUserData: true,
        description: '统计数据'
    },
    [CacheType.AUDIO_SETTINGS]: {
        key: 'tangpoem_audio_settings',
        default: { muted: false, volume: 1.0 },
        isUserData: true,
        description: '音频设置'
    },
    [CacheType.APP_SETTINGS]: {
        key: 'tangpoem_app_settings',
        default: {},
        isUserData: true,
        description: '应用设置'
    }
};

/**
 * 缓存版本信息
 * 用于在数据结构变化时清除旧缓存
 */
const CACHE_VERSION_KEY = 'tangpoem_cache_version';
const CURRENT_CACHE_VERSION = '1.0.0';

/**
 * 兼容的缓存版本列表
 * 低于此版本的缓存会被自动清除
 */
const MIN_COMPATIBLE_VERSION = '1.0.0';

const CacheManager = {
    /**
     * 初始化缓存管理器
     * 检查缓存版本，必要时清除旧缓存
     */
    init() {
        const savedVersion = localStorage.getItem(CACHE_VERSION_KEY);
        if (!savedVersion) {
            // 首次使用，设置版本号
            this.setCacheVersion(CURRENT_CACHE_VERSION);
            console.log('📦 [缓存] 首次初始化，版本:', CURRENT_CACHE_VERSION);
        } else if (!this.isVersionCompatible(savedVersion)) {
            // 版本不兼容，清除所有缓存
            console.warn(`⚠️ [缓存] 版本不兼容: ${savedVersion} < ${MIN_COMPATIBLE_VERSION}，清除所有缓存`);
            this.clearAllCache();
            this.setCacheVersion(CURRENT_CACHE_VERSION);
        } else if (savedVersion !== CURRENT_CACHE_VERSION) {
            // 版本升级，保留用户数据但清除数据缓存
            console.log(`📦 [缓存] 版本升级: ${savedVersion} -> ${CURRENT_CACHE_VERSION}`);
            this.clearDataCache();
            this.setCacheVersion(CURRENT_CACHE_VERSION);
        } else {
            console.log('✅ [缓存] 版本检查通过:', savedVersion);
        }
    },

    /**
     * 检查版本是否兼容
     * @param {string} version
     * @returns {boolean}
     */
    isVersionCompatible(version) {
        return this.compareVersions(version, MIN_COMPATIBLE_VERSION) >= 0;
    },

    /**
     * 比较版本号
     * @param {string} v1
     * @param {string} v2
     * @returns {number} 1: v1>v2, 0: v1=v2, -1: v1<v2
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        const maxLen = Math.max(parts1.length, parts2.length);

        for (let i = 0; i < maxLen; i++) {
            const p1 = parts1[i] || 0;
            const p2 = parts2[i] || 0;
            if (p1 > p2) return 1;
            if (p1 < p2) return -1;
        }
        return 0;
    },

    /**
     * 设置缓存版本
     * @param {string} version
     */
    setCacheVersion(version) {
        localStorage.setItem(CACHE_VERSION_KEY, version);
    },

    /**
     * 获取缓存版本
     * @returns {string}
     */
    getCacheVersion() {
        return localStorage.getItem(CACHE_VERSION_KEY) || 'unknown';
    },

    /**
     * 获取缓存数据
     * @param {CacheType} type - 缓存类型
     * @param {*} defaultValue - 默认值（可选，默认使用元数据中的默认值）
     * @returns {*}
     */
    get(type, defaultValue = null) {
        const meta = CACHE_META[type];
        if (!meta) {
            console.error(`❌ [缓存] 未知的缓存类型: ${type}`);
            return defaultValue;
        }

        try {
            const value = localStorage.getItem(meta.key);
            if (value === null) {
                return defaultValue !== null ? defaultValue : meta.default;
            }
            return JSON.parse(value);
        } catch (error) {
            console.error(`❌ [缓存] 读取失败 [${type}]:`, error);
            return defaultValue !== null ? defaultValue : meta.default;
        }
    },

    /**
     * 设置缓存数据
     * @param {CacheType} type - 缓存类型
     * @param {*} value - 要存储的值
     */
    set(type, value) {
        const meta = CACHE_META[type];
        if (!meta) {
            console.error(`❌ [缓存] 未知的缓存类型: ${type}`);
            return false;
        }

        try {
            localStorage.setItem(meta.key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`❌ [缓存] 存储失败 [${type}]:`, error);
            return false;
        }
    },

    /**
     * 移除指定缓存
     * @param {CacheType} type - 缓存类型
     */
    remove(type) {
        const meta = CACHE_META[type];
        if (!meta) {
            console.error(`❌ [缓存] 未知的缓存类型: ${type}`);
            return false;
        }

        localStorage.removeItem(meta.key);
        console.log(`🗑️ [缓存] 已清除: ${meta.description} (${meta.key})`);
        return true;
    },

    /**
     * 清除数据缓存（非用户数据）
     * 包括：诗歌数据等大文件缓存
     */
    clearDataCache() {
        let cleared = 0;
        Object.entries(CACHE_META).forEach(([type, meta]) => {
            if (!meta.isUserData && localStorage.getItem(meta.key)) {
                localStorage.removeItem(meta.key);
                cleared++;
                console.log(`🗑️ [缓存] 已清除数据缓存: ${meta.description}`);
            }
        });
        console.log(`📦 [缓存] 数据缓存清除完成，共 ${cleared} 项`);
    },

    /**
     * 清除所有缓存（包括用户数据）
     * 警告：此操作会清除所有用户进度！
     */
    clearAllCache() {
        const cleared = [];
        Object.entries(CACHE_META).forEach(([type, meta]) => {
            if (localStorage.getItem(meta.key)) {
                localStorage.removeItem(meta.key);
                cleared.push(meta.description);
            }
        });
        console.log(`🗑️ [缓存] 已清除所有缓存:`, cleared.join(', '));
        return cleared;
    },

    /**
     * 清除用户数据（保留数据缓存）
     * 用于重置用户进度
     */
    clearUserData() {
        const cleared = [];
        Object.entries(CACHE_META).forEach(([type, meta]) => {
            if (meta.isUserData && localStorage.getItem(meta.key)) {
                localStorage.removeItem(meta.key);
                cleared.push(meta.description);
            }
        });
        console.log(`🗑️ [缓存] 已清除用户数据:`, cleared.join(', '));
        return cleared;
    },

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheInfo() {
        const info = {
            version: this.getCacheVersion(),
            currentVersion: CURRENT_CACHE_VERSION,
            items: [],
            totalSize: 0
        };

        Object.entries(CACHE_META).forEach(([type, meta]) => {
            const value = localStorage.getItem(meta.key);
            if (value) {
                const size = new Blob([value]).size;
                info.totalSize += size;
                info.items.push({
                    type: type,
                    key: meta.key,
                    description: meta.description,
                    isUserData: meta.isUserData,
                    size: size,
                    sizeFormatted: this.formatSize(size)
                });
            }
        });

        return info;
    },

    /**
     * 格式化字节大小
     * @param {number} bytes
     * @returns {string}
     */
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    /**
     * 导出缓存数据（用于备份）
     * @param {boolean} includeUserData - 是否包含用户数据
     * @returns {Object}
     */
    exportCache(includeUserData = true) {
        const data = {
            version: this.getCacheVersion(),
            exportTime: new Date().toISOString(),
            data: {}
        };

        Object.entries(CACHE_META).forEach(([type, meta]) => {
            if (includeUserData || !meta.isUserData) {
                const value = this.get(type);
                if (value !== null && value !== meta.default) {
                    data.data[meta.key] = value;
                }
            }
        });

        return data;
    },

    /**
     * 导入缓存数据（用于恢复）
     * @param {Object} data - 导出的数据
     * @param {boolean} mergeUserData - 是否合并用户数据（false则覆盖）
     * @returns {boolean}
     */
    importCache(data, mergeUserData = true) {
        try {
            if (!data.data) {
                console.error('❌ [缓存] 无效的导入数据');
                return false;
            }

            Object.entries(data.data).forEach(([key, value]) => {
                // 检查key是否在元数据中
                const meta = Object.values(CACHE_META).find(m => m.key === key);
                if (meta) {
                    if (mergeUserData && meta.isUserData && localStorage.getItem(key)) {
                        // 合并用户数据
                        const current = JSON.parse(localStorage.getItem(key));
                        const merged = { ...current, ...value };
                        localStorage.setItem(key, JSON.stringify(merged));
                    } else {
                        // 直接覆盖
                        localStorage.setItem(key, JSON.stringify(value));
                    }
                }
            });

            console.log('✅ [缓存] 导入成功');
            return true;
        } catch (error) {
            console.error('❌ [缓存] 导入失败:', error);
            return false;
        }
    }
};

export { CacheManager, CacheType, CACHE_META, CACHE_VERSION_KEY, CURRENT_CACHE_VERSION };
