/** Descarga un Blob: enlace temporal -> click -> se revoca la URL (como pide el plan). */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    // se revoca después del click para que el navegador alcance a iniciar la descarga
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
