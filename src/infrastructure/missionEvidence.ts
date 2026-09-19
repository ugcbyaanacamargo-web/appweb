export interface MissionEvidenceFile {
  name: string;
  type: string;
  size: number;
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

export function validateMissionEvidenceFiles(files: MissionEvidenceFile[]): void {
  if (files.length > MAX_FILES) {
    throw new Error('Selecione no máximo 3 imagens por Missão.');
  }
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type.toLowerCase())) {
      throw new Error('Formato de imagem não permitido. Use JPEG, PNG, WebP, HEIC ou HEIF.');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Cada imagem deve ter no máximo 5 MB.');
    }
  }
}

export async function missionFilesToDataUrls(files: FileList | null): Promise<string[]> {
  if (!files) return [];
  const selected = Array.from(files);
  validateMissionEvidenceFiles(selected);

  return Promise.all(selected.map(file => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler imagem.'));
    reader.readAsDataURL(file);
  })));
}
