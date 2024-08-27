export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getElementViewLeft(element: HTMLElement) {
  let left = element.getBoundingClientRect().left;
  let parent = element.offsetParent as HTMLElement;
  while (parent) {
    left += parent.getBoundingClientRect().left;
    parent = parent.offsetParent as HTMLElement;
  }
  return left;
}

export function getElementViewTop(element: HTMLElement) {
  let top = element.getBoundingClientRect().top;
  let parent = element.offsetParent as HTMLElement;
  while (parent) {
    top += parent.getBoundingClientRect().top;
    parent = parent.offsetParent as HTMLElement;
  }
  return top;
}
