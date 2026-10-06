export function setGenerationNotice(root, generation) {
  if (!root) return;
  root.querySelector(':scope > .ai-generation-notice')?.remove();
  root.querySelectorAll('[data-generation-complete]').forEach(label => {
    label.textContent = generation?.partial ? label.dataset.generationPartial : label.dataset.generationComplete;
  });
  if (!generation?.partial) return;
  const notice = document.createElement('div');
  notice.className = 'ai-generation-notice print:hidden';
  notice.dataset.aiJobUi = 'true';
  notice.setAttribute('role', 'status');
  const title = document.createElement('h2');
  title.textContent = 'Draf belum lengkap';
  const description = document.createElement('p');
  const warnings = generation.warnings?.filter(Boolean) || [];
  description.textContent = warnings.length ? warnings.join(' ') : generation.missingSections?.length ? `Bagian belum tersedia: ${generation.missingSections.join(', ')}. Lengkapi dan tinjau sebelum digunakan.` : 'Sebagian isi belum tersedia. Lengkapi dan tinjau sebelum digunakan.';
  notice.append(title, description);
  root.prepend(notice);
}
