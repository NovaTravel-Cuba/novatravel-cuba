// Cliente mínimo de la API de GitHub para guardar cambios desde el navegador.
const OWNER = "NovaTravel-Cuba";
const REPO = "novatravel-cuba";
const BRANCH = "main";
const API = `https://api.github.com/repos/${OWNER}/${REPO}`;

export const DATA_PATH = "src/data/site.json";

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function gh(token: string, path: string, init: RequestInit = {}, raw = false): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?.message ?? "";
    } catch {
      /* sin detalle */
    }
    throw new GitHubError(res.status, detail || `Error ${res.status}`);
  }
  return raw ? res.text() : res.json();
}

/** Lee el JSON de datos tal como está ahora en GitHub. */
export function loadSiteText(token: string): Promise<string> {
  return gh(token, `/contents/${DATA_PATH}?ref=${BRANCH}`, {}, true);
}

/** Comprueba que el token tiene permiso de escritura en el repositorio. */
export async function checkWriteAccess(token: string): Promise<boolean> {
  const repo = await gh(token, "");
  return !!repo?.permissions?.push;
}

export interface CommitFile {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
}

/** Sube varios archivos en un solo commit (así el sitio se publica una sola vez). */
export async function commitFiles(token: string, files: CommitFile[], message: string): Promise<void> {
  const ref = await gh(token, `/git/ref/heads/${BRANCH}`);
  const parent: string = ref.object.sha;
  const parentCommit = await gh(token, `/git/commits/${parent}`);

  const tree: { path: string; mode: string; type: string; sha: string }[] = [];
  for (const f of files) {
    const blob = await gh(token, "/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: f.content, encoding: f.encoding }),
    });
    tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
  }
  const newTree = await gh(token, "/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
  });
  const commit = await gh(token, "/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
  });
  await gh(token, `/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
}

/** Reduce la foto (máx. 1280 px de ancho) y la devuelve en base64 JPEG. */
export async function resizeToJpegBase64(file: File, maxWidth = 1280): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}
