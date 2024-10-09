export function checkAttachmentBtn(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]') as HTMLElement;
    const fileInput = attachmentDiv?.querySelector('input[type="file"]') as HTMLInputElement;
    if (!fileInput) {
        console.log("----->>> file input not found");
        return;
    }
    fileInput.style.pointerEvents = 'none';
    fileInput.style.opacity = '0';

    if (getComputedStyle(attachmentDiv).position === 'static') {
        attachmentDiv.style.position = 'relative';
    }
    const overlayButton = template.content.getElementById('attachmentOverlayButton') as HTMLButtonElement;
    overlayButton.addEventListener('click', (event) => handleOverlayButtonClick(event, fileInput));
    attachmentDiv.appendChild(overlayButton);
}

// 单独的点击事件处理函数
async function handleOverlayButtonClick(event: MouseEvent, fileInput: HTMLInputElement): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.multiple = true;

    // 将 'change' 事件处理逻辑提取到单独的函数中
    tempInput.addEventListener('change', (event) => handleTempInputChange(event, tempInput, fileInput));

    // 触发临时文件输入元素的点击事件，打开文件选择对话框
    tempInput.click();
}

// 单独的 'change' 事件处理函数
async function handleTempInputChange(event: Event, tempInput: HTMLInputElement, fileInput: HTMLInputElement): Promise<void> {
    const files = tempInput.files;
    if (!files || files.length === 0) {
        console.log("----->>> No files selected.");
        return;
    }

    // 处理每个选中的文件
    const encryptedFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log("----->>> processing file:", file.name);
        try {
            const encryptedFile = await encryptFile(file);
            console.log("----->>> file encrypted:", encryptedFile.name);
            encryptedFiles.push(encryptedFile);
        } catch (error) {
            console.error('------>>> File encryption failed:', error);
            return;
        }
    }

    const dataTransfer = new DataTransfer();
    encryptedFiles.forEach((file) => dataTransfer.items.add(file));

    // 将加密后的文件赋值给原始的文件输入元素
    fileInput.files = dataTransfer.files;
    console.log("----->>> input files replaced with encrypted files");

    // 手动触发 'change' 事件，让后续流程处理加密后的文件
    const newEvent = new Event('change', {
        bubbles: true,
        cancelable: true,
    });
    fileInput.dispatchEvent(newEvent);
}

function encryptFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = '';

                const chunkSize = 0x8000; // 每次处理的块大小（32KB）
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binaryString += String.fromCharCode(...chunk);
                }

                const encryptedContent = btoa(binaryString);
                const encryptedBlob = new Blob([encryptedContent], {type: 'application/octet-stream'});
                const encryptedFile = new File([encryptedBlob], `${file.name}.encrypted`, {type: 'application/octet-stream'});
                console.log("----->>> encryption complete:", encryptedFile.name);
                resolve(encryptedFile);
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsArrayBuffer(file); // 读取文件为二进制数据
    });
}
