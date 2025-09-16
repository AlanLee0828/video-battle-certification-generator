// VIDEO BATTLE 证书生成器 - 批量预览和制作系统
class CertificateGenerator {
    constructor() {
        // 配置对象，分离底图和奖项图片
        this.config = {
            categories: {
                '单镜头': {
                    folderPath: '底图/单镜头/',
                    baseImage: '底图.png',
                    awards: {
                        '金奖': '单镜头-金奖.png',
                        '银奖': '单镜头-银奖.png',
                        '铜奖': '单镜头-铜奖.png',
                        '入围奖': '单镜头-入围奖.png'
                    }
                },
                '蒙太奇': {
                    folderPath: '底图/蒙太奇/',
                    baseImage: '底图.png',
                    awards: {
                        '金奖': '蒙太奇-金奖.png',
                        '银奖': '蒙太奇-银奖.png',
                        '铜奖': '蒙太奇-铜奖.png',
                        '入围奖': '蒙太奇-入围奖.png'
                    }
                },
                '长镜头': {
                    folderPath: '底图/长镜头/',
                    baseImage: '底图.png',
                    awards: {
                        '金奖': '长镜头-金奖.png',
                        '银奖': '长镜头-银奖.png',
                        '铜奖': '长镜头-铜奖.png',
                        '入围奖': '长镜头-入围.png' // 注意：文件名不同
                    }
                }
            }
        };

        // 当前状态
        this.currentState = {
            category: '单镜头',
            hueValue: 0,
            issue: '',
            theme: '',
            certificates: [], // 存储所有证书数据
            currentIndex: 0
        };

        // DOM元素引用
        this.elements = {};
        
        // 图像缓存 - 分离底图和奖项图片
        this.imageCache = {
            baseImages: new Map(),
            awardImages: new Map()
        };
        
        // 初始化
        this.init();
    }

    // 初始化函数
    init() {
        this.bindElements();
        this.bindEvents();
        this.preloadImages();
    }

