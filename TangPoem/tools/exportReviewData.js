/**
 * 复习数据导出工具
 * 用于导出用户的复习进度数据
 */

async function exportReviewData() {
    try {
        // 检查是否在浏览器环境中
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            // 直接从localStorage获取数据
            const exportData = {
                version: localStorage.getItem('tangpoem_cache_version') || 'unknown',
                exportTime: new Date().toISOString(),
                type: 'tangpoem_review_data',
                data: {}
            };

            // 获取所有相关的复习数据
            const keys = ['tangpoem_progress', 'tangpoem_review_history'];

            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        exportData.data[key] = JSON.parse(value);
                    } catch (e) {
                        console.warn(`无法解析本地存储项: ${key}`, e);
                    }
                }
            });

            // 创建下载
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `tangpoem-review-data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`);
            document.body.appendChild(downloadAnchorNode); // required for Firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();

            console.log('复习数据导出完成');
            alert('复习数据导出完成！');
        } else {
            console.error('此工具只能在浏览器环境中运行');
        }
    } catch (error) {
        console.error('导出复习数据时发生错误:', error);
        alert('导出复习数据时发生错误，请查看控制台了解详情。');
    }
}

// 如果在浏览器环境中，添加一个全局函数以便用户可以直接调用
if (typeof window !== 'undefined') {
    window.exportReviewData = exportReviewData;
}

// 执行导出（如果直接运行此脚本）
if (typeof module !== 'undefined' && !module.parent) {
    if (typeof window !== 'undefined') {
        exportReviewData();
    }
} else if (typeof window !== 'undefined') {
    // 在浏览器中注册全局函数
    window.exportReviewData = exportReviewData;
}