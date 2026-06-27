/**
 * Shared, human-friendly labels for a session's issueCategory.
 * Keeps the senior home and history page consistent.
 */
export function sessionCategoryLabel(issueCategory: string | null | undefined): string {
  if (issueCategory === 'scam_safety') return 'Pause & Check';
  if (issueCategory === 'scam_help') return 'Scam Help';
  if (issueCategory && issueCategory !== 'other') {
    return issueCategory.charAt(0).toUpperCase() + issueCategory.slice(1);
  }
  return 'General Help';
}
