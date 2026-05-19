// ==UserScript==
// @name         Jellyfin/Emby 显示剧照 (Show Jellyfin/Emby images under the extrafanart folder)
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  Jellyfin/Emby 显示剧照 - 适配 Jellyfin 10.11.x (性能优化版)
// @author       Squirtle (adapted by WorkBuddy)
// @match        *://*/web/*
// @match        *://*/*/web/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license MIT
// ==/UserScript==

;(function () {
    'use strict'

    // ========== 配置 ==========
    let startImageIndex = GM_getValue('startImageIndex', 0)  // 默认从第1张开始
    let endImageIndex = 0
    let currentZoomedImageIndex = -1
    let startMenuEventId = null
    let itemId = null
    const imageMap = new Map()
    let lastUrl = ''

    const imageContainer = createImageContainer()
    const zoomedMask = createZoomedMask()

    const zoomedImage = zoomedMask.querySelector('#jv-zoom-img')
    const zoomedImageWrapper = zoomedMask.querySelector('#jv-zoom-img-wrapper')
    const zoomedImageDescription = zoomedMask.querySelector('#jv-zoom-img-desc')
    const leftButton = zoomedMask.querySelector('.jv-left-btn')
    const rightButton = zoomedMask.querySelector('.jv-right-btn')

    // ========== 工具函数 ==========

    function getCurrentItemId() {
        // Jellyfin 10.11 支持多种 hash 格式
        return location.hash.match(/[?&]id=(\w+)/)?.[1]
            || location.search.match(/[?&]id=(\w+)/)?.[1]
            || null
    }

    function getBackgroundImageSrc(index) {
        const currentItemId = getCurrentItemId()
        // quality=70 减少图片体积，maxWidth=640 缩小尺寸，加快加载
        return currentItemId && `${location.origin}/Items/${currentItemId}/Images/Backdrop/${index}?maxWidth=640&quality=70`
    }

    // 节流：避免短时间内重复调用 loadImages
    let loadTimer = null
    function debouncedLoadImages(delay = 150) {
        if (loadTimer) clearTimeout(loadTimer)
        loadTimer = setTimeout(() => {
            loadTimer = null
            loadImages()
        }, delay)
    }

    function createImageContainer() {
        const container = document.createElement('div')
        container.id = 'jv-image-container'
        return container
    }

    function createZoomedMask() {
        const mask = document.createElement('div')
        mask.id = 'jv-zoom-mask'
        mask.innerHTML = `
        <button class="jv-zoom-btn jv-left-btn"></button>
        <div id="jv-zoom-img-wrapper"><img id="jv-zoom-img" /><div id="jv-zoom-img-desc"></div></div>
        <button class="jv-zoom-btn jv-right-btn" /></button>
       `
        return mask
    }

    function setRectOfElement(element, rect) {
        ;['width', 'height', 'left', 'top'].forEach(key => {
            element.style[key] = `${rect[key]}px`
        })
    }

    function setDescription() {
        zoomedImageDescription.innerHTML = `${currentZoomedImageIndex - startImageIndex + 1} of ${endImageIndex - startImageIndex + 1}`
    }

    async function awaitTransitionEnd(element) {
        return new Promise(resolve => {
            element.addEventListener('transitionend', resolve, { once: true })
        })
    }

    function changeImageIndex(index) {
        const imageSrc = getBackgroundImageSrc(index)
        if (!imageSrc) return
        const imageElement = imageMap.get(index)
        if (!imageElement) return
        setRectOfElement(zoomedImageWrapper, {
            left: (zoomedMask.clientWidth - imageElement.naturalWidth) / 2,
            top: (zoomedMask.clientHeight - imageElement.naturalHeight) / 2,
            width: imageElement.naturalWidth,
            height: imageElement.naturalHeight
        })
        zoomedImage.src = imageSrc
        setDescription()
    }

    async function showZoomedMask(index) {
        const imageSrc = getBackgroundImageSrc(index)
        if (!imageSrc) return

        zoomedImageWrapper.classList.add('animate')
        zoomedImage.src = imageSrc

        const imageElement = imageMap.get(index)
        if (!imageElement) return
        const rect = imageElement.getBoundingClientRect()
        setRectOfElement(zoomedImageWrapper, rect)
        zoomedMask.style.display = 'flex'

        const action = () => {
            setRectOfElement(zoomedImageWrapper, {
                left: (zoomedMask.clientWidth - imageElement.naturalWidth) / 2,
                top: (zoomedMask.clientHeight - imageElement.naturalHeight) / 2,
                width: imageElement.naturalWidth,
                height: imageElement.naturalHeight
            })
        }

        if (document.startViewTransition) {
            const transition = document.startViewTransition(action)
            await transition.finished
        } else {
            action()
            await awaitTransitionEnd(zoomedImageWrapper)
        }

        setDescription()
        zoomedImageWrapper.classList.remove('animate')
    }

    async function hideZoomedMask() {
        zoomedImageDescription.innerHTML = ''
        zoomedImageWrapper.classList.add('animate')
        const action = () => {
            const imageElement = imageMap.get(currentZoomedImageIndex)
            if (!imageElement) return
            const rect = imageElement.getBoundingClientRect()
            setRectOfElement(zoomedImageWrapper, rect)
        }
        if (document.startViewTransition) {
            const transition = document.startViewTransition(action)
            await transition.finished
        } else {
            action()
            await awaitTransitionEnd(zoomedImageWrapper)
        }

        zoomedMask.style.display = 'none'
        currentZoomedImageIndex = -1
        zoomedImageWrapper.classList.remove('animate')
    }

    function createImageElement(index) {
        const imageSrc = getBackgroundImageSrc(index)
        const imageElement = document.createElement('img')
        imageElement.src = imageSrc
        imageElement.loading = 'lazy'  // 懒加载，不阻塞页面渲染
        imageElement.className = 'jv-image'
        imageElement.onclick = function () {
            currentZoomedImageIndex = index
            showZoomedMask(index)
        }
        return imageElement
    }

    function appendImagesToContainer(imageCount) {
        if (imageCount < startImageIndex) return
        const imageFragment = document.createDocumentFragment()
        for (let index = startImageIndex; index <= imageCount; index++) {
            const imageElement = createImageElement(index)
            imageFragment.appendChild(imageElement)
            imageMap.set(index, imageElement)
        }
        imageContainer.appendChild(imageFragment)
    }

    function showContainer(imageCount) {
        if (imageCount < startImageIndex) return

        // Jellyfin 10.11.x DOM 选择器（多级降级）
        const primaryDiv =
            // 方法1: 寻找演员/卡司区
            document.querySelector('.itemDetailPage .peopleSection') ||
            document.querySelector('.itemDetailPage .detailSectionContent:last-child') ||
            // 方法2: 寻找详情页内容区末尾
            document.querySelector('.itemDetailPage .detailPagePrimaryContent') ||
            document.querySelector('.itemDetailPage .detailPageContent') ||
            document.querySelector('.itemDetailPage') ||
            // 方法3: 旧版兼容
            document.querySelector('#itemDetailPage:not(.hide) #castCollapsible') ||
            document.querySelector('.itemView:not(.hide) .peopleSection') ||
            document.querySelector('.itemView:not(.hide)')
        if (!primaryDiv) return

        imageContainer.style.display = 'block'

        // 插入到 primaryDiv 之后（若已存在则不重复插入）
        if (!primaryDiv.parentNode?.contains(imageContainer)) {
            primaryDiv.insertAdjacentElement('afterend', imageContainer)
        }
    }

    function isDetailsPage() {
        // 兼容多种 URL 格式
        return location.hash.includes('/details')
            || location.hash.includes('/item')
            || location.pathname.includes('/details')
            || location.pathname.includes('/item')
    }

    // ========== 修复的核心：获取 Backdrop 图片数量 ==========

    // 缓存 BackdropImageTags，避免重复请求
    const backdropCache = new Map()

    async function getEndImageIndex() {
        const id = getCurrentItemId()
        if (!id) return 0

        // 检查缓存
        if (backdropCache.has(id)) {
            return backdropCache.get(id)
        }

        // 方法 1：单次 API 请求获取 BackdropImageTags
        // 浏览器附带 Jellyfin 会话 Cookie，无需额外鉴权
        try {
            const resp = await fetch(`${location.origin}/Items/${id}?Fields=BackdropImageTags`, {
                credentials: 'same-origin'
            })
            if (resp.ok) {
                const data = await resp.json()
                const tags = data?.BackdropImageTags
                if (tags?.length) {
                    const maxIdx = tags.length - 1
                    backdropCache.set(id, maxIdx)
                    return maxIdx
                } else {
                    backdropCache.set(id, 0)
                    return 0
                }
            }
        } catch (e) {
            console.warn('[Jellyfin剧照] API 请求失败，使用 HEAD 探测:', e.message)
        }

        // 方法 2：作为 ApiClient 获取（旧版兼容）
        if (typeof ApiClient !== 'undefined') {
            try {
                const userId =
                    (typeof ApiClient.getCurrentUserId === 'function' && ApiClient.getCurrentUserId()) ||
                    ApiClient._serverInfo?.UserId ||
                    ApiClient.serverInfo()?.UserId ||
                    null
                if (userId) {
                    const response = await ApiClient.getItem(userId, id)
                    if (response?.BackdropImageTags?.length) {
                        const maxIdx = response.BackdropImageTags.length - 1
                        backdropCache.set(id, maxIdx)
                        return maxIdx
                    }
                }
            } catch (e) {
                console.warn('[Jellyfin剧照] ApiClient.getItem 失败:', e.message)
            }
        }

        // 方法 3：并行 HEAD 探测（最终降级）
        const probeLimit = 25
        const probes = []
        for (let i = startImageIndex; i <= startImageIndex + probeLimit; i++) {
            probes.push(
                fetch(getBackgroundImageSrc(i), { method: 'HEAD' })
                    .then(r => r.ok ? i : -1)
                    .catch(() => -1)
            )
        }
        const results = await Promise.all(probes)
        const valid = results.filter(r => r >= 0)
        const maxIdx = valid.length > 0 ? Math.max(...valid) : 0
        backdropCache.set(id, maxIdx)
        return maxIdx
    }

    // ========== 页面加载检测 ==========

    async function loadImages() {
        if (!isDetailsPage()) return
        const currentItemId = getCurrentItemId()
        if (!currentItemId) return

        // 显示加载状态
        imageContainer.innerHTML = '<div style="padding:10px;color:#999;font-size:12px;">加载剧照中...</div>'
        imageContainer.style.display = 'block'

        // 如果 itemId 变了，重新获取图片数量
        if (itemId !== currentItemId) {
            endImageIndex = await getEndImageIndex()
        }
        itemId = currentItemId
        imageContainer.innerHTML = ''
        imageMap.clear()
        appendImagesToContainer(endImageIndex)
        showContainer(endImageIndex)
    }

    // ========== 导航监测（节流优化版） ==========

    // 使用 requestAnimationFrame 节流的 MutationObserver
    let rafId = null
    const navigationObserver = new MutationObserver(() => {
        const url = location.href
        if (url !== lastUrl) {
            lastUrl = url
            if (isDetailsPage()) {
                if (rafId) cancelAnimationFrame(rafId)
                rafId = requestAnimationFrame(() => {
                    rafId = null
                    debouncedLoadImages(300)
                })
            }
        }
    })

    navigationObserver.observe(document.querySelector('title') || document.head || document.documentElement, {
        childList: true,
        subtree: false,
        attributes: false
    })

    // viewshow 事件作为备份（同样节流）
    document.addEventListener('viewshow', () => debouncedLoadImages(200))

    // ========== 交互事件 ==========

    function handleLeftButtonClick(e) {
        e.stopPropagation()
        if (currentZoomedImageIndex === -1) return
        if (currentZoomedImageIndex > startImageIndex) {
            currentZoomedImageIndex--
        } else {
            currentZoomedImageIndex = endImageIndex
        }
        changeImageIndex(currentZoomedImageIndex)
    }

    function handleRightButtonClick(e) {
        e.stopPropagation()
        if (currentZoomedImageIndex === -1) return
        if (currentZoomedImageIndex < endImageIndex) {
            currentZoomedImageIndex++
        } else {
            currentZoomedImageIndex = startImageIndex
        }
        changeImageIndex(currentZoomedImageIndex)
    }

    function handleKeydown(e) {
        if (currentZoomedImageIndex === -1) return
        e.stopPropagation()
        if (e.key === 'ArrowLeft') {
            handleLeftButtonClick(e)
        } else if (e.key === 'ArrowRight') {
            handleRightButtonClick(e)
        } else if (e.key === 'Escape') {
            hideZoomedMask()
        }
    }

    function clickMenu() {
        GM_unregisterMenuCommand(startMenuEventId)
        if (startImageIndex < 2) {
            startImageIndex++
        } else {
            startImageIndex = 0
        }
        GM_setValue('startImageIndex', startImageIndex)
        registerMenuListener()
        hideZoomedMask()
        loadImages()
    }

    function registerMenuListener() {
        startMenuEventId = GM_registerMenuCommand(`从第${startImageIndex + 1}张开始`, clickMenu, {
            autoClose: false,
            accessKey: 's',
            title: '第一、二张剧照一般是封面，可以选择是否显示它们'
        })
    }

    function registerEventListeners() {
        document.addEventListener('keydown', handleKeydown)
        leftButton.addEventListener('click', handleLeftButtonClick)
        rightButton.addEventListener('click', handleRightButtonClick)
        zoomedMask.addEventListener('click', hideZoomedMask)
        zoomedImageWrapper.addEventListener('click', handleRightButtonClick)
        zoomedMask.addEventListener('wheel', e => {
            e.preventDefault()
            e.stopPropagation()
            if (currentZoomedImageIndex === -1) return
            if (e.deltaY > 0) {
                handleRightButtonClick(e)
            } else {
                handleLeftButtonClick(e)
            }
        })
    }

    function start() {
        document.body.appendChild(zoomedMask)
        registerEventListeners()
        registerMenuListener()
    }

    start()

    // ========== CSS 样式 ==========

    const css = `
        #jv-image-container {
            display: none;
            background: rgba(0, 0, 0, 0.15);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 25px;
        }

        .jv-image {
            max-height: 150px;   /* 减小缩略图高度 */
            margin: 6px;
            cursor: zoom-in;
            user-select: none;
            border-radius: 4px;
        }

        #jv-zoom-mask {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px;
            z-index: 1100;
            cursor: zoom-out;
        }

        #jv-zoom-img-wrapper {
            position: absolute;
            display: flex;
            flex-flow: column wrap;
            align-items: flex-end;
            user-select: none;
            cursor: pointer;
            
        }
        #jv-zoom-img-wrapper.animate {
            transition: left 0.4s ease, top 0.4s ease, width 0.4s ease;
        }

        #jv-zoom-img {
            width: 100%;
        }

        #jv-zoom-img-desc {
            color: #cccccc;
            font-size: 12px;
            position: absolute;
            bottom: 0;
            right: 0;
            transform: translate(0, calc(100% + 4px));
        }

        .jv-zoom-btn {
            padding: 20px;
            cursor: pointer;
            background: transparent;
            border: 0;
            outline: none;
            box-shadow: none;
            opacity: 0.7;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: auto;
            margin-bottom: auto;
        }

        .jv-zoom-btn:hover {
            opacity: 1;
        }

        .jv-zoom-btn:before {
            content: '';
            display: block;
            width: 0;
            height: 0;
            border: medium inset transparent;
            border-top-width: 21px;
            border-bottom-width: 21px;
        }

        .jv-zoom-btn.jv-left-btn:before {
            border-right: 27px solid white;
        }

        .jv-zoom-btn.jv-right-btn:before {
            border-left: 27px solid white;
        }
    `
    GM_addStyle(css)
})()
