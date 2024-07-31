import browser from "webextension-polyfill";

function addBmailObject(jsFilePath: string): void {
    const script: HTMLScriptElement = document.createElement('script');
    script.src = browser.runtime.getURL(jsFilePath);
    script.onload = function () {
        script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

function addCustomStyles(cssFilePath: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = browser.runtime.getURL(cssFilePath);
    document.head.appendChild(link);
}

async function addCustomElements(htmlFilePath: string, targetSelectorMap: {
    [key: string]: (target: HTMLTemplateElement) => void
}): Promise<void> {
    try {
        const response = await fetch(browser.runtime.getURL(htmlFilePath));
        if (!response.ok) {
            throw new Error(`Failed to fetch ${htmlFilePath}: ${response.statusText}`);
        }
        const htmlContent = await response.text();
        const template = document.createElement('template');
        template.innerHTML = htmlContent;

        const hostname = window.location.hostname;
        for (const [key, appendFun] of Object.entries(targetSelectorMap)) {
            if (hostname.includes(key)) {
                appendFun(template);
                break;
            }
        }
    } catch (error) {
        console.error('Error loading custom elements:', error);
    }
}

function appendForGoogle(template: HTMLTemplateElement) {

}

function appendForQQ(template: HTMLTemplateElement) {

}

function appendFor126(template: HTMLTemplateElement) {
    // const targetElement = document.getElementById('dvMultiTab');
    const targetElement = document.querySelector('.js-component-tree.nui-tree');
    if (!targetElement) {
        console.log("failed to find target element");
        return;
    }
    const bmailElement = template.content.getElementById('bmail_left_menu-btn');
    targetElement.appendChild(bmailElement!.cloneNode(true));
}

function appendFor163(template: HTMLTemplateElement) {

}

const targetSelectorMap = {
    'mail.google.com': appendForGoogle,
    'mail.163.com': appendFor163,
    'mail.126.com': appendFor126,
    'wx.mail.qq.com': appendForQQ
};

document.addEventListener('DOMContentLoaded', () => {
    addBmailObject('js/inject.js');
    addCustomStyles('file/inject.css');
    addCustomElements('html/inject.html', targetSelectorMap).then(() => {
        console.log("content js run success")
    });
});