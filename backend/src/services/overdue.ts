import type { Invoice, ReminderPolicy } from "../types.js";

export function daysOverdue(invoice: Invoice, now = new Date()): number {
  const due = new Date(invoice.dueDate);
  const diff = now.getTime() - due.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isEligible(invoice: Invoice, policy: ReminderPolicy, now = new Date()): { ok: boolean; reason: string } {
  if (invoice.status !== "unpaid") {
    return { ok: false, reason: `status is ${invoice.status}` };
  }

  const overdue = daysOverdue(invoice, now);
  if (overdue < policy.minimumOverdueDays) {
    return { ok: false, reason: `only ${overdue} day(s) overdue; policy requires ${policy.minimumOverdueDays}` };
  }

  if (invoice.reminderCount >= policy.maxReminders) {
    return { ok: false, reason: "max reminders reached" };
  }

  if (invoice.lastReminderAt) {
    const last = new Date(invoice.lastReminderAt);
    const cooldownMs = policy.cooldownDays * 24 * 60 * 60 * 1000;
    if (now.getTime() - last.getTime() < cooldownMs) {
      return { ok: false, reason: "cooldown still active" };
    }
  }

  return { ok: true, reason: `${overdue} day(s) overdue` };
}