    // 绑定DOM元素
    bindElements() {
        this.elements = {
            categoryInputs: document.querySelectorAll('input[name="category"]'),
            issueInput: document.getElementById('issue-input'),
            themeInput: document.getElementById('theme-input'),
            goldWinners: document.getElementById('gold-winners'),
            silverWinners: document.getElementById('silver-winners'),
            bronzeWinners: document.getElementById('bronze-winners'),
            finalistWinners: document.getElementById('finalist-winners'),
            hueSlider: document.getElementById('hue-slider'),
            hueValue: document.getElementById('hue-value'),
            resetHueBtn: document.getElementById('reset-hue'),
            generatePreviewBtn: document.getElementById('generate-preview'),
            downloadAllBtn: document.getElementById('download-all'),
            resetAllBtn: document.getElementById('reset-all'),
            previewCanvas: document.getElementById('preview-canvas'),
            loadingIndicator: document.getElementById('loading-indicator'),
            emptyState: document.getElementById('empty-state'),
            previewCounter: document.getElementById('preview-counter'),
            currentInfo: document.getElementById('current-info'),
            previewDots: document.getElementById('preview-dots'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn')
        };
    }

    // 绑定事件监听器
    bindEvents() {
        // 类别切换事件
        this.elements.categoryInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.handleCategoryChange(e.target.value);
                }
            });
        });

        // 色相滑杆事件
        let hueTimeout;
        this.elements.hueSlider.addEventListener('input', (e) => {
            clearTimeout(hueTimeout);
            hueTimeout = setTimeout(() => {
                this.handleHueChange(e.target.value);
            }, 16);
        });

        // 基础信息输入事件
        this.elements.issueInput.addEventListener('input', (e) => {
            this.currentState.issue = e.target.value;
        });

        this.elements.themeInput.addEventListener('input', (e) => {
            this.currentState.theme = e.target.value;
        });

        // 操作按钮事件
        this.elements.generatePreviewBtn.addEventListener('click', () => {
            this.generateAllPreviews();
        });

        this.elements.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllCertificates();
        });

        this.elements.resetAllBtn.addEventListener('click', () => {
            this.resetAll();
        });

        this.elements.resetHueBtn.addEventListener('click', () => {
            this.resetHue();
        });

        // 预览导航事件
        this.elements.prevBtn.addEventListener('click', () => {
            this.showPreviousCertificate();
        });

        this.elements.nextBtn.addEventListener('click', () => {
            this.showNextCertificate();
        });
    }

    // 处理类别切换
    handleCategoryChange(category) {
        console.log('切换类别:', category);
        this.currentState.category = category;
        // 清空当前预览
        this.clearPreviews();
    }

    // 处理色相调整
    handleHueChange(value) {
        this.currentState.hueValue = parseInt(value);
        this.elements.hueValue.textContent = value;
        // 如果有预览，重新生成当前显示的证书
        if (this.currentState.certificates.length > 0) {
            this.updateCurrentPreview();
        }
    }

    // 生成所有预览
    async generateAllPreviews() {
        try {
            this.showLoading();
            
            // 收集所有获奖者数据
            const allWinners = this.collectAllWinners();
            
            if (allWinners.length === 0) {
                this.showError('请至少输入一个获奖者');
                return;
            }

            console.log('开始生成预览，共', allWinners.length, '张证书');
            
            // 生成证书数据
            this.currentState.certificates = allWinners;
            this.currentState.currentIndex = 0;
            
            // 生成第一张预览
            await this.generateCertificatePreview(0);
            
            // 更新UI
            this.updatePreviewUI();
            this.hideLoading();
            
            this.showSuccess(`成功生成 ${allWinners.length} 张证书预览！`);
            
        } catch (error) {
            this.showError(`预览生成失败: ${error.message}`);
            this.hideLoading();
        }
    }

    // 收集所有获奖者数据
    collectAllWinners() {
        const winners = [];
        
        // 处理每个奖项的获奖者
        const awardInputs = [
            { element: this.elements.goldWinners, award: '金奖', awardClass: 'gold' },
            { element: this.elements.silverWinners, award: '银奖', awardClass: 'silver' },
            { element: this.elements.bronzeWinners, award: '铜奖', awardClass: 'bronze' },
            { element: this.elements.finalistWinners, award: '入围奖', awardClass: 'finalist' }
        ];

        awardInputs.forEach(({ element, award, awardClass }) => {
            const names = element.value.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);
            
            names.forEach(name => {
                winners.push({
                    name,
                    award,
                    awardClass,
                    category: this.currentState.category,
                    issue: this.currentState.issue,
                    theme: this.currentState.theme
                });
            });
        });

        return winners;
    }

    // 生成单张证书预览
    async generateCertificatePreview(index) {
        const certificate = this.currentState.certificates[index];
        if (!certificate) return;

        try {
            // 优先使用预加载的图像，如果没有则重新加载
            let baseImg = this.imageCache.baseImages[this.currentState.category];
            let awardImg = this.imageCache.awardImages[certificate.award];

            // 如果缓存中没有图像，则使用重试机制重新加载
            if (!baseImg || !awardImg) {
                console.log('缓存中图像不完整，使用重试机制重新加载...');
                const baseImagePath = this.getBaseImagePath();
                const awardImagePath = this.getAwardImagePath(certificate.award);

                [baseImg, awardImg] = await Promise.all([
                    this.loadImageWithRetry(baseImagePath, 3),
                    this.loadImageWithRetry(awardImagePath, 3)
                ]);

                // 更新缓存
                this.imageCache.baseImages[this.currentState.category] = baseImg;
                this.imageCache.awardImages[certificate.award] = awardImg;
            }

            // 绘制到Canvas
            await this.drawCertificateToCanvas(baseImg, awardImg, certificate);
            
        } catch (error) {
            console.error('生成预览失败:', error);
            throw error;
        }
    }

    // 绘制证书到Canvas
    async drawCertificateToCanvas(baseImg, awardImg, certificate) {
        const canvas = this.elements.previewCanvas;
        const ctx = canvas.getContext('2d');
        
        // 设置Canvas尺寸
        const width = Math.max(baseImg.naturalWidth, awardImg.naturalWidth);
        const height = Math.max(baseImg.naturalHeight, awardImg.naturalHeight);
        canvas.width = width;
        canvas.height = height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制底图并应用色相滤镜
        if (this.currentState.hueValue !== 0) {
            ctx.filter = `hue-rotate(${this.currentState.hueValue}deg)`;
        }
        
        const baseX = (width - baseImg.naturalWidth) / 2;
        const baseY = (height - baseImg.naturalHeight) / 2;
        ctx.drawImage(baseImg, baseX, baseY);
        
        // 重置滤镜并绘制奖项图片
        ctx.filter = 'none';
        const awardX = (width - awardImg.naturalWidth) / 2;
        const awardY = (height - awardImg.naturalHeight) / 2;
        ctx.drawImage(awardImg, awardX, awardY);
        
        // 绘制文字（在图片之上）
        this.drawTextOnCanvas(ctx, width, height, certificate);
    }

    // 在Canvas上绘制文字
    drawTextOnCanvas(ctx, canvasWidth, canvasHeight, certificate) {
        ctx.save();
        
        // 绘制期数和主题（稍微下移一点，从上往下700像素）
        if (certificate.issue || certificate.theme) {
            ctx.fillStyle = '#D5D5D5';
            ctx.font = '22px HelveticaNeue, STHeiti Light, Arial, sans-serif';
            ctx.textAlign = 'center';
            
            // 组合期数和主题文本，中间用空格分隔
            let combinedText = '';
            if (certificate.issue && certificate.theme) {
                combinedText = `${certificate.issue} ${certificate.theme}`;
            } else if (certificate.issue) {
                combinedText = certificate.issue;
            } else if (certificate.theme) {
                combinedText = certificate.theme;
            }
            
            if (combinedText) {
                ctx.fillText(combinedText, canvasWidth / 2, 700);
            }
        }
        
        // 绘制获奖者名字（调整到与Award和Gold之间间距一致的位置）
        if (certificate.name) {
            ctx.fillStyle = '#ffffff'; // 纯白
            
            // 对于中英混排，需要分别渲染不同部分
            const text = certificate.name;
            ctx.textAlign = 'center';
            
            // 检测是否有中英混排
            const hasEnglish = /[a-zA-Z0-9&]/.test(text);
            const hasChinese = /[\u4e00-\u9fa5]/.test(text);
            
            if (hasEnglish && !hasChinese) {
                // 纯英文使用Didot粗体
                ctx.font = 'bold 45px Didot, serif';
                ctx.fillText(text, canvasWidth / 2, 1130);
            } else if (hasChinese && !hasEnglish) {
                // 纯中文使用思源宋体
                ctx.font = '45px SourceHanSerifCN-Medium, serif';
                ctx.fillText(text, canvasWidth / 2, 1130);
            } else if (hasEnglish && hasChinese) {
                // 中英混排：分别处理
                this.drawMixedText(ctx, text, canvasWidth / 2, 1130);
            } else {
                // 其他情况使用中文字体
                ctx.font = '45px SourceHanSerifCN-Medium, serif';
                ctx.fillText(text, canvasWidth / 2, 1130);
            }
        }
        
        ctx.restore();
    }

    // 渲染中英混排文字
    drawMixedText(ctx, text, centerX, y) {
        // 将文字分解为中文和英文片段
        const segments = this.segmentMixedText(text);
        
        // 计算总宽度以实现居中
        let totalWidth = 0;
        const segmentWidths = [];
        
        for (const segment of segments) {
            if (segment.isEnglish) {
                ctx.font = 'bold 45px Didot, serif';
            } else {
                ctx.font = '45px SourceHanSerifCN-Medium, serif';
            }
            const width = ctx.measureText(segment.text).width;
            segmentWidths.push(width);
            totalWidth += width;
        }
        
        // 从左边开始绘制，实现整体居中
        let currentX = centerX - totalWidth / 2;
        
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            
            if (segment.isEnglish) {
                ctx.font = 'bold 45px Didot, serif';
            } else {
                ctx.font = '45px SourceHanSerifCN-Medium, serif';
            }
            
            ctx.textAlign = 'left';
            ctx.fillText(segment.text, currentX, y);
            currentX += segmentWidths[i];
        }
    }

    // 分段中英混排文字
    segmentMixedText(text) {
        const segments = [];
        let currentSegment = '';
        let isCurrentEnglish = null;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const isEnglish = /[a-zA-Z0-9&\s]/.test(char);
            
            if (isCurrentEnglish === null) {
                // 第一个字符
                isCurrentEnglish = isEnglish;
                currentSegment = char;
            } else if (isCurrentEnglish === isEnglish) {
                // 同类型字符，添加到当前段
                currentSegment += char;
            } else {
                // 类型变化，保存当前段并开始新段
                if (currentSegment.trim()) {
                    segments.push({
                        text: currentSegment,
                        isEnglish: isCurrentEnglish
                    });
                }
                currentSegment = char;
                isCurrentEnglish = isEnglish;
            }
        }
        
        // 添加最后一段
        if (currentSegment.trim()) {
            segments.push({
                text: currentSegment,
                isEnglish: isCurrentEnglish
            });
        }
        
        return segments;
    }

    // 加载图像
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 解决Canvas tainted问题
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`无法加载图像: ${src}`));
            img.src = src;
        });
    }

    // 带重试机制的图像加载
    async loadImageWithRetry(src, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await this.loadImage(src);
            } catch (error) {
                console.warn(`图像加载失败，第 ${i + 1} 次重试:`, src);
                if (i === retries - 1) {
                    throw error;
                }
                // 等待一小段时间后重试
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    // 获取底图路径
    getBaseImagePath() {
        const category = this.config.categories[this.currentState.category];
        return `${category.folderPath}${category.baseImage}`;
    }

    // 获取奖项图片路径
    getAwardImagePath(award) {
        const category = this.config.categories[this.currentState.category];
        const awardFileName = category.awards[award];
        return `${category.folderPath}${awardFileName}`;
    }

    // 更新预览UI
    updatePreviewUI() {
        const total = this.currentState.certificates.length;
        const current = this.currentState.currentIndex + 1;
        
        // 更新计数器
        this.elements.previewCounter.textContent = `${current} / ${total}`;
        
        // 更新当前证书信息
        if (total > 0) {
            const certificate = this.currentState.certificates[this.currentState.currentIndex];
            const awardType = this.elements.currentInfo.querySelector('.award-type');
            const winnerName = this.elements.currentInfo.querySelector('.winner-name');
            
            awardType.textContent = certificate.award;
            awardType.className = `award-type ${certificate.awardClass}`;
            winnerName.textContent = certificate.name;
            
            this.elements.emptyState.classList.add('hidden');
            this.elements.previewCanvas.style.display = 'block';
        } else {
            this.elements.emptyState.classList.remove('hidden');
            this.elements.previewCanvas.style.display = 'none';
        }
        
        // 更新导航按钮
        this.elements.prevBtn.disabled = this.currentState.currentIndex === 0;
        this.elements.nextBtn.disabled = this.currentState.currentIndex >= total - 1;
        
        // 更新预览点
        this.updatePreviewDots();
    }

    // 更新预览点
    updatePreviewDots() {
        const total = this.currentState.certificates.length;
        const dotsContainer = this.elements.previewDots;
        
        dotsContainer.innerHTML = '';
        
        if (total <= 20) { // 只有少于20张时显示点
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('div');
                dot.className = `preview-dot ${i === this.currentState.currentIndex ? 'active' : ''}`;
                dot.addEventListener('click', () => this.showCertificate(i));
                dotsContainer.appendChild(dot);
            }
        }
    }

    // 显示指定证书
    async showCertificate(index) {
        if (index < 0 || index >= this.currentState.certificates.length) return;
        
        this.currentState.currentIndex = index;
        await this.generateCertificatePreview(index);
        this.updatePreviewUI();
    }

    // 显示上一张证书
    showPreviousCertificate() {
        if (this.currentState.currentIndex > 0) {
            this.showCertificate(this.currentState.currentIndex - 1);
        }
    }

    // 显示下一张证书
    showNextCertificate() {
        if (this.currentState.currentIndex < this.currentState.certificates.length - 1) {
            this.showCertificate(this.currentState.currentIndex + 1);
        }
    }

    // 更新当前预览（色相变化时）
    async updateCurrentPreview() {
        if (this.currentState.certificates.length > 0) {
            await this.generateCertificatePreview(this.currentState.currentIndex);
        }
    }

    // 批量下载所有证书
    async downloadAllCertificates() {
        if (this.currentState.certificates.length === 0) {
            this.showError('请先生成预览');
            return;
        }

        try {
            this.showLoading();
            
            // 动态加载JSZip
            const JSZip = await this.loadJSZip();
            const zip = new JSZip();
            
            // 为每张证书生成高质量图像
            for (let i = 0; i < this.currentState.certificates.length; i++) {
                const certificate = this.currentState.certificates[i];
                const blob = await this.generateCertificateBlob(certificate);
                const fileName = `${certificate.category}-${certificate.award}-${certificate.name}.png`;
                zip.file(fileName, blob);
            }
            
            // 生成并下载ZIP
            const zipBlob = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `VIDEO_BATTLE证书-${this.currentState.category}-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.hideLoading();
            this.showSuccess(`成功下载 ${this.currentState.certificates.length} 张证书！`);
            
        } catch (error) {
            this.showError(`下载失败: ${error.message}`);
            this.hideLoading();
        }
    }

    // 生成证书Blob
    async generateCertificateBlob(certificate) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 获取图像
        const baseImagePath = this.getBaseImagePath();
        const awardImagePath = this.getAwardImagePath(certificate.award);
        
        const [baseImg, awardImg] = await Promise.all([
            this.loadImage(baseImagePath),
            this.loadImage(awardImagePath)
        ]);

        // 设置高分辨率
        const width = Math.max(baseImg.naturalWidth, awardImg.naturalWidth);
        const height = Math.max(baseImg.naturalHeight, awardImg.naturalHeight);
        canvas.width = width;
        canvas.height = height;
        
        // 绘制
        ctx.clearRect(0, 0, width, height);
        
        if (this.currentState.hueValue !== 0) {
            ctx.filter = `hue-rotate(${this.currentState.hueValue}deg)`;
        }
        
        const baseX = (width - baseImg.naturalWidth) / 2;
        const baseY = (height - baseImg.naturalHeight) / 2;
        ctx.drawImage(baseImg, baseX, baseY);
        
        ctx.filter = 'none';
        const awardX = (width - awardImg.naturalWidth) / 2;
        const awardY = (height - awardImg.naturalHeight) / 2;
        ctx.drawImage(awardImg, awardX, awardY);
        
        this.drawTextOnCanvas(ctx, width, height, certificate);
        
        return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
    }

    // 清空预览
    clearPreviews() {
        this.currentState.certificates = [];
        this.currentState.currentIndex = 0;
        this.updatePreviewUI();
    }

    // 重置色相
    resetHue() {
        this.currentState.hueValue = 0;
        this.elements.hueSlider.value = 0;
        this.elements.hueValue.textContent = '0';
        if (this.currentState.certificates.length > 0) {
            this.updateCurrentPreview();
        }
    }

    // 重置所有
    resetAll() {
        // 重置表单
        this.elements.categoryInputs[0].checked = true;
        this.currentState.category = '单镜头';
        this.elements.issueInput.value = '';
        this.elements.themeInput.value = '';
        this.elements.goldWinners.value = '';
        this.elements.silverWinners.value = '';
        this.elements.bronzeWinners.value = '';
        this.elements.finalistWinners.value = '';
        
        // 重置色相
        this.resetHue();
        
        // 清空预览
        this.clearPreviews();
        
        // 重置状态
        this.currentState.issue = '';
        this.currentState.theme = '';
    }

    // 预加载图像
    preloadImages() {
        console.log('开始预加载图像...');
        Object.keys(this.config.categories).forEach(categoryName => {
            const category = this.config.categories[categoryName];
            
            // 预加载底图
            const baseImagePath = `${category.folderPath}${category.baseImage}`;
            this.loadImage(baseImagePath).then(() => {
                console.log(`预加载底图完成: ${baseImagePath}`);
            }).catch(err => console.error(`预加载底图失败: ${baseImagePath}`, err));
            
            // 预加载奖项图片
            Object.values(category.awards).forEach(fileName => {
                const imagePath = `${category.folderPath}${fileName}`;
                this.loadImage(imagePath).then(() => {
                    console.log(`预加载奖项图片完成: ${imagePath}`);
                }).catch(err => console.error(`预加载奖项图片失败: ${imagePath}`, err));
            });
        });
    }

    // 动态加载JSZip
    async loadJSZip() {
        if (window.JSZip) {
            return window.JSZip;
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('无法加载JSZip库'));
            document.head.appendChild(script);
        });
    }

    // 显示加载状态
    showLoading() {
        this.elements.loadingIndicator.classList.remove('hidden');
        this.elements.generatePreviewBtn.disabled = true;
        this.elements.downloadAllBtn.disabled = true;
    }

    // 隐藏加载状态
    hideLoading() {
        this.elements.loadingIndicator.classList.add('hidden');
        this.elements.generatePreviewBtn.disabled = false;
        this.elements.downloadAllBtn.disabled = false;
    }

    // 显示成功信息
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // 显示错误信息
    showError(message) {
        this.hideLoading();
        this.showNotification(message, 'error');
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            zIndex: '10000',
            maxWidth: '400px',
            backgroundColor: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('VIDEO BATTLE 证书生成器初始化...');
    
    const app = new CertificateGenerator();
    window.certificateApp = app;
    
    console.log('VIDEO BATTLE 证书生成器初始化完成');
});