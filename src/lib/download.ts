import axios from 'axios';

/**
 * Fetches a blob from the given URL (using axios so Authorization header is included)
 * and triggers a browser download with the filename discovered from Content-Disposition
 * or the provided fallback name.
 *
 * Throws an Error on failure with a message suitable for showing to users.
 */
export async function fetchBlobAndTriggerDownload(url: string, fallbackFilename = 'download') {
  try {
    const response = await axios.get(url, { responseType: 'blob' });

    const blob = new Blob([response.data]);
    const objectUrl = window.URL.createObjectURL(blob);

    // Attempt to extract filename from Content-Disposition header
    const disposition = (response.headers && (response.headers['content-disposition'] || response.headers['Content-Disposition'])) as string | undefined;
    let filename = fallbackFilename || 'download';

    if (disposition) {
      const fileNameMatch = /filename\*=UTF-8''([^;\n]+)/i.exec(disposition) || /filename="?([^";]+)"?/i.exec(disposition);
      if (fileNameMatch && fileNameMatch[1]) {
        try {
          filename = decodeURIComponent(fileNameMatch[1]);
        } catch {
          filename = fileNameMatch[1];
        }
      }
    }

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    // Append to DOM to make click work in Firefox
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objectUrl);
  } catch (err: unknown) {
    // Normalize axios error shapes and bubble a readable message
    if (err instanceof Error) {
      throw new Error(err.message || '下载失败');
    }

    // Fallback
    throw new Error('下载失败');
  }
}
