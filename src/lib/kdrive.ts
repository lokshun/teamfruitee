const PROPFIND_BODY = `<?xml version="1.0" encoding="utf-8"?><D:propfind xmlns:D="DAV:"><D:prop><D:displayname/><D:getcontenttype/><D:getcontentlength/><D:resourcetype/></D:prop></D:propfind>`

function getBase(): string {
  const url = process.env.KDRIVE_WEBDAV_URL
  if (!url) throw new Error("Variable KDRIVE_WEBDAV_URL manquante dans .env.local")
  return url.replace(/\/$/, "")
}

function getAuth(): string {
  const u = process.env.KDRIVE_USERNAME
  const p = process.env.KDRIVE_PASSWORD
  if (!u || !p) throw new Error("Variables KDRIVE_USERNAME ou KDRIVE_PASSWORD manquantes")
  return `Basic ${Buffer.from(`${u}:${p}`).toString("base64")}`
}

export interface KDriveFile {
  id: string        // chemin WebDAV décodé, ex: "/Comptes rendus/CR.pdf"
  name: string
  type: "file" | "dir"
  mime_type: string
  size: number
}

function parseWebDAVListing(xml: string, requestedPath: string): KDriveFile[] {
  const blockPattern = /<[^:>\s]+:response[\s>][\s\S]*?<\/[^:>\s]+:response>/gi
  const blocks = xml.match(blockPattern) ?? []

  const normalizedRequested = decodeURIComponent(requestedPath).replace(/\/+$/, "")
  const results: KDriveFile[] = []

  for (const block of blocks) {
    const rawHref = block.match(/<[^:>\s]+:href[^>]*>([\s\S]*?)<\/[^:>\s]+:href>/i)?.[1]?.trim() ?? ""
    const decodedHref = decodeURIComponent(rawHref).replace(/\/+$/, "")

    // Ignorer le dossier courant lui-même
    if (!decodedHref || decodedHref === normalizedRequested) continue

    const name =
      block.match(/<[^:>\s]+:displayname[^>]*>([\s\S]*?)<\/[^:>\s]+:displayname>/i)?.[1]?.trim() ||
      decodedHref.split("/").filter(Boolean).pop() ||
      ""
    const mimeType = block.match(/<[^:>\s]+:getcontenttype[^>]*>([\s\S]*?)<\/[^:>\s]+:getcontenttype>/i)?.[1]?.trim() ?? ""
    const size = parseInt(block.match(/<[^:>\s]+:getcontentlength[^>]*>([\s\S]*?)<\/[^:>\s]+:getcontentlength>/i)?.[1]?.trim() ?? "0") || 0
    const isDir = /<[^:>\s]+:collection[\s/>]/i.test(block)

    results.push({
      id: decodedHref,
      name,
      type: isDir ? "dir" : "file",
      mime_type: mimeType || (isDir ? "" : "application/octet-stream"),
      size,
    })
  }

  return results
}

export async function kdriveList(folderPath: string): Promise<KDriveFile[]> {
  const url = `${getBase()}${encodeURI(folderPath)}`

  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: getAuth(),
      Depth: "1",
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: PROPFIND_BODY,
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WebDAV PROPFIND error ${res.status}: ${text}`)
  }

  const xml = await res.text()
  return parseWebDAVListing(xml, folderPath)
}

export async function kdriveStream(filePath: string): Promise<Response> {
  return fetch(`${getBase()}${encodeURI(filePath)}`, {
    headers: { Authorization: getAuth() },
    cache: "no-store",
  })
}
