import { formatMoney } from './format'

/**
 * The reminder text sent to the squad when a request needs votes.
 *
 * Written to read well as a WhatsApp message rather than as app copy: the
 * ninjas see it out of context, so it names the amount, the reason and what is
 * being asked of them, and ends with a link straight to the voting screen.
 */
export const buildVoteReminder = (mission, requiredApprovals) => {
  const approvals = mission.approval_count || 0
  const link = `${window.location.origin}/missions`

  const progress = requiredApprovals
    ? `${approvals} of ${requiredApprovals} approvals so far.`
    : `${approvals} approvals so far.`

  return [
    `*Naalak Ninjas Vault* — emergency fund request`,
    ``,
    `${mission.member_name} has asked for ${formatMoney(mission.amount)}.`,
    `Reason: ${mission.reason}`,
    ``,
    `${progress} Please approve or reject:`,
    link
  ].join('\n')
}

/**
 * Hands text to WhatsApp. `wa.me` is used rather than the Web Share API
 * because it behaves the same everywhere: the app on a phone, WhatsApp Web on
 * a desktop. The share sheet would be nicer on mobile but silently varies by
 * browser, and the squad is on WhatsApp regardless.
 *
 * Opened via a pre-created tab reference so a popup blocker cannot swallow it
 * on the slower desktop path.
 */
export const shareOnWhatsApp = (text) => {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  const opened = window.open(url, '_blank', 'noopener,noreferrer')

  // Blocked popups return null. Falling back to the same tab is better than
  // the button appearing to do nothing at all.
  if (!opened) window.location.href = url
}
