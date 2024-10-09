export function checkAttachmentBtn(composeDiv: HTMLElement) {
    const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]');
    const fileInput = attachmentDiv?.querySelector('input[type="file"]');
    console.log("------>>> attachmentDivs not found for mail composing", fileInput);

    if (!fileInput) {
        console.log("----->>> attachment input file not found");
        return;
    }

    fileInput.addEventListener('change', async (event) => {
        console.log("----->>> file input change event triggered");

        const input = event.target as HTMLInputElement;
        const files = input.files;

        if (!files || files.length === 0 || files[0].name.endsWith('.encrypted')) {
            console.log("----->>> No files found or file already encrypted.");
            return;
        }

        const file = files[0];
        console.log("----->>> processing file:", file.name);

        try {
            const encryptedFile = await encryptFile(file);
            console.log("----->>> file encrypted:", encryptedFile.name);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(encryptedFile);

            input.files = dataTransfer.files;
            console.log("----->>> input files replaced with encrypted file");

            const newEvent = new Event('change', {
                bubbles: true,
                cancelable: true,
            });
            input.dispatchEvent(newEvent);

        } catch (error) {
            console.error('------>>> File encryption failed:', error);
        }
    }, {capture: true});
}

function encryptFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = '';

                const chunkSize = 0x8000; // 32KB 每次处理的块大小
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binaryString += String.fromCharCode(...chunk);
                }

                const encryptedContent = btoa(binaryString);
                const encryptedBlob = new Blob([encryptedContent], {type: file.type});
                const encryptedFile = new File([encryptedBlob], `${file.name}.encrypted`, {type: file.type});
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
