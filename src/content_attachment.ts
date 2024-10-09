export function checkAttachmentBtn(composeDiv: HTMLElement, template: HTMLTemplateElement): void {

    const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]') as HTMLInputElement;
    const fileInput = attachmentDiv?.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!fileInput) {
        console.log("----->>> file input not found");
        return;
    }

    fileInput.style.pointerEvents = 'none';
    fileInput.style.opacity = '0';

    if (getComputedStyle(attachmentDiv).position === 'static') {
        attachmentDiv.style.position = 'relative';
    }

    const overlayButton = template.content.getElementById('attachmentOverlayButton') as HTMLButtonElement | null;
    if (!overlayButton) {
        console.log("----->>> overlayButton not found");
        return;
    }

    overlayButton.addEventListener('click', (event) => handleOverlayButtonClick(event, fileInput));
    attachmentDiv.appendChild(overlayButton);
}

async function handleOverlayButtonClick(event: MouseEvent, fileInput: HTMLInputElement): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.multiple = true;

    tempInput.addEventListener('change', (event) => handleTempInputChange(event, fileInput));
    tempInput.click();
}

async function handleTempInputChange(event: Event, fileInput: HTMLInputElement): Promise<void> {
    const tempInput = event.target as HTMLInputElement;
    const files = tempInput.files;
    if (!files || files.length === 0) {
        console.log("----->>> No files selected.");
        return;
    }

    const fileArray = Array.from(files);

    try {
        const encryptedFiles = await Promise.all(
            fileArray.map(async (file) => {
                console.log("----->>> processing file:", file.name);
                const encryptedFile = await encryptFile(file);
                console.log("----->>> file encrypted:", encryptedFile.name);
                return encryptedFile;
            })
        );

        const dataTransfer = new DataTransfer();
        encryptedFiles.forEach((file) => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;

        const newEvent = new Event('change', {bubbles: true, cancelable: true});
        fileInput.dispatchEvent(newEvent);
    } catch (error) {
        console.error("------>>> File encryption failed:", error);
    }
}

function encryptFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const dataUrl = event.target?.result as string;
                const base64Data = dataUrl.split(',')[1];

                const encryptedBlob = new Blob([base64Data], {type: 'application/octet-stream'});
                const encryptedFile = new File([encryptedBlob], `${file.name}.bmail`, {
                    type: 'application/octet-stream',
                });
                console.log("----->>> encryption complete:", encryptedFile.name);
                resolve(encryptedFile);
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsDataURL(file);
    });
}
